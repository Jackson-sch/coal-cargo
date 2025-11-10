"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  RutaCreateSchema,
  RutaUpdateSchema,
  RutaSearchSchema,
} from "@/lib/validaciones-zod";
import { auth } from "@/lib/auth";
import { handleServerActionError, logError } from "@/lib/utils/error-handler";
import { CACHE_TAGS, cacheEstadisticas } from "@/lib/utils/cache";

// Función auxiliar para verificar permisos
async function checkPermissions(requiredRoles = []) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(session.user.role)) {
    throw new Error("Permisos insuficientes");
  }

  return session.user;
}

/**
 * Obtener todas las rutas con filtros
 */
export async function getRutas(filtros = {}) {
  try {
    const session = await auth();
    
    // Verificar permisos (permitir a todos los roles autenticados para ver)
    if (!session?.user) {
      return {
        success: false,
        error: "No autorizado",
      };
    }

    const user = session.user;

    const {
      search,
      tipo,
      estado,
      activo,
      sucursalOrigenId,
      sucursalDestinoId,
      page = 1,
      limit = 50,
    } = filtros;

    const whereConditions = {
      deletedAt: null,
    };

    // Filtro automático por sucursal para ADMIN_SUCURSAL
    if (user.role === "ADMIN_SUCURSAL" && user.sucursalId) {
      // ADMIN_SUCURSAL solo puede ver rutas que involucren su sucursal
      whereConditions.OR = [
        { sucursalOrigenId: user.sucursalId },
        { sucursalDestinoId: user.sucursalId },
      ];
    } else if (user.role === "SUPER_ADMIN") {
      // SUPER_ADMIN puede filtrar por sucursal si lo especifica
      if (sucursalOrigenId && sucursalOrigenId !== "todos") {
        whereConditions.sucursalOrigenId = sucursalOrigenId;
      }

      if (sucursalDestinoId && sucursalDestinoId !== "todos") {
        whereConditions.sucursalDestinoId = sucursalDestinoId;
      }
    }

    // Filtros específicos
    if (tipo && tipo !== "todos") {
      whereConditions.tipo = tipo.toUpperCase();
    }

    if (estado && estado !== "todos") {
      whereConditions.estado = estado.toUpperCase();
    }

    if (activo !== undefined) {
      if (activo === "activo") {
        whereConditions.activo = true;
      } else if (activo === "inactivo") {
        whereConditions.activo = false;
      }
    }

    // Filtro de búsqueda (combinar con filtros existentes)
    if (search) {
      const searchConditions = [
        { nombre: { contains: search, mode: "insensitive" } },
        { codigo: { contains: search, mode: "insensitive" } },
        {
          sucursalOrigen: { nombre: { contains: search, mode: "insensitive" } },
        },
        {
          sucursalDestino: {
            nombre: { contains: search, mode: "insensitive" },
          },
        },
      ];

      // Si ya hay un OR (filtro de sucursal), usar AND
      if (whereConditions.OR) {
        whereConditions.AND = [
          { OR: whereConditions.OR },
          { OR: searchConditions },
        ];
        delete whereConditions.OR;
      } else {
        whereConditions.OR = searchConditions;
      }
    }

    // Calcular offset para paginación
    const skip = (page - 1) * limit;

    // Obtener rutas con relaciones
    const [rutas, totalCount] = await Promise.all([
      prisma.rutas.findMany({
        where: whereConditions,
        include: {
          sucursalOrigen: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
            },
          },
          sucursalDestino: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.rutas.count({ where: whereConditions }),
    ]);

    return {
      success: true,
      data: {
        rutas,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    logError(error, { context: "getRutas", filtros });
    return handleServerActionError(error);
  }
}

/**
 * Obtener una ruta por ID
 */
export async function getRutaById(id) {
  try {
    const ruta = await prisma.rutas.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        sucursalOrigen: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
          },
        },
        sucursalDestino: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
          },
        },
      },
    });

    if (!ruta) {
      return {
        success: false,
        error: "Ruta no encontrada",
      };
    }

    return {
      success: true,
      data: ruta,
    };
  } catch (error) {
    logError(error, { context: "getRutaById", id });
    return handleServerActionError(error);
  }
}

/**
 * Crear una nueva ruta
 */
