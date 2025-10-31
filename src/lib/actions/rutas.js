"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Obtener todas las rutas con filtros
 */
export async function getRutas(filtros = {}) {
  try {
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

    // Filtro de búsqueda
    if (search) {
      whereConditions.OR = [
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

    if (sucursalOrigenId && sucursalOrigenId !== "todos") {
      whereConditions.sucursalOrigenId = sucursalOrigenId;
    }

    if (sucursalDestinoId && sucursalDestinoId !== "todos") {
      whereConditions.sucursalDestinoId = sucursalDestinoId;
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
    return {
      success: false,
      error: "Error interno del servidor",
    };
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
    return {
      success: false,
      error: "Error interno del servidor",
    };
  }
}

/**
 * Crear una nueva ruta
 */
export async function createRuta(data) {
  try {
    // Validar datos requeridos
    if (
      !data.nombre ||
      !data.codigo ||
      !data.sucursalOrigenId ||
      !data.sucursalDestinoId
    ) {
      return {
        success: false,
        error: "Faltan campos obligatorios",
      };
    }

    // Verificar que el código no exista
    const existingRuta = await prisma.rutas.findFirst({
      where: {
        codigo: data.codigo,
        deletedAt: null,
      },
    });

    if (existingRuta) {
      return {
        success: false,
        error: "Ya existe una ruta con este código",
      };
    }

    // Calcular costo total
    const costoBase = parseFloat(data.costoBase) || 0;
    const costoPeajes = parseFloat(data.costoPeajes) || 0;
    const costoCombustible = parseFloat(data.costoCombustible) || 0;
    const costoTotal = costoBase + costoPeajes + costoCombustible;

    // Preparar datos para crear
    const rutaData = {
      nombre: data.nombre,
      codigo: data.codigo,
      descripcion: data.descripcion || null,
      tipo: data.tipo?.toUpperCase() || "URBANA",
      sucursalOrigenId: data.sucursalOrigenId,
      sucursalDestinoId: data.sucursalDestinoId,
      distancia: data.distancia ? parseFloat(data.distancia) : null,
      tiempoEstimado: data.tiempoEstimado
        ? parseInt(data.tiempoEstimado)
        : null,
      costoBase,
      costoPeajes,
      costoCombustible,
      costoTotal,
      tipoVehiculo: data.tipoVehiculo?.toUpperCase() || null,
      capacidadMaxima: data.capacidadMaxima
        ? parseFloat(data.capacidadMaxima)
        : null,
      paradas: data.paradas && data.paradas.length > 0 ? data.paradas : null,
      horarios:
        data.horarios && data.horarios.length > 0 ? data.horarios : null,
      observaciones: data.observaciones || null,
      activo: data.activo !== undefined ? data.activo : true,
    };

    const ruta = await prisma.rutas.create({
      data: rutaData,
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

    revalidatePath("/dashboard/rutas");

    return {
      success: true,
      data: ruta,
      message: "Ruta creada correctamente",
    };
  } catch (error) {
    return {
      success: false,
      error: "Error interno del servidor",
    };
  }
}

/**
 * Actualizar una ruta
 */
export async function updateRuta(id, data) {
  try {
    // Verificar que la ruta existe
    const existingRuta = await prisma.rutas.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingRuta) {
      return {
        success: false,
        error: "Ruta no encontrada",
      };
    }

    // Verificar código único (excluyendo la ruta actual)
    if (data.codigo && data.codigo !== existingRuta.codigo) {
      const duplicateRuta = await prisma.rutas.findFirst({
        where: {
          codigo: data.codigo,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (duplicateRuta) {
        return {
          success: false,
          error: "Ya existe una ruta con este código",
        };
      }
    }

    // Calcular costo total si se proporcionan costos
    let costoTotal = existingRuta.costoTotal;
    if (
      data.costoBase !== undefined ||
      data.costoPeajes !== undefined ||
      data.costoCombustible !== undefined
    ) {
      const costoBase =
        data.costoBase !== undefined
          ? parseFloat(data.costoBase)
          : existingRuta.costoBase;
      const costoPeajes =
        data.costoPeajes !== undefined
          ? parseFloat(data.costoPeajes)
          : existingRuta.costoPeajes;
      const costoCombustible =
        data.costoCombustible !== undefined
          ? parseFloat(data.costoCombustible)
          : existingRuta.costoCombustible;

      costoTotal = costoBase + costoPeajes + costoCombustible;
    }

    // Preparar datos para actualizar
    const updateData = {
      ...(data.nombre && { nombre: data.nombre }),
      ...(data.codigo && { codigo: data.codigo }),
      ...(data.descripcion !== undefined && {
        descripcion: data.descripcion,
      }),
      ...(data.tipo && { tipo: data.tipo.toUpperCase() }),
      ...(data.sucursalOrigenId && {
        sucursalOrigenId: data.sucursalOrigenId,
      }),
      ...(data.sucursalDestinoId && {
        sucursalDestinoId: data.sucursalDestinoId,
      }),
      ...(data.distancia !== undefined && {
        distancia: data.distancia ? parseFloat(data.distancia) : null,
      }),
      ...(data.tiempoEstimado !== undefined && {
        tiempoEstimado: data.tiempoEstimado
          ? parseInt(data.tiempoEstimado)
          : null,
      }),
      ...(data.costoBase !== undefined && {
        costoBase: parseFloat(data.costoBase) || 0,
      }),
      ...(data.costoPeajes !== undefined && {
        costoPeajes: parseFloat(data.costoPeajes) || 0,
      }),
      ...(data.costoCombustible !== undefined && {
        costoCombustible: parseFloat(data.costoCombustible) || 0,
      }),
      costoTotal,
      ...(data.tipoVehiculo !== undefined && {
        tipoVehiculo: data.tipoVehiculo?.toUpperCase() || null,
      }),
      ...(data.capacidadMaxima !== undefined && {
        capacidadMaxima: data.capacidadMaxima
          ? parseFloat(data.capacidadMaxima)
          : null,
      }),
      ...(data.paradas !== undefined && {
        paradas: data.paradas && data.paradas.length > 0 ? data.paradas : null,
      }),
      ...(data.horarios !== undefined && {
        horarios:
          data.horarios && data.horarios.length > 0 ? data.horarios : null,
      }),
      ...(data.observaciones !== undefined && {
        observaciones: data.observaciones,
      }),
      ...(data.activo !== undefined && { activo: data.activo }),
      updatedAt: new Date(),
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

    revalidatePath("/dashboard/rutas");

    return {
      success: true,
      data: ruta,
      message: "Ruta actualizada correctamente",
    };
  } catch (error) {
    return {
      success: false,
      error: "Error interno del servidor",
    };
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

    return {
      success: true,
      message: "Ruta eliminada correctamente",
    };
  } catch (error) {
    return {
      success: false,
      error: "Error interno del servidor",
    };
  }
}

/**
 * Obtener estadísticas de rutas
 */
export async function getEstadisticasRutas() {
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
    return {
      success: false,
      error: "Error interno del servidor",
    };
  }
}

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
    return {
      success: false,
      error: "Error interno del servidor",
    };
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
    return {
      success: false,
      error: "Error interno del servidor",
    };
  }
}
