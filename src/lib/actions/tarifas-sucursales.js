"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Obtener todas las tarifas entre sucursales
 */
export async function getTarifasSucursales() {
  try {
    const tarifas = await prisma.tarifas_sucursales.findMany({
      include: {
        sucursalOrigen: {
          select: {
            id: true,
            nombre: true,
            provincia: true,
          },
        },
        sucursalDestino: {
          select: {
            id: true,
            nombre: true,
            provincia: true,
          },
        },
      },
      orderBy: [
        { sucursalOrigen: { nombre: "asc" } },
        { sucursalDestino: { nombre: "asc" } },
      ],
    });

    return {
      success: true,
      data: tarifas,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener las tarifas de sucursales",
    };
  }
}

/**
 * Crear nueva tarifa entre sucursales
 */
export async function createTarifaSucursal(data) {
  try {
    const {
      sucursalOrigenId,
      sucursalDestinoId,
      precioBase,
      precioKg,
      tiempoEstimado,
      observaciones,
    } = data;

    // Validaciones
    if (
      !sucursalOrigenId ||
      !sucursalDestinoId ||
      precioBase === undefined ||
      precioKg === undefined
    ) {
      return {
        success: false,
        error:
          "Sucursal origen, destino, precio base y precio por kg son requeridos",
      };
    }

    if (sucursalOrigenId === sucursalDestinoId) {
      return {
        success: false,
        error: "La sucursal origen no puede ser la misma que la de destino",
      };
    }

    if (precioBase < 0 || precioKg < 0) {
      return {
        success: false,
        error: "Los precios no pueden ser negativos",
      };
    }

    if (tiempoEstimado && tiempoEstimado < 0) {
      return {
        success: false,
        error: "El tiempo estimado no puede ser negativo",
      };
    }

    // Verificar si las sucursales existen
    const [sucursalOrigen, sucursalDestino] = await Promise.all([
      prisma.sucursales.findFirst({
        where: { id: sucursalOrigenId, deletedAt: null },
      }),
      prisma.sucursales.findFirst({
        where: { id: sucursalDestinoId, deletedAt: null },
      }),
    ]);

    if (!sucursalOrigen) {
      return {
        success: false,
        error: "Sucursal origen no encontrada",
      };
    }

    if (!sucursalDestino) {
      return {
        success: false,
        error: "Sucursal destino no encontrada",
      };
    }

    // Verificar si ya existe una tarifa para esta ruta
    const tarifaExistente = await prisma.tarifas_sucursales.findUnique({
      where: {
        sucursalOrigenId_sucursalDestinoId: {
          sucursalOrigenId,
          sucursalDestinoId,
        },
      },
    });

    if (tarifaExistente) {
      return {
        success: false,
        error: "Ya existe una tarifa para esta ruta entre sucursales",
      };
    }

    // Crear nueva tarifa
    const nuevaTarifa = await prisma.tarifas_sucursales.create({
      data: {
        sucursalOrigenId,
        sucursalDestinoId,
        precioBase: parseFloat(precioBase),
        precioKg: parseFloat(precioKg),
        tiempoEstimado: tiempoEstimado ? parseInt(tiempoEstimado) : null,
        observaciones: observaciones || null,
      },
      include: {
        sucursalOrigen: {
          select: {
            id: true,
            nombre: true,
            provincia: true,
          },
        },
        sucursalDestino: {
          select: {
            id: true,
            nombre: true,
            provincia: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/configuracion/tarifas");

    return {
      success: true,
      data: nuevaTarifa,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al crear la tarifa de sucursal",
    };
  }
}

/**
 * Actualizar tarifa entre sucursales
 */
export async function updateTarifaSucursal(id, data) {
  try {
    const {
      sucursalOrigenId,
      sucursalDestinoId,
      precioBase,
      precioKg,
      tiempoEstimado,
      observaciones,
      activo,
    } = data;

    if (!id) {
      return {
        success: false,
        error: "ID de tarifa requerido",
      };
    }

    // Validaciones
    if (
      !sucursalOrigenId ||
      !sucursalDestinoId ||
      precioBase === undefined ||
      precioKg === undefined
    ) {
      return {
        success: false,
        error:
          "Sucursal origen, destino, precio base y precio por kg son requeridos",
      };
    }

    if (sucursalOrigenId === sucursalDestinoId) {
      return {
        success: false,
        error: "La sucursal origen no puede ser la misma que la de destino",
      };
    }

    if (precioBase < 0 || precioKg < 0) {
      return {
        success: false,
        error: "Los precios no pueden ser negativos",
      };
    }

    if (tiempoEstimado && tiempoEstimado < 0) {
      return {
        success: false,
        error: "El tiempo estimado no puede ser negativo",
      };
    }

    // Verificar si la tarifa existe
    const tarifaExistente = await prisma.tarifas_sucursales.findUnique({
      where: { id },
    });

    if (!tarifaExistente) {
      return {
        success: false,
        error: "Tarifa no encontrada",
      };
    }

    // Verificar si las sucursales existen
    const [sucursalOrigen, sucursalDestino] = await Promise.all([
      prisma.sucursales.findFirst({
        where: { id: sucursalOrigenId, deletedAt: null },
      }),
      prisma.sucursales.findFirst({
        where: { id: sucursalDestinoId, deletedAt: null },
      }),
    ]);

    if (!sucursalOrigen) {
      return {
        success: false,
        error: "Sucursal origen no encontrada",
      };
    }

    if (!sucursalDestino) {
      return {
        success: false,
        error: "Sucursal destino no encontrada",
      };
    }

    // Verificar si ya existe otra tarifa para esta ruta (excluyendo la actual)
    const otraTarifa = await prisma.tarifas_sucursales.findFirst({
      where: {
        sucursalOrigenId,
        sucursalDestinoId,
        id: { not: id },
      },
    });

    if (otraTarifa) {
      return {
        success: false,
        error: "Ya existe otra tarifa para esta ruta entre sucursales",
      };
    }

    // Actualizar tarifa
    const tarifaActualizada = await prisma.tarifas_sucursales.update({
      where: { id },
      data: {
        sucursalOrigenId,
        sucursalDestinoId,
        precioBase: parseFloat(precioBase),
        precioKg: parseFloat(precioKg),
        tiempoEstimado: tiempoEstimado ? parseInt(tiempoEstimado) : null,
        observaciones: observaciones || null,
        activo: activo !== undefined ? activo : true,
      },
      include: {
        sucursalOrigen: {
          select: {
            id: true,
            nombre: true,
            provincia: true,
          },
        },
        sucursalDestino: {
          select: {
            id: true,
            nombre: true,
            provincia: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/configuracion/tarifas");

    return {
      success: true,
      data: tarifaActualizada,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al actualizar la tarifa de sucursal",
    };
  }
}

/**
 * Eliminar tarifa entre sucursales
 */
export async function deleteTarifaSucursal(id) {
  try {
    if (!id) {
      return {
        success: false,
        error: "ID de tarifa requerido",
      };
    }

    // Verificar si la tarifa existe
    const tarifaExistente = await prisma.tarifas_sucursales.findUnique({
      where: { id },
    });

    if (!tarifaExistente) {
      return {
        success: false,
        error: "Tarifa no encontrada",
      };
    }

    // Eliminar tarifa
    await prisma.tarifas_sucursales.delete({
      where: { id },
    });

    revalidatePath("/dashboard/configuracion/tarifas");

    return {
      success: true,
      message: "Tarifa eliminada correctamente",
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al eliminar la tarifa de sucursal",
    };
  }
}

/**
 * Calcular tarifa para un envío entre sucursales
 */
export async function calcularTarifaSucursal(
  sucursalOrigenId,
  sucursalDestinoId,
  peso
) {
  try {
    if (!sucursalOrigenId || !sucursalDestinoId || !peso) {
      return {
        success: false,
        error: "Sucursal origen, destino y peso son requeridos",
      };
    }

    if (peso <= 0) {
      return {
        success: false,
        error: "El peso debe ser mayor a 0",
      };
    }

    // Buscar tarifa para la ruta
    const tarifa = await prisma.tarifas_sucursales.findUnique({
      where: {
        sucursalOrigenId_sucursalDestinoId: {
          sucursalOrigenId,
          sucursalDestinoId,
        },
      },
      include: {
        sucursalOrigen: {
          select: {
            nombre: true,
            provincia: true,
          },
        },
        sucursalDestino: {
          select: {
            nombre: true,
            provincia: true,
          },
        },
      },
    });

    if (!tarifa) {
      return {
        success: false,
        error: "No se encontró tarifa para esta ruta entre sucursales",
      };
    }

    if (!tarifa.activo) {
      return {
        success: false,
        error: "La tarifa para esta ruta está desactivada",
      };
    }

    // Calcular precio total
    const pesoBase = 1; // Primer kg incluido en precio base
    const pesoAdicional = Math.max(0, peso - pesoBase);
    const precioTotal = tarifa.precioBase + pesoAdicional * tarifa.precioKg;

    return {
      success: true,
      data: {
        tarifa,
        peso,
        pesoBase,
        pesoAdicional,
        precioBase: tarifa.precioBase,
        precioAdicional: pesoAdicional * tarifa.precioKg,
        precioTotal,
        tiempoEstimado: tarifa.tiempoEstimado,
        desglose: {
          precioBase: tarifa.precioBase,
          pesoAdicional: pesoAdicional,
          precioPorKgAdicional: tarifa.precioKg,
          precioAdicional: pesoAdicional * tarifa.precioKg,
          total: precioTotal,
        },
        ruta: {
          origen: `${tarifa.sucursalOrigen.nombre} (${tarifa.sucursalOrigen.provincia})`,
          destino: `${tarifa.sucursalDestino.nombre} (${tarifa.sucursalDestino.provincia})`,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al calcular la tarifa de sucursal",
    };
  }
}

/**
 * Obtener tarifas disponibles desde una sucursal origen
 */
export async function getTarifasDesdeOrigen(sucursalOrigenId) {
  try {
    if (!sucursalOrigenId) {
      return {
        success: false,
        error: "ID de sucursal origen requerido",
      };
    }

    const tarifas = await prisma.tarifas_sucursales.findMany({
      where: {
        sucursalOrigenId,
        activo: true,
      },
      include: {
        sucursalDestino: {
          select: {
            id: true,
            nombre: true,
            provincia: true,
          },
        },
      },
      orderBy: {
        sucursalDestino: { nombre: "asc" },
      },
    });

    return {
      success: true,
      data: tarifas,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener tarifas desde origen",
    };
  }
}

/**
 * Activar/Desactivar tarifa
 */
export async function toggleTarifaSucursal(id, activo) {
  try {
    if (!id) {
      return {
        success: false,
        error: "ID de tarifa requerido",
      };
    }

    const tarifaActualizada = await prisma.tarifas_sucursales.update({
      where: { id },
      data: { activo },
      include: {
        sucursalOrigen: {
          select: {
            nombre: true,
            provincia: true,
          },
        },
        sucursalDestino: {
          select: {
            nombre: true,
            provincia: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/configuracion/tarifas");

    return {
      success: true,
      data: tarifaActualizada,
      message: `Tarifa ${activo ? "activada" : "desactivada"} correctamente`,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al cambiar el estado de la tarifa",
    };
  }
}