export async function createRuta(formData) {
  try {
    const user = await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    // Validar datos con Zod
    const validatedData = RutaCreateSchema.parse(formData);

    // Si es ADMIN_SUCURSAL, validar que la ruta involucre su sucursal
    if (user.role === "ADMIN_SUCURSAL" && user.sucursalId) {
      const involucraSuSucursal =
        validatedData.sucursalOrigenId === user.sucursalId ||
        validatedData.sucursalDestinoId === user.sucursalId;

      if (!involucraSuSucursal) {
        return {
          success: false,
          error: "La ruta debe involucrar tu sucursal como origen o destino",
        };
      }
    }

    // Verificar que el código no exista
    const existingRuta = await prisma.rutas.findFirst({
      where: {
        codigo: validatedData.codigo,
        deletedAt: null,
      },
    });

    if (existingRuta) {
      return {
        success: false,
        error: "Ya existe una ruta con este código",
        field: "codigo",
      };
    }

    // Calcular costo total
    const costoTotal =
      validatedData.costoBase +
      validatedData.costoPeajes +
      validatedData.costoCombustible;

    // Preparar datos para crear
    const rutaData = {
      nombre: validatedData.nombre,
      codigo: validatedData.codigo,
      descripcion: validatedData.descripcion || null,
      tipo: validatedData.tipo,
      estado: validatedData.estado || "PROGRAMADA",
      activo: validatedData.activo !== undefined ? validatedData.activo : true,
      sucursalOrigenId: validatedData.sucursalOrigenId,
      sucursalDestinoId: validatedData.sucursalDestinoId,
      distancia: validatedData.distancia || null,
      tiempoEstimado: validatedData.tiempoEstimado || null,
      costoBase: validatedData.costoBase,
      costoPeajes: validatedData.costoPeajes,
      costoCombustible: validatedData.costoCombustible,
      costoTotal,
      tipoVehiculo: validatedData.tipoVehiculo || null,
      capacidadMaxima: validatedData.capacidadMaxima || null,
      paradas:
        validatedData.paradas && validatedData.paradas.length > 0
          ? validatedData.paradas
          : null,
      horarios:
        validatedData.horarios && validatedData.horarios.length > 0
          ? validatedData.horarios
          : null,
      observaciones: validatedData.observaciones || null,
    };

    const ruta = await prisma.rutas.create({
      data: rutaData,
      include: {
        sucursalOrigen: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            provincia: true,
          },
        },
        sucursalDestino: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            provincia: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/rutas");
    // Invalidar cache relacionado
    revalidateTag(CACHE_TAGS.RUTAS);
    revalidateTag(CACHE_TAGS.ESTADISTICAS);

    return {
      success: true,
      data: ruta,
      message: "Ruta creada correctamente",
    };
  } catch (error) {
    logError(error, { context: "createRuta", formData });
    return handleServerActionError(error);
  }
}

/**
 * Actualizar una ruta
 */
export async function updateRuta(id, formData) {
  try {
    const user = await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    // Verificar que la ruta existe
    const existingRuta = await prisma.rutas.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: { sucursalOrigenId: true, sucursalDestinoId: true },
    });

    if (!existingRuta) {
      return {
        success: false,
        error: "Ruta no encontrada",
      };
    }

    // Si es ADMIN_SUCURSAL, validar que la ruta involucre su sucursal
    if (user.role === "ADMIN_SUCURSAL" && user.sucursalId) {
      const involucraSuSucursal =
        existingRuta.sucursalOrigenId === user.sucursalId ||
        existingRuta.sucursalDestinoId === user.sucursalId;

      if (!involucraSuSucursal) {
        return {
          success: false,
          error: "No tienes permisos para modificar esta ruta",
        };
      }

      // Validar que la ruta actualizada también involucre su sucursal
      if (formData.sucursalOrigenId || formData.sucursalDestinoId) {
        const nuevaInvolucraSuSucursal =
          (formData.sucursalOrigenId || existingRuta.sucursalOrigenId) === user.sucursalId ||
          (formData.sucursalDestinoId || existingRuta.sucursalDestinoId) === user.sucursalId;

        if (!nuevaInvolucraSuSucursal) {
          return {
            success: false,
            error: "La ruta debe involucrar tu sucursal como origen o destino",
          };
        }
      }
    }

    // Validar datos con Zod (solo los campos proporcionados)
    const cleanData = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== undefined && value !== "")
    );

    const validatedData = RutaUpdateSchema.parse(cleanData);

    // Verificar código único (excluyendo la ruta actual)
    if (validatedData.codigo && validatedData.codigo !== existingRuta.codigo) {
      const duplicateRuta = await prisma.rutas.findFirst({
        where: {
          codigo: validatedData.codigo,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (duplicateRuta) {
        return {
          success: false,
          error: "Ya existe una ruta con este código",
          field: "codigo",
        };
      }
    }

    // Calcular costo total
    const costoBase = validatedData.costoBase !== undefined 
      ? validatedData.costoBase 
      : existingRuta.costoBase;
    const costoPeajes = validatedData.costoPeajes !== undefined 
      ? validatedData.costoPeajes 
      : existingRuta.costoPeajes;
    const costoCombustible = validatedData.costoCombustible !== undefined 
      ? validatedData.costoCombustible 
      : existingRuta.costoCombustible;
    const costoTotal = costoBase + costoPeajes + costoCombustible;

    // Preparar datos para actualizar
    const updateData = {
      ...(validatedData.nombre && { nombre: validatedData.nombre }),
      ...(validatedData.codigo && { codigo: validatedData.codigo }),
      ...(validatedData.descripcion !== undefined && {
        descripcion: validatedData.descripcion,
      }),
      ...(validatedData.tipo && { tipo: validatedData.tipo }),
      ...(validatedData.estado && { estado: validatedData.estado }),
      ...(validatedData.sucursalOrigenId && {
        sucursalOrigenId: validatedData.sucursalOrigenId,
      }),
      ...(validatedData.sucursalDestinoId && {
        sucursalDestinoId: validatedData.sucursalDestinoId,
      }),
      ...(validatedData.distancia !== undefined && {
        distancia: validatedData.distancia,
      }),
      ...(validatedData.tiempoEstimado !== undefined && {
        tiempoEstimado: validatedData.tiempoEstimado,
      }),
      costoBase,
      costoPeajes,
      costoCombustible,
      costoTotal,
      ...(validatedData.tipoVehiculo !== undefined && {
        tipoVehiculo: validatedData.tipoVehiculo,
      }),
      ...(validatedData.capacidadMaxima !== undefined && {
        capacidadMaxima: validatedData.capacidadMaxima,
      }),
      ...(validatedData.paradas !== undefined && {
        paradas: validatedData.paradas,
      }),
      ...(validatedData.horarios !== undefined && {
        horarios: validatedData.horarios,
      }),
      ...(validatedData.observaciones !== undefined && {
        observaciones: validatedData.observaciones,
      }),
      ...(validatedData.activo !== undefined && { activo: validatedData.activo }),
    };

    const ruta = await prisma.rutas.update({
      where: { id },
      data: updateData,
      include: {
        sucursalOrigen: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            provincia: true,
          },
        },
        sucursalDestino: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            provincia: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/rutas");
    // Invalidar cache relacionado
    revalidateTag(CACHE_TAGS.RUTAS);
    revalidateTag(CACHE_TAGS.ESTADISTICAS);

    return {
      success: true,
      data: ruta,
      message: "Ruta actualizada correctamente",
    };
  } catch (error) {
    logError(error, { context: "updateRuta", id, formData });
    return handleServerActionError(error);
  }
}

/**
 * Eliminar una ruta (soft delete)
 */
export async function deleteRuta(id) {
  try {
    const ruta = await prisma.rutas.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!ruta) {
      return {
        success: false,
        error: "Ruta no encontrada",
      };
    }

    await prisma.rutas.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        activo: false,
      },
    });

    revalidatePath("/dashboard/rutas");
    // Invalidar cache relacionado
    revalidateTag(CACHE_TAGS.RUTAS);
    revalidateTag(CACHE_TAGS.ESTADISTICAS);

    return {
      success: true,
      message: "Ruta eliminada correctamente",
    };
  } catch (error) {
    logError(error, { context: "deleteRuta", id });
    return handleServerActionError(error);
  }
}

