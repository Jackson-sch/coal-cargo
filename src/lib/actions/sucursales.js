"use server";

import { prisma } from "@/lib/prisma";

/**
 * Obtener todas las sucursales activas
 */
export async function getSucursales() {
  try {
    const sucursales = await prisma.sucursales.findMany({
      where: {
        deletedAt: null,
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
 * Obtener estadísticas de sucursales
 */
export async function getEstadisticasSucursales() {
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
              envios_envios_origenIdTosucursales: {
                some: {
                  createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
                  },
                },
              },
            },
            {
              envios_envios_destinoIdTosucursales: {
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
        by: ["origenId"],
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
    const sucursalesIds = enviosPorSucursal.map((item) => item.origenId);
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
      const sucursal = sucursalesInfo.find((s) => s.id === item.origenId);
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
}
