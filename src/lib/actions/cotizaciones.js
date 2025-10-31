"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calcularCotizacionSucursal } from "@/lib/actions/cotizacion-sucursales";
import { validarDocumentoPeruano } from "../utils/documentos.js";
import { validarTelefonoPeruano } from "@/lib/validaciones-zod";
import { generarNumeroGuia } from "@/lib/utils/guia-generator";

/**
 * COTIZACIONES
 */

/**
 * Calcular precio de envío
 */
export async function calcularPrecioEnvio(data) {
  try {
    const {
      sucursalOrigenId,
      sucursalDestinoId,
      peso,
      alto,
      ancho,
      profundo,
      tipoServicio = "NORMAL",
      modalidad = "SUCURSAL_SUCURSAL",
    } = data;

    // Validaciones básicas
    if (!sucursalOrigenId || !sucursalDestinoId || !peso) {
      return {
        success: false,
        error: "Datos incompletos para el cálculo",
      };
    }

    // Calcular volumen si se proporcionan dimensiones
    let volumen = null;
    if (alto && ancho && profundo) {
      // Convertir cm a m³
      volumen = (alto * ancho * profundo) / 1000000;
    }

    // Nuevo: reutilizar la cotización consolidada (aplica mínimo 1 kg + IGV)
    const cotizacionResp = await calcularCotizacionSucursal({
      sucursalOrigenId,
      sucursalDestinoId,
      peso,
      tipoServicio,
      modalidad,
      largo: profundo, // mapear "profundo" -> "largo"
      ancho,
      alto,
    });

    if (!cotizacionResp?.success || !cotizacionResp.data) {
      return {
        success: false,
        error: "No hay tarifa configurada entre estas sucursales",
      };
    }

    const cot = cotizacionResp.data;

    // Obtener info de la tarifa para completar datos (id y nombres)
    const tarifaResult = await getTarifaEntreSucursales(
      sucursalOrigenId,
      sucursalDestinoId
    );
    const tarifaInfo = tarifaResult?.success ? tarifaResult.data : null;

    const precioBase =
      cot.desglose?.subtotalBase ?? cot.detalles?.tarifaBase ?? 0;
    const precioFinal = cot.detalles?.total ?? 0;

    // Construir leyenda con base y, si aplica, precio por kg adicional
    const pesoAdicional = cot.desglose?.pesoAdicional ?? 0;
    const precioAdicional = cot.desglose?.precioAdicional ?? 0;
    const precioPorKgAdicional =
      pesoAdicional > 0
        ? parseFloat((precioAdicional / pesoAdicional).toFixed(2))
        : null;

    const tipoTarifa =
      pesoAdicional > 0 && precioPorKgAdicional != null
        ? `Tarifa Sucursal (Base: S/${precioBase} + ${pesoAdicional}kg × S/${precioPorKgAdicional})`
        : `Tarifa Sucursal (Base: S/${precioBase})`;

    return {
      success: true,
      data: {
        precioBase: parseFloat(precioBase.toFixed(2)),
        precioFinal: parseFloat(precioFinal.toFixed(2)),
        tipoTarifa,
        multiplicadorServicio: cot.detalles?.factorServicio ?? 1,
        multiplicadorModalidad: 1,
        volumen: volumen ? parseFloat(volumen.toFixed(6)) : null,
        tarifa: {
          id: tarifaInfo?.id,
          sucursalOrigen:
            tarifaInfo?.sucursalOrigen?.nombre ?? cot.ruta?.origen?.nombre,
          sucursalDestino:
            tarifaInfo?.sucursalDestino?.nombre ?? cot.ruta?.destino?.nombre,
          tiempoEstimado: cot.tiempoEstimado || tarifaInfo?.tiempoEstimado || 2,
          observaciones: tarifaInfo?.observaciones,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al calcular el precio del envío",
    };
  }
}

/**
 * Crear cotización
 */
export async function createCotizacion(data) {
  try {
    const {
      sucursalOrigenId,
      sucursalDestinoId,
      direccionEntrega,
      distritoEntregaId,
      peso,
      alto,
      ancho,
      profundo,
      tipoServicio = "NORMAL",
      modalidad = "SUCURSAL_SUCURSAL",
      contenido,
      valorDeclarado,
      requiereSeguro = false,
      clienteId,
      nombreCliente,
      telefonoCliente,
      emailCliente,
      validoHastaDias = 7,
    } = data;

    // Calcular precio
    const calculoResult = await calcularPrecioEnvio({
      sucursalOrigenId,
      sucursalDestinoId,
      peso,
      alto,
      ancho,
      profundo,
      tipoServicio,
      modalidad,
    });

    if (!calculoResult.success) {
      return calculoResult;
    }

    const { precioBase, precioFinal, volumen, tarifa } = calculoResult.data;

    // Crear cotización
    const validoHasta = new Date();
    validoHasta.setDate(validoHasta.getDate() + validoHastaDias);

    const nuevaCotizacion = await prisma.cotizaciones.create({
      data: {
        sucursalOrigenId,
        sucursalDestinoId,
        direccionEntrega,
        distritoEntregaId,
        peso: parseFloat(peso),
        alto: alto ? parseFloat(alto) : null,
        ancho: ancho ? parseFloat(ancho) : null,
        profundo: profundo ? parseFloat(profundo) : null,
        volumen,
        tipoServicio,
        modalidad,
        tarifaSucursalId: tarifa.id,
        precioBase,
        precioFinal,
        contenido,
        valorDeclarado: valorDeclarado ? parseFloat(valorDeclarado) : null,
        requiereSeguro,
        clienteId,
        nombreCliente,
        telefonoCliente,
        emailCliente,
        validoHasta,
      },
      include: {
        sucursalOrigen: true,
        sucursalDestino: true,
        distritoEntrega: {
          include: {
            provincia: {
              include: {
                departamento: true,
              },
            },
          },
        },
        tarifaSucursal: {
          include: {
            sucursalOrigen: true,
            sucursalDestino: true,
          },
        },
        cliente: true,
      },
    });

    revalidatePath("/dashboard/cotizaciones");

    return {
      success: true,
      data: nuevaCotizacion,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al crear la cotización",
    };
  }
}

/**
 * Obtener cotizaciones
 */
export async function getCotizaciones(filtros = {}) {
  try {
    const {
      estado,
      clienteId,
      fechaDesde,
      fechaHasta,
      page = 1,
      limit = 10,
    } = filtros;

    const whereClause = {
      ...(estado && estado !== "TODOS" && { estado }),
      ...(clienteId && { clienteId }),
      ...(fechaDesde &&
        fechaHasta && {
          createdAt: {
            gte: new Date(fechaDesde),
            lte: new Date(fechaHasta),
          },
        }),
    };

    const [cotizaciones, total] = await Promise.all([
      prisma.cotizaciones.findMany({
        where: whereClause,
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
          distritoEntrega: {
            include: {
              provincia: {
                include: {
                  departamento: true,
                },
              },
            },
          },
          tarifaSucursal: {
            include: {
              sucursalOrigen: true,
              sucursalDestino: true,
            },
          },
          cliente: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cotizaciones.count({ where: whereClause }),
    ]);

    return {
      success: true,
      data: {
        cotizaciones,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
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
 * Obtener cotización por ID
 */
export async function getCotizacionById(id) {
  try {
    const cotizacion = await prisma.cotizaciones.findUnique({
      where: { id },
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
        distritoEntrega: {
          include: {
            provincia: {
              include: {
                departamento: true,
              },
            },
          },
        },
        tarifaSucursal: {
          include: {
            sucursalOrigen: true,
            sucursalDestino: true,
          },
        },
        cliente: true,
      },
    });

    if (!cotizacion) {
      return {
        success: false,
        error: "Cotización no encontrada",
      };
    }

    return {
      success: true,
      data: cotizacion,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener la cotización",
    };
  }
}

/**
 * Actualizar estado de cotización
 */
export async function updateCotizacionEstado(id, nuevoEstado) {
  try {
    if (!id || !nuevoEstado) {
      return {
        success: false,
        error: "ID y estado son requeridos",
      };
    }

    // Verificar que el estado sea válido
    const estadosValidos = [
      "PENDIENTE",
      "APROBADA",
      "RECHAZADA",
      "CONVERTIDA_ENVIO",
      "EXPIRADA",
    ];

    if (!estadosValidos.includes(nuevoEstado)) {
      return {
        success: false,
        error: "Estado no válido",
      };
    }

    const cotizacion = await prisma.cotizaciones.findUnique({
      where: { id },
    });

    if (!cotizacion) {
      return {
        success: false,
        error: "Cotización no encontrada",
      };
    }

    // Verificar si la cotización está expirada
    if (
      new Date(cotizacion.validoHasta) < new Date() &&
      nuevoEstado !== "EXPIRADA"
    ) {
      return {
        success: false,
        error: "No se puede cambiar el estado de una cotización expirada",
      };
    }

    const cotizacionActualizada = await prisma.cotizaciones.update({
      where: { id },
      data: { estado: nuevoEstado },
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
        distritoEntrega: {
          include: {
            provincia: {
              include: {
                departamento: true,
              },
            },
          },
        },
        tarifaSucursal: {
          include: {
            sucursalOrigen: true,
            sucursalDestino: true,
          },
        },
        cliente: true,
      },
    });

    revalidatePath("/dashboard/cotizaciones");

    return {
      success: true,
      data: cotizacionActualizada,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al actualizar el estado de la cotización",
    };
  }
}

/**
 * Convertir cotización a envío
 */
export async function convertirCotizacionAEnvio(
  cotizacionId,
  datosCliente = null
) {
  try {
    if (!cotizacionId) {
      return {
        success: false,
        error: "ID de cotización requerido",
      };
    }

    // Obtener la cotización
    const cotizacion = await prisma.cotizaciones.findUnique({
      where: { id: cotizacionId },
      include: {
        sucursalOrigen: true,
        sucursalDestino: true,
        cliente: true,
      },
    });

    if (!cotizacion) {
      return {
        success: false,
        error: "Cotización no encontrada",
      };
    }

    // Verificar que la cotización esté en estado válido
    if (cotizacion.estado !== "PENDIENTE" && cotizacion.estado !== "APROBADA") {
      return {
        success: false,
        error: "Solo se pueden convertir cotizaciones pendientes o aprobadas",
      };
    }

    // Verificar que no esté expirada
    if (new Date(cotizacion.validoHasta) < new Date()) {
      return {
        success: false,
        error: "No se puede convertir una cotización expirada",
      };
    }

    // VALIDACIÓN CRÍTICA: Verificar que haya datos mínimos del cliente
    let clienteId = cotizacion.clienteId;

    if (!clienteId && !cotizacion.nombreCliente && !datosCliente) {
      return {
        success: false,
        error:
          "Se requieren datos mínimos del cliente para crear el envío. Por favor, proporciona al menos nombre y teléfono del destinatario.",
        requiresClientData: true,
      };
    }

    // Definir clienteData fuera del bloque para que esté disponible en todo el scope
    let clienteData = null;

    // Si ya hay un clienteId (cliente registrado), obtener sus datos
    if (clienteId) {
      const clienteRegistrado = await prisma.clientes.findUnique({
        where: { id: clienteId },
      });

      if (clienteRegistrado) {
        clienteData = {
          nombre: clienteRegistrado.nombre,
          telefono: clienteRegistrado.telefono,
          email: clienteRegistrado.email,
          direccion: clienteRegistrado.direccion,
          // PRESERVAR datos del remitente del formulario
          remitenteNombre: datosCliente?.remitenteNombre || null,
          remitenteTelefono: datosCliente?.remitenteTelefono || null,
          remitenteEmail: datosCliente?.remitenteEmail || null,
        };
      }
    }

    // Si no hay cliente registrado pero hay datos en la cotización o se proporcionan datos
    if (!clienteId && (cotizacion.nombreCliente || datosCliente)) {
      clienteData = datosCliente || {
        nombre: cotizacion.nombreCliente,
        telefono: cotizacion.telefonoCliente,
        email: cotizacion.emailCliente,
      };

      // Validar datos mínimos requeridos
      if (!clienteData.nombre || !clienteData.telefono) {
        return {
          success: false,
          error: "Se requiere al menos nombre y teléfono del cliente",
          requiresClientData: true,
        };
      }

      // Validar formato de teléfono peruano
      if (!validarTelefonoPeruano(String(clienteData.telefono))) {
        return {
          success: false,
          error: "Formato de teléfono peruano inválido",
          requiresClientData: true,
        };
      }

      // Buscar cliente existente por número de documento
      let clienteExistente = null;
      const tipoDocBusqueda = clienteData.tipoDocumento || "DNI";
      const numeroDocBusqueda = clienteData.numeroDocumento;
      const esDocValido = numeroDocBusqueda
        ? validarDocumentoPeruano(
            tipoDocBusqueda,
            String(numeroDocBusqueda).trim()
          )
        : false;

      if (esDocValido && numeroDocBusqueda !== "00000000") {
        clienteExistente = await prisma.clientes.findUnique({
          where: {
            numeroDocumento: String(numeroDocBusqueda).trim(),
          },
        });
      }

      if (clienteExistente) {
        // Usar cliente existente y actualizar clienteData con sus datos
        clienteId = clienteExistente.id;
        clienteData = {
          ...clienteData,
          nombre: clienteExistente.nombre,
          telefono: clienteExistente.telefono,
          email: clienteExistente.email,
          direccion: clienteExistente.direccion,
          remitenteNombre: clienteData.remitenteNombre,
          remitenteTelefono: clienteData.remitenteTelefono,
          remitenteEmail: clienteData.remitenteEmail,
        };
      } else {
        // Crear nuevo cliente
        try {
          const nuevoCliente = await prisma.clientes.create({
            data: {
              nombre: clienteData.nombre,
              apellidos: clienteData.apellidos || "",
              tipoDocumento: clienteData.tipoDocumento || "DNI",
              numeroDocumento: (() => {
                const tipoDoc = clienteData.tipoDocumento || "DNI";
                const numeroDoc = clienteData.numeroDocumento
                  ? String(clienteData.numeroDocumento).trim()
                  : "";
                const valido = validarDocumentoPeruano(tipoDoc, numeroDoc);
                return valido
                  ? numeroDoc
                  : `TEMP_${Date.now()}_${Math.random()
                      .toString(36)
                      .slice(2, 9)}`;
              })(),
              telefono: clienteData.telefono,
              email: clienteData.email || null,
              direccion:
                cotizacion.direccionEntrega || clienteData.direccion || null,
              distritoId: cotizacion.distritoEntregaId || null,
              esEmpresa: false,
            },
          });

          clienteId = nuevoCliente.id;
        } catch (createError) {
          // Si falla por constraint único, intentar buscar por teléfono
          if (createError.code === "P2002") {
            const clientePorTelefono = await prisma.clientes.findFirst({
              where: {
                telefono: clienteData.telefono,
              },
            });

            if (clientePorTelefono) {
              clienteId = clientePorTelefono.id;
              clienteData = {
                ...clienteData,
                nombre: clientePorTelefono.nombre,
                telefono: clientePorTelefono.telefono,
                email: clientePorTelefono.email,
                direccion: clientePorTelefono.direccion,
              };
            } else {
              // Como último recurso, crear con documento temporal único
              const documentoTemporal = `TEMP_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;

              const nuevoCliente = await prisma.clientes.create({
                data: {
                  nombre: clienteData.nombre,
                  apellidos: clienteData.apellidos || "",
                  tipoDocumento: "DNI",
                  numeroDocumento: documentoTemporal,
                  telefono: clienteData.telefono,
                  email: clienteData.email || null,
                  direccion:
                    cotizacion.direccionEntrega ||
                    clienteData.direccion ||
                    null,
                  distritoId: cotizacion.distritoEntregaId || null,
                  esEmpresa: false,
                },
              });

              clienteId = nuevoCliente.id;
            }
          } else {
            throw createError;
          }
        }
      }
    }

    // Generar número de guía único usando el sistema centralizado
    const guia = await generarNumeroGuia(sucursalOrigenId);

    // VERIFICAR que los campos no sean undefined
    const datosEnvio = {
      destinatarioNombre: clienteData.nombre,
      destinatarioTelefono: clienteData.telefono,
      destinatarioEmail: clienteData.email || null,
      remitenteNombre: clienteData.remitenteNombre || null,
      remitenteTelefono: clienteData.remitenteTelefono || null,
      remitenteEmail: clienteData.remitenteEmail || null,
    };

    // Responsable de Recojo (si viene del modal y/o si es RUC)
    const incluirResponsableRecojo = Boolean(
      datosCliente?.incluirResponsableRecojo ||
        datosCliente?.tipoDocumento === "RUC" ||
        clienteData?.tipoDocumento === "RUC"
    );

    let responsableRecojoData = {};

    if (incluirResponsableRecojo && datosCliente?.responsableRecojo) {
      const rr = datosCliente.responsableRecojo;
      const rrTipo = rr.tipoDocumento || null;
      const rrNumero = rr.numeroDocumento
        ? String(rr.numeroDocumento).trim()
        : "";
      const rrValido =
        rrTipo && rrNumero ? validarDocumentoPeruano(rrTipo, rrNumero) : false;

      responsableRecojoData = {
        responsableRecojoNombre: rr.nombre || null,
        responsableRecojoApellidos: rr.apellidos || null,
        responsableRecojoTipoDocumento: rrValido ? rrTipo : null,
        responsableRecojoNumeroDocumento: rrValido ? rrNumero : null,
        responsableRecojoTelefono: rr.telefono || null,
        responsableRecojoEmail: rr.email || null,
        responsableRecojoDireccion: rr.direccion || null,
        responsableRecojoEmpresa:
          rr.empresa ||
          datosCliente?.destinatarioNombre ||
          clienteData?.nombre ||
          null,
        responsableRecojoCargo: rr.cargo || null,
      };
    }

    // Crear el envío
    const nuevoEnvio = await prisma.envios.create({
      data: {
        id: `env_${timestamp}_${random}`,
        guia,
        clienteId: clienteId,
        sucursalOrigenId: cotizacion.sucursalOrigenId,
        sucursalDestinoId: cotizacion.sucursalDestinoId,
        peso: cotizacion.peso,
        alto: cotizacion.alto,
        ancho: cotizacion.ancho,
        profundo: cotizacion.profundo,
        volumen: cotizacion.volumen,
        descripcion: cotizacion.contenido || "Paquete",
        valorDeclarado: cotizacion.valorDeclarado || null,
        total: cotizacion.precioFinal,
        tipoServicio: "NORMAL",
        modalidad: "SUCURSAL_SUCURSAL",
        estado: "REGISTRADO",
        progreso: 10,
        fechaRegistro: new Date(),
        destinatarioNombre: datosEnvio.destinatarioNombre,
        destinatarioTelefono: datosEnvio.destinatarioTelefono,
        destinatarioEmail: datosEnvio.destinatarioEmail,
        destinatarioDireccion:
          cotizacion.direccionEntrega || clienteData.direccion || null,
        remitenteNombre: datosEnvio.remitenteNombre,
        remitenteTelefono: datosEnvio.remitenteTelefono,
        remitenteEmail: datosEnvio.remitenteEmail,
        remitenteDireccion: null,
        ...responsableRecojoData,
      },
      include: {
        cliente: true,
        sucursalOrigen: true,
        sucursalDestino: true,
      },
    });

    // Actualizar el estado de la cotización
    await prisma.cotizaciones.update({
      where: { id: cotizacionId },
      data: { estado: "CONVERTIDA_ENVIO" },
    });

    // Crear evento inicial del envío
    await prisma.eventos_envio.create({
      data: {
        id: `evt_${timestamp}_${random}`,
        envioId: nuevoEnvio.id,
        estado: "REGISTRADO",
        descripcion: "Envío registrado en el sistema",
        comentario: `Creado desde cotización ${cotizacionId.slice(-8)}`,
        ubicacion: cotizacion.sucursalOrigen.nombre,
        fechaEvento: new Date(),
        createdAt: new Date(),
      },
    });

    revalidatePath("/dashboard/cotizaciones");
    revalidatePath("/dashboard/envios");

    return {
      success: true,
      data: {
        envio: nuevoEnvio,
        cotizacion: cotizacion,
        guia,
      },
      message: `Envío creado exitosamente con guía ${guia}`,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al convertir la cotización a envío",
    };
  }
}

/**
 * Marcar cotizaciones expiradas
 */
export async function marcarCotizacionesExpiradas() {
  try {
    const ahora = new Date();

    const cotizacionesExpiradas = await prisma.cotizaciones.updateMany({
      where: {
        validoHasta: {
          lt: ahora,
        },
        estado: {
          in: ["PENDIENTE", "APROBADA"],
        },
      },
      data: {
        estado: "EXPIRADA",
      },
    });

    return {
      success: true,
      data: {
        cotizacionesActualizadas: cotizacionesExpiradas.count,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al marcar cotizaciones expiradas",
    };
  }
}

// Función auxiliar para obtener tarifa por distrito (reutilizada)
async function getTarifaByDistrito(distritoId) {
  try {
    const tarifa = await prisma.tarifas_destino.findFirst({
      where: {
        distritoId,
        activo: true,
      },
    });

    return {
      success: true,
      data: tarifa,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener tarifa",
    };
  }
}

// Función auxiliar para obtener tarifa entre sucursales
async function getTarifaEntreSucursales(sucursalOrigenId, sucursalDestinoId) {
  try {
    const tarifa = await prisma.tarifas_sucursales.findFirst({
      where: {
        sucursalOrigenId,
        sucursalDestinoId,
        activo: true,
      },
      include: {
        sucursalOrigen: true,
        sucursalDestino: true,
      },
    });

    return {
      success: true,
      data: tarifa,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener tarifa entre sucursales",
    };
  }
}