/**
 * Obtener estadísticas de rutas (función interna)
 */
const _getEstadisticasRutas = async () => {
  try {
    const [
      totalRutas,
      rutasActivas,
      rutasInactivas,
      distanciaTotal,
      costoPromedio,
      rutasPorTipo,
    ] = await Promise.all([
      // Total de rutas
      prisma.rutas.count({
        where: { deletedAt: null },
      }),
      // Rutas activas
      prisma.rutas.count({
        where: {
          deletedAt: null,
          activo: true,
        },
      }),
      // Rutas inactivas
      prisma.rutas.count({
        where: {
          deletedAt: null,
          activo: false,
        },
      }),
      // Distancia total
      prisma.rutas.aggregate({
        where: {
          deletedAt: null,
          distancia: { not: null },
        },
        _sum: { distancia: true },
      }),
      // Costo promedio
      prisma.rutas.aggregate({
        where: {
          deletedAt: null,
          costoTotal: { gt: 0 },
        },
        _avg: { costoTotal: true },
      }),
      // Rutas por tipo
      prisma.rutas.groupBy({
        by: ["tipo"],
        where: { deletedAt: null },
        _count: { tipo: true },
      }),
    ]);

    return {
      success: true,
      data: {
        totalRutas,
        rutasActivas,
        rutasInactivas,
        distanciaTotal: distanciaTotal._sum.distancia || 0,
        costoPromedio: costoPromedio._avg.costoTotal || 0,
        rutasPorTipo: rutasPorTipo.reduce((acc, item) => {
          acc[item.tipo] = item._count.tipo;
          return acc;
        }, {}),
      },
    };
  } catch (error) {
    logError(error, { context: "getEstadisticasRutas" });
    return handleServerActionError(error);
  }
};

