"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calcularTarifaSucursal } from "@/lib/actions/tarifas-sucursales";

/**
 * Calcular cotización entre sucursales
 */
export async function calcularCotizacionSucursal(data) {
  try {
    const {
      sucursalOrigenId,
      sucursalDestinoId,
      peso,
      tipoServicio = "NORMAL",
      modalidad = "SUCURSAL_SUCURSAL",
      valorDeclarado,
      largo,
      ancho,
      alto,
    } = data;

    // Validaciones básicas
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

    if (sucursalOrigenId === sucursalDestinoId) {
      return {
        success: false,
        error: "La sucursal origen no puede ser la misma que la de destino",
      };
    }

    // Calcular peso volumétrico si se proporcionan dimensiones
    let pesoVolumetrico = 0;
    if (largo && ancho && alto) {
      // Factor volumétrico estándar: 1 kg = 5000 cm³
      pesoVolumetrico =
        (parseFloat(largo) * parseFloat(ancho) * parseFloat(alto)) / 5000;
    }

    // El peso facturado considera: real vs volumétrico y mínimo 1 kg
    const pesoFacturadoPre = Math.max(parseFloat(peso), pesoVolumetrico);
    const pesoFacturado = Math.max(1, pesoFacturadoPre);

    // Obtener tarifa base entre sucursales
    const resultadoTarifa = await calcularTarifaSucursal(
      sucursalOrigenId,
      sucursalDestinoId,
      pesoFacturado
    );

    if (!resultadoTarifa.success) {
      return resultadoTarifa;
    }

    const tarifaBase = resultadoTarifa.data;

    // Calcular recargos según tipo de servicio
    const recargosServicio = {
      NORMAL: 1.0, // Sin recargo
      EXPRESS: 1.3, // 30% adicional
      OVERNIGHT: 1.8, // 80% adicional
      ECONOMICO: 0.85, // 15% descuento
    };

    const factorServicio = recargosServicio[tipoServicio] || 1.0;

    // Calcular recargos según modalidad
    const recargosModalidad = {
      SUCURSAL_SUCURSAL: 0, // Sin recargo
      SUCURSAL_DOMICILIO: 15, // S/ 15 adicional
      DOMICILIO_SUCURSAL: 10, // S/ 10 adicional
      DOMICILIO_DOMICILIO: 25, // S/ 25 adicional
    };

    const recargoModalidad = recargosModalidad[modalidad] || 0;

    // Calcular seguro si hay valor declarado
    let seguro = 0;
    if (valorDeclarado && parseFloat(valorDeclarado) > 0) {
      // 0.5% del valor declarado, mínimo S/ 5
      seguro = Math.max(parseFloat(valorDeclarado) * 0.005, 5);
    }

    // Calcular tiempo estimado según tipo de servicio
    const tiemposServicio = {
      NORMAL: tarifaBase.tiempoEstimado || 3,
      EXPRESS: Math.max(1, Math.floor((tarifaBase.tiempoEstimado || 3) / 2)),
      OVERNIGHT: 1,
      ECONOMICO: (tarifaBase.tiempoEstimado || 3) + 2,
    };

    const tiempoEstimado = tiemposServicio[tipoServicio];

    // Cálculos finales
    const subtotal =
      tarifaBase.precioTotal * factorServicio + recargoModalidad + seguro;
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    // Preparar resultado detallado
    const cotizacion = {
      ruta: {
        origen: {
          id: tarifaBase.tarifa.sucursalOrigen.id,
          nombre: tarifaBase.tarifa.sucursalOrigen.nombre,
          provincia: tarifaBase.tarifa.sucursalOrigen.provincia,
        },
        destino: {
          id: tarifaBase.tarifa.sucursalDestino.id,
          nombre: tarifaBase.tarifa.sucursalDestino.nombre,
          provincia: tarifaBase.tarifa.sucursalDestino.provincia,
        },
      },
      parametros: {
        peso: parseFloat(peso),
        pesoVolumetrico,
        pesoFacturado,
        tipoServicio,
        modalidad,
        valorDeclarado: valorDeclarado ? parseFloat(valorDeclarado) : null,
        dimensiones:
          largo && ancho && alto
            ? {
                largo: parseFloat(largo),
                ancho: parseFloat(ancho),
                alto: parseFloat(alto),
              }
            : null,
      },
      detalles: {
        tarifaBase: tarifaBase.precioTotal,
        factorServicio,
        recargoServicio:
          tarifaBase.precioTotal * factorServicio - tarifaBase.precioTotal,
        recargoModalidad,
        seguro,
        subtotal,
        igv,
        total,
      },
      tiempoEstimado,
      servicio: {
        tipo: tipoServicio,
        modalidad,
        descripcion: getDescripcionServicio(tipoServicio, modalidad),
      },
      desglose: {
        precioBase: tarifaBase.precioBase,
        pesoAdicional: tarifaBase.pesoAdicional,
        precioAdicional: tarifaBase.precioAdicional,
        subtotalBase: tarifaBase.precioTotal,
        recargoServicio:
          tarifaBase.precioTotal * factorServicio - tarifaBase.precioTotal,
        recargoModalidad,
        seguro,
        subtotal,
        igv,
        total,
      },
    };

    return {
      success: true,
      data: cotizacion,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al calcular la cotización",
    };
  }
}

