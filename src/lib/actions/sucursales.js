"use server";

import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS, cacheEstadisticas, cacheDatosEstaticos } from "@/lib/utils/cache";

/**
 * Obtener todas las sucursales activas (con soporte para paginación)
 */
export async function getSucursales(filtros = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      provincia = "",
    } = filtros;

    const whereConditions = {
      deletedAt: null,
    };

    // Filtro de búsqueda
    if (search) {
      whereConditions.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { direccion: { contains: search, mode: "insensitive" } },
        { provincia: { contains: search, mode: "insensitive" } },
        { telefono: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filtro por provincia
    if (provincia && provincia !== "all") {
      whereConditions.provincia = { contains: provincia, mode: "insensitive" };
    }

    // Calcular offset para paginación
    const skip = (page - 1) * limit;

    // Obtener sucursales con relaciones y conteos
    const [sucursales, totalCount] = await Promise.all([
      prisma.sucursales.findMany({
        where: whereConditions,
        include: {
          _count: {
            select: {
              usuarios: true,
              enviosOrigen: true,
              enviosDestino: true,
            },
          },
        },
        orderBy: {
          nombre: "asc",
        },
        skip,
        take: limit,
      }),
      prisma.sucursales.count({ where: whereConditions }),
    ]);

    return {
      success: true,
      data: sucursales,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener las sucursales",
    };
  }
}

/**
 * Obtener sucursal por ID
 */
export async function getSucursalById(id) {
  try {
    const sucursal = await prisma.sucursales.findUnique({
      where: { id },
    });

    if (!sucursal) {
      return {
        success: false,
        error: "Sucursal no encontrada",
      };
    }

    return {
      success: true,
      data: sucursal,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener la sucursal",
    };
  }
}

/**
 * Crear nueva sucursal
 */
export async function createSucursal(data) {
  try {
    const { nombre, direccion, provincia, telefono } = data;

    if (!nombre || !direccion || !provincia) {
      return {
        success: false,
        error: "Nombre, dirección y provincia son requeridos",
      };
    }

    const nuevaSucursal = await prisma.sucursales.create({
      data: {
        id: `sucursal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nombre,
        direccion,
        provincia,
        telefono: telefono || null,
      },
    });

    // Invalidar cache relacionado
    revalidateTag(CACHE_TAGS.SUCURSALES);
    revalidateTag(CACHE_TAGS.ESTADISTICAS);

    return {
      success: true,
      data: nuevaSucursal,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al crear la sucursal",
    };
  }
}

/**
 * Actualizar sucursal
 */
export async function updateSucursal(id, data) {
  try {
    const { nombre, direccion, provincia, telefono } = data;

    if (!id) {
      return {
        success: false,
        error: "ID de sucursal requerido",
      };
    }

    if (!nombre || !direccion || !provincia) {
      return {
        success: false,
        error: "Nombre, dirección y provincia son requeridos",
      };
    }

    const sucursalActualizada = await prisma.sucursales.update({
      where: { id },
      data: {
        nombre,
        direccion,
        provincia,
        telefono: telefono || null,
        updatedAt: new Date(),
      },
    });

    // Invalidar cache relacionado
    revalidateTag(CACHE_TAGS.SUCURSALES);
    revalidateTag(CACHE_TAGS.ESTADISTICAS);

    return {
      success: true,
      data: sucursalActualizada,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al actualizar la sucursal",
    };
  }
}

/**
 * Eliminar sucursal (soft delete)
 */
export async function deleteSucursal(id) {
  try {
    if (!id) {
      return {
        success: false,
        error: "ID de sucursal requerido",
      };
    }

    // Verificar si la sucursal tiene envíos asociados
    const enviosAsociados = await prisma.envios.count({
      where: {
        OR: [{ origenId: id }, { destinoId: id }],
        deletedAt: null,
      },
    });

    if (enviosAsociados > 0) {
      return {
        success: false,
        error: "No se puede eliminar la sucursal porque tiene envíos asociados",
      };
    }

    // Soft delete
    await prisma.sucursales.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Invalidar cache relacionado
    revalidateTag(CACHE_TAGS.SUCURSALES);
    revalidateTag(CACHE_TAGS.ESTADISTICAS);

    return {
      success: true,
      message: "Sucursal eliminada correctamente",
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al eliminar la sucursal",
    };
  }
}

/**
 * Obtener estadísticas de sucursales (cacheada)
 */
const _getEstadisticasSucursales = async () => {
  try {
    const [
      totalSucursales,
      sucursalesActivas,
      totalEnvios,
      totalTarifas,
      totalUsuarios,
      enviosPorSucursal,
    ] = await Promise.all([
      // Total de sucursales
      prisma.sucursales.count({
        where: { deletedAt: null },
      }),
      // Sucursales activas (que han tenido actividad reciente)
      prisma.sucursales.count({
        where: {
          deletedAt: null,
          OR: [
            {
              enviosOrigen: {
                some: {
                  createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
                  },
                },
              },
            },
            {
              enviosDestino: {
                some: {
                  createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  },
                },
              },
            },
          ],
        },
      }),
      // Total de envíos
      prisma.envios.count({
        where: { deletedAt: null },
      }),
      // Total de tarifas configuradas
      prisma.tarifas_sucursales.count({
        where: { activo: true },
      }),
      // Total de usuarios
      prisma.usuarios.count({
        where: { deletedAt: null },
      }),
      // Envíos por sucursal (top 5)
      prisma.envios.groupBy({
        by: ["sucursalOrigenId"],
        where: { deletedAt: null },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 5,
      }),
    ]);

    // Obtener nombres de sucursales para el ranking
    const sucursalesIds = enviosPorSucursal.map((item) => item.sucursalOrigenId);
    const sucursalesInfo = await prisma.sucursales.findMany({
      where: {
        id: { in: sucursalesIds },
        deletedAt: null,
      },
      select: {
        id: true,
        nombre: true,
      },
    });

    const rankingSucursales = enviosPorSucursal.map((item) => {
      const sucursal = sucursalesInfo.find((s) => s.id === item.sucursalOrigenId);
      return {
        sucursal: sucursal?.nombre || "Sucursal no encontrada",
        envios: item._count.id,
      };
    });

    return {
      success: true,
      data: {
        totalSucursales,
        sucursalesActivas,
        totalEnvios,
        totalTarifas,
        totalUsuarios,
        rankingSucursales,
        resumen: {
          sucursalesInactivas: totalSucursales - sucursalesActivas,
          promedioEnviosPorSucursal:
            totalSucursales > 0 ? Math.round(totalEnvios / totalSucursales) : 0,
          promedioUsuariosPorSucursal:
            totalSucursales > 0
              ? Math.round(totalUsuarios / totalSucursales)
              : 0,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener las estadísticas de sucursales",
    };
  }
};

// Exportar versión cacheada
export const getEstadisticasSucursales = cacheEstadisticas(
  _getEstadisticasSucursales,
  ["estadisticas-sucursales"]
);

/**
 * Obtener todas las sucursales sin paginación (para dropdowns, cacheada)
 */
const _getSucursalesList = async () => {
  try {
    const sucursales = await prisma.sucursales.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        provincia: true,
      },
      orderBy: {
        nombre: "asc",
      },
    });

    return {
      success: true,
      data: sucursales,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener las sucursales",
    };
  }
};

export const getSucursalesList = cacheDatosEstaticos(
  _getSucursalesList,
  ["sucursales-list"],
  CACHE_TAGS.SUCURSALES
);