// Exportar versión cacheada
export const getEstadisticasRutas = cacheEstadisticas(
  _getEstadisticasRutas,
  ["estadisticas-rutas"]
);

/**
 * Obtener rutas entre dos sucursales
 */
export async function getRutasEntreSucursales(origenId, destinoId) {
  try {
    const rutas = await prisma.rutas.findMany({
      where: {
        deletedAt: null,
        activo: true,
        sucursalOrigenId: origenId,
        sucursalDestinoId: destinoId,
      },
      include: {
        sucursalOrigen: {
          select: {
            id: true,
            nombre: true,
          },
        },
        sucursalDestino: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { costoTotal: "asc" },
    });

    return {
      success: true,
      data: rutas,
    };
  } catch (error) {
    logError(error, { context: "getRutas", filtros });
    return handleServerActionError(error);
  }
}

/**
 * Optimizar rutas (simulación de algoritmo de optimización)
 */
export async function optimizarRutas() {
  try {
    // Obtener todas las rutas activas
    const rutas = await prisma.rutas.findMany({
      where: {
        deletedAt: null,
        activo: true,
      },
      include: {
        sucursalOrigen: true,
        sucursalDestino: true,
      },
    });

    // Simulación de optimización (en un caso real, aquí iría el algoritmo de optimización)
    const optimizaciones = [];

    for (const ruta of rutas) {
      // Simular análisis de optimización
      const ahorroPotencial = Math.random() * 20; // 0-20% de ahorro
      const nuevoCosto = ruta.costoTotal * (1 - ahorroPotencial / 100);

      if (ahorroPotencial > 5) {
        // Solo sugerir si el ahorro es > 5%
        optimizaciones.push({
          rutaId: ruta.id,
          rutaNombre: ruta.nombre,
          costoActual: ruta.costoTotal,
          costoOptimizado: nuevoCosto,
          ahorro: ruta.costoTotal - nuevoCosto,
          porcentajeAhorro: ahorroPotencial,
          sugerencias: [
            "Consolidar paradas intermedias",
            "Optimizar horarios de salida",
            "Usar ruta alternativa más eficiente",
          ],
        });
      }
    }

    return {
      success: true,
      data: {
        rutasAnalizadas: rutas.length,
        optimizacionesEncontradas: optimizaciones.length,
        ahorroTotal: optimizaciones.reduce((sum, opt) => sum + opt.ahorro, 0),
        optimizaciones,
      },
      message: `Análisis completado. Se encontraron ${optimizaciones.length} oportunidades de optimización.`,
    };
  } catch (error) {
    logError(error, { context: "getRutas", filtros });
    return handleServerActionError(error);
  }
}