/**
 * Obtener cotizaciones múltiples (diferentes tipos de servicio)
 */
export async function obtenerCotizacionesMultiples(data) {
  try {
    const tiposServicio = ["ECONOMICO", "NORMAL", "EXPRESS", "OVERNIGHT"];
    const cotizaciones = [];

    for (const tipoServicio of tiposServicio) {
      const resultado = await calcularCotizacionSucursal({
        ...data,
        tipoServicio,
      });

      if (resultado.success) {
        cotizaciones.push({
          tipoServicio,
          ...resultado.data,
        });
      }
    }

    if (cotizaciones.length === 0) {
      return {
        success: false,
        error: "No se pudieron calcular cotizaciones para esta ruta",
      };
    }

    // Ordenar por precio
    cotizaciones.sort((a, b) => a.detalles.total - b.detalles.total);

    return {
      success: true,
      data: {
        ruta: cotizaciones[0].ruta,
        parametros: cotizaciones[0].parametros,
        opciones: cotizaciones,
        resumen: {
          opciones: cotizaciones.length,
          precioMinimo: cotizaciones[0].detalles.total,
          precioMaximo: cotizaciones[cotizaciones.length - 1].detalles.total,
          tiempoMinimo: Math.min(...cotizaciones.map((c) => c.tiempoEstimado)),
          tiempoMaximo: Math.max(...cotizaciones.map((c) => c.tiempoEstimado)),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener las cotizaciones",
    };
  }
}

/**
 * Validar disponibilidad de ruta
 */
export async function validarDisponibilidadRuta(
  sucursalOrigenId,
  sucursalDestinoId
) {
  try {
    if (!sucursalOrigenId || !sucursalDestinoId) {
      return {
        success: false,
        error: "IDs de sucursales requeridos",
      };
    }

    // Verificar que las sucursales existen y están activas
    const [sucursalOrigen, sucursalDestino] = await Promise.all([
      prisma.sucursales.findFirst({
        where: { id: sucursalOrigenId, deletedAt: null },
        select: { id: true, nombre: true, provincia: true },
      }),
      prisma.sucursales.findFirst({
        where: { id: sucursalDestinoId, deletedAt: null },
        select: { id: true, nombre: true, provincia: true },
      }),
    ]);

    if (!sucursalOrigen) {
      return {
        success: false,
        error: "Sucursal origen no encontrada o inactiva",
      };
    }

    if (!sucursalDestino) {
      return {
        success: false,
        error: "Sucursal destino no encontrada o inactiva",
      };
    }

    // Verificar si existe tarifa activa para esta ruta
    const tarifa = await prisma.tarifas_sucursales.findUnique({
      where: {
        sucursalOrigenId_sucursalDestinoId: {
          sucursalOrigenId,
          sucursalDestinoId,
        },
      },
      select: { id: true, activo: true },
    });

    if (!tarifa) {
      return {
        success: false,
        error: `No hay tarifas configuradas para la ruta ${sucursalOrigen.nombre} → ${sucursalDestino.nombre}`,
        disponible: false,
      };
    }

    if (!tarifa.activo) {
      return {
        success: false,
        error: `La ruta ${sucursalOrigen.nombre} → ${sucursalDestino.nombre} está temporalmente deshabilitada`,
        disponible: false,
      };
    }

    return {
      success: true,
      disponible: true,
      data: {
        origen: sucursalOrigen,
        destino: sucursalDestino,
        tarifaId: tarifa.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al validar la disponibilidad de la ruta",
    };
  }
}

/**
 * Obtener rutas disponibles desde una sucursal
 */
export async function getRutasDisponibles(sucursalOrigenId) {
  try {
    if (!sucursalOrigenId) {
      return {
        success: false,
        error: "ID de sucursal origen requerido",
      };
    }

    const rutas = await prisma.tarifas_sucursales.findMany({
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
        sucursalDestino: {
          nombre: "asc",
        },
      },
    });

    return {
      success: true,
      data: rutas.map((ruta) => ({
        sucursalDestinoId: ruta.sucursalDestinoId,
        nombre: ruta.sucursalDestino.nombre,
        provincia: ruta.sucursalDestino.provincia,
        precioBase: ruta.precioBase,
        precioKg: ruta.precioKg,
        tiempoEstimado: ruta.tiempoEstimado,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener las rutas disponibles",
    };
  }
}

// Función auxiliar para obtener descripción del servicio
function getDescripcionServicio(tipoServicio, modalidad) {
  const descripciones = {
    NORMAL: "Servicio estándar",
    EXPRESS: "Entrega rápida",
    OVERNIGHT: "Entrega al día siguiente",
    ECONOMICO: "Opción económica",
  };

  const modalidades = {
    SUCURSAL_SUCURSAL: "de sucursal a sucursal",
    SUCURSAL_DOMICILIO: "de sucursal a domicilio",
    DOMICILIO_SUCURSAL: "de domicilio a sucursal",
    DOMICILIO_DOMICILIO: "de domicilio a domicilio",
  };

  return `${descripciones[tipoServicio] || "Servicio"} ${
    modalidades[modalidad] || ""
  }`;
}
