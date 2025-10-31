"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

// Función auxiliar para manejar errores
function handleActionError(error) {
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: false,
    error: "Error interno del servidor",
  };
}

// Obtener configuración de facturación activa
export async function obtenerConfiguracionFacturacion() {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "CONTADOR"]);

    const configuracion = await prisma.configuracion_facturacion.findFirst({
      where: { activo: true },
    });

    if (!configuracion) {
      return {
        success: false,
        error: "No se encontró configuración de facturación activa",
      };
    }

    return {
      success: true,
      data: configuracion,
    };
  } catch (error) {
    return handleActionError(error);
  }
}
// Obtener comprobantes electrónicos con filtros y paginación
export async function obtenerComprobantesElectronicos(filtros = {}) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "CONTADOR"]);

    const {
      busquedaRapida,
      numeroCompleto,
      estado,
      tipoComprobante,
      fechaDesde,
      fechaHasta,
      pagina = 1,
      limite = 20,
    } = filtros;

    // Construir condiciones de filtro
    const where = {
      deletedAt: null, // Solo comprobantes no eliminados
    };

    if (busquedaRapida) {
      where.OR = [
        { numeroCompleto: { contains: busquedaRapida, mode: "insensitive" } },
        { nombreCliente: { contains: busquedaRapida, mode: "insensitive" } },
        {
          numeroDocumentoCliente: {
            contains: busquedaRapida,
            mode: "insensitive",
          },
        },
      ];
    }

    if (numeroCompleto) {
      where.numeroCompleto = { contains: numeroCompleto, mode: "insensitive" };
    }

    if (estado && estado !== "TODOS") {
      where.estado = estado;
    }

    if (tipoComprobante && tipoComprobante !== "TODOS") {
      where.tipoComprobante = tipoComprobante;
    }

    if (fechaDesde) {
      where.fechaEmision = {
        ...where.fechaEmision,
        gte: new Date(fechaDesde),
      };
    }

    if (fechaHasta) {
      where.fechaEmision = {
        ...where.fechaEmision,
        lte: new Date(fechaHasta + "T23:59:59.999Z"),
      };
    }

    // Calcular offset para paginación
    const offset = (pagina - 1) * limite;

    // Obtener comprobantes con paginación
    const [comprobantes, totalRegistros] = await Promise.all([
      prisma.comprobantes_electronicos.findMany({
        where,
        orderBy: { fechaEmision: "desc" },
        skip: offset,
        take: limite,
        include: {
          envio: {
            select: {
              id: true,
              guia: true,
              estado: true,
              total: true,
              valorDeclarado: true,
            },
          },
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              razonSocial: true,
              numeroDocumento: true,
              tipoDocumento: true,
              esEmpresa: true,
            },
          },
          detalles: {
            select: {
              id: true,
              orden: true,
              descripcion: true,
              cantidad: true,
              precioUnitario: true,
              valorVenta: true,
              igv: true,
              precioTotal: true,
              unidadMedida: true,
            },
            orderBy: { orden: "asc" },
          },
        },
      }),
      prisma.comprobantes_electronicos.count({ where }),
    ]);

    const totalPaginas = Math.ceil(totalRegistros / limite);

    // Transformar datos para el frontend
    const comprobantesTransformados = comprobantes.map((comprobante) => ({
      ...comprobante,
      // Agregar campos para compatibilidad con el frontend
      razon_social: comprobante.nombreCliente,
      numero_documento: comprobante.numeroDocumentoCliente,
      numero_completo: comprobante.numeroCompleto,
      fecha_emision: comprobante.fechaEmision,
      monto_total: comprobante.total,
      tipo_comprobante: comprobante.tipoComprobante,
      url_pdf: comprobante.pdfUrl,
    }));

    return {
      success: true,
      data: {
        comprobantes: comprobantesTransformados,
        totalRegistros,
        totalPaginas,
        paginaActual: pagina,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Obtener envíos sin comprobantes para facturación
export async function obtenerEnviosSinComprobantes() {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "CONTADOR"]);

    const envios = await prisma.envios.findMany({
      where: {
        // Envíos que no tienen comprobante asociado
        comprobantes: {
          none: {},
        },
        estado: {
          in: ["ENTREGADO", "EN_REPARTO", "EN_TRANSITO"],
        },
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            razonSocial: true,
            numeroDocumento: true,
            tipoDocumento: true,
            direccion: true,
            telefono: true,
            email: true,
            esEmpresa: true,
          },
        },
        sucursalOrigen: {
          select: {
            nombre: true,
            direccion: true,
          },
        },
        sucursalDestino: {
          select: {
            nombre: true,
            direccion: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transformar datos para el frontend
    const enviosTransformados = envios.map((envio) => ({
      id: envio.id,
      codigo_seguimiento: envio.guia, // El campo guia es el código de seguimiento
      numero_guia: envio.guia,
      estado: envio.estado,
      fecha_creacion: envio.createdAt,
      valor_declarado: envio.valorDeclarado,
      total: envio.total, // Agregar el total del envío
      descripcion: envio.descripcion,
      origen: envio.sucursalOrigen?.nombre || "N/A",
      destino: envio.sucursalDestino?.nombre || "N/A",
      destinatario: envio.cliente?.esEmpresa
        ? envio.cliente.razonSocial
        : `${envio.cliente?.nombre || ""} ${
            envio.cliente?.apellidos || ""
          }`.trim(),
      cliente: envio.cliente,
    }));

    return {
      success: true,
      data: enviosTransformados,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Crear comprobante electrónico
export async function crearComprobanteElectronico(datos) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "CONTADOR"]);

    const {
      tipoComprobante,
      serie,
      envioId,
      clienteId,
      tipoDocumentoCliente,
      numeroDocumentoCliente,
      nombreCliente,
      direccionCliente,
      telefonoCliente,
      emailCliente,
      observaciones,
      subtotal,
      igv,
      total,
      detalles,
    } = datos;

    // Obtener el siguiente número correlativo para la serie
    const ultimoComprobante = await prisma.comprobantes_electronicos.findFirst({
      where: { serie },
      orderBy: { numero: "desc" },
    });

    const siguienteNumero = ultimoComprobante
      ? ultimoComprobante.numero + 1
      : 1;
    const numeroCompleto = `${serie}-${siguienteNumero
      .toString()
      .padStart(8, "0")}`;

    // Obtener configuración de facturación
    const configuracion = await prisma.configuracion_facturacion.findFirst({
      where: { activo: true },
    });

    if (!configuracion) {
      return {
        success: false,
        error: "No se encontró configuración de facturación activa",
      };
    }

    // Crear el comprobante
    const comprobante = await prisma.comprobantes_electronicos.create({
      data: {
        tipoComprobante: tipoComprobante,
        serie,
        numero: siguienteNumero,
        numeroCompleto: numeroCompleto,
        envioId: envioId,
        clienteId: clienteId,
        rucEmisor: configuracion.ruc,
        razonSocialEmisor: configuracion.razonSocial,
        tipoDocumentoCliente: tipoDocumentoCliente,
        numeroDocumentoCliente: numeroDocumentoCliente,
        nombreCliente: nombreCliente,
        direccionCliente: direccionCliente,
        fechaEmision: new Date(),
        subtotal,
        igv,
        total: total,
        observaciones,
        estado: "PENDIENTE",
        detalles: {
          create: detalles.map((detalle, index) => ({
            orden: index + 1,
            descripcion: detalle.descripcion,
            cantidad: detalle.cantidad,
            unidadMedida: detalle.unidadMedida,
            precioUnitario: detalle.precioUnitario,
            valorVenta: detalle.cantidad * detalle.precioUnitario,
            igv: detalle.cantidad * detalle.precioUnitario * 0.18,
            precioTotal: detalle.cantidad * detalle.precioUnitario,
          })),
        },
      },
      include: {
        detalles: true,
      },
    });

    // El envío ya está asociado al comprobante a través de la relación envioId

    return {
      success: true,
      data: comprobante,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Crear comprobante desde envío
export async function crearComprobanteDesdeEnvio(envioId) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "CONTADOR"]);

    // Obtener datos del envío
    const envio = await prisma.envios.findUnique({
      where: { id: envioId },
      include: {
        cliente: true,
        sucursalOrigen: true,
        sucursalDestino: true,
        comprobantes: true, // Para verificar si ya tiene comprobantes
      },
    });

    if (!envio) {
      return {
        success: false,
        error: "Envío no encontrado",
      };
    }

    if (envio.comprobantes && envio.comprobantes.length > 0) {
      return {
        success: false,
        error: "El envío ya tiene un comprobante asociado",
      };
    }

    // Preparar datos del comprobante
    const cliente = envio.cliente;
    const tipoComprobante = cliente?.esEmpresa ? "FACTURA" : "BOLETA";
    const serie = tipoComprobante === "FACTURA" ? "F001" : "B001";

    const datosComprobante = {
      tipoComprobante,
      serie,
      envioId: envio.id,
      clienteId: cliente?.id,
      tipoDocumentoCliente: cliente?.tipoDocumento || "DNI",
      numeroDocumentoCliente: cliente?.numeroDocumento || "",
      nombreCliente: cliente?.esEmpresa
        ? cliente.razonSocial
        : `${cliente?.nombre || ""} ${cliente?.apellidos || ""}`.trim(),
      direccionCliente: cliente?.direccion || "",
      telefonoCliente: cliente?.telefono || "",
      emailCliente: cliente?.email || "",
      observaciones: `Servicio de transporte - Guía ${envio.guia}`,
      subtotal: (envio.total || 0) / 1.18,
      igv: (envio.total || 0) - (envio.total || 0) / 1.18,
      total: envio.total || 0,
      detalles: [
        {
          descripcion: `Transporte de carga - ${envio.sucursalOrigen?.nombre} a ${envio.sucursalDestino?.nombre}`,
          cantidad: 1,
          precioUnitario: envio.total || 0,
          unidadMedida: "ZZ",
        },
      ],
    };

    return await crearComprobanteElectronico(datosComprobante);
  } catch (error) {
    return handleActionError(error);
  }
}

// Consultar estado de comprobante
export async function consultarEstadoComprobante(comprobanteId) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "CONTADOR"]);

    const comprobante = await prisma.comprobantes_electronicos.findUnique({
      where: { id: comprobanteId },
    });

    if (!comprobante) {
      return {
        success: false,
        error: "Comprobante no encontrado",
      };
    }

    // Aquí se implementaría la consulta real a SUNAT
    // Por ahora simulamos una respuesta
    const estadosSimulados = ["ACEPTADO", "RECHAZADO", "PENDIENTE"];
    const nuevoEstado =
      estadosSimulados[Math.floor(Math.random() * estadosSimulados.length)];

    await prisma.comprobantes_electronicos.update({
      where: { id: comprobanteId },
      data: {
        estado: nuevoEstado,
        fecha_actualizacion: new Date(),
      },
    });

    return {
      success: true,
      data: { estado: nuevoEstado },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Reenviar comprobante electrónico
export async function reenviarComprobanteElectronico(comprobanteId) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "CONTADOR"]);

    const comprobante = await prisma.comprobantes_electronicos.findUnique({
      where: { id: comprobanteId },
    });

    if (!comprobante) {
      return {
        success: false,
        error: "Comprobante no encontrado",
      };
    }

    // Aquí se implementaría el reenvío real a SUNAT
    // Por ahora simulamos el proceso
    await prisma.comprobantes_electronicos.update({
      where: { id: comprobanteId },
      data: {
        estado: "PENDIENTE",
        fecha_actualizacion: new Date(),
      },
    });

    return {
      success: true,
      data: { mensaje: "Comprobante reenviado correctamente" },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Obtener estadísticas de facturación
export async function obtenerEstadisticasFacturacion() {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "CONTADOR"]);

    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    // Mes anterior para calcular crecimiento
    const inicioMesAnterior = new Date(
      hoy.getFullYear(),
      hoy.getMonth() - 1,
      1
    );
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    const [
      totalComprobantes,
      comprobantesDelMes,
      montoFacturadoMes,
      montoFacturadoMesAnterior,
      enviosPendientes,
      estadisticasPorEstado,
    ] = await Promise.all([
      // Total de comprobantes (excluir eliminados)
      prisma.comprobantes_electronicos.count({
        where: { deletedAt: null },
      }),

      // Comprobantes del mes actual (excluir eliminados)
      prisma.comprobantes_electronicos.count({
        where: {
          deletedAt: null,
          fechaEmision: {
            gte: inicioMes,
            lte: finMes,
          },
        },
      }),

      // Monto facturado en el mes (excluir eliminados)
      prisma.comprobantes_electronicos.aggregate({
        where: {
          deletedAt: null,
          fechaEmision: {
            gte: inicioMes,
            lte: finMes,
          },
          estado: "ACEPTADO",
        },
        _sum: {
          total: true,
        },
      }),

      // Monto facturado mes anterior (para calcular crecimiento)
      prisma.comprobantes_electronicos.aggregate({
        where: {
          deletedAt: null,
          fechaEmision: {
            gte: inicioMesAnterior,
            lte: finMesAnterior,
          },
          estado: "ACEPTADO",
        },
        _sum: {
          total: true,
        },
      }),

      // Envíos pendientes de facturar
      prisma.envios.count({
        where: {
          comprobantes: {
            none: {},
          },
          estado: {
            in: ["ENTREGADO", "EN_REPARTO", "EN_TRANSITO"],
          },
        },
      }),

      // Estadísticas por estado (excluir eliminados)
      prisma.comprobantes_electronicos.groupBy({
        by: ["estado"],
        where: { deletedAt: null },
        _count: {
          estado: true,
        },
      }),
    ]);

    // Calcular estadísticas específicas por estado
    const estadosPorTipo = estadisticasPorEstado.reduce((acc, item) => {
      acc[item.estado] = item._count.estado;
      return acc;
    }, {});

    const estadisticas = {
      totalComprobantes,
      comprobantesDelMes,
      montoFacturadoMes: montoFacturadoMes._sum.total || 0,
      enviosPendientes,

      // Campos específicos que espera el frontend
      totalFacturado: montoFacturadoMes._sum.total || 0,
      facturacionMensual: montoFacturadoMes._sum.total || 0,
      comprobantesPendientes: estadosPorTipo.PENDIENTE || 0,
      comprobantesAceptados: estadosPorTipo.ACEPTADO || 0,
      comprobantesRechazados: estadosPorTipo.RECHAZADO || 0,

      // Calcular crecimiento mensual real
      crecimientoMensual: (() => {
        const montoActual = montoFacturadoMes._sum.total || 0;
        const montoAnterior = montoFacturadoMesAnterior._sum.total || 0;

        if (montoAnterior === 0) return 0;

        return ((montoActual - montoAnterior) / montoAnterior) * 100;
      })(),

      // Estadísticas por estado
      porEstado: estadosPorTipo,
    };

    return {
      success: true,
      data: estadisticas,
    };
  } catch (error) {
    return handleActionError(error);
  }
}
// Función para obtener series disponibles
export async function obtenerSeriesDisponibles() {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "CONTADOR"]);

    // Series predefinidas según SUNAT
    const series = {
      BOLETA: ["B001", "B002", "B003"],
      FACTURA: ["F001", "F002", "F003"],
      NOTA_CREDITO: ["BC01", "FC01"],
      NOTA_DEBITO: ["BD01", "FD01"],
    };

    return {
      success: true,
      data: series,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Función para validar RUC/DNI con SUNAT (simulada)
export async function validarDocumentoSunat(tipoDocumento, numeroDocumento) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "CONTADOR"]);

    // Simulación de validación con SUNAT
    // En producción, aquí se haría la consulta real a la API de SUNAT

    if (tipoDocumento === "RUC" && numeroDocumento.length === 11) {
      // Simulación de datos de empresa
      return {
        success: true,
        data: {
          numeroDocumento,
          razonSocial: "EMPRESA EJEMPLO S.A.C.",
          direccion: "AV. EJEMPLO 123, LIMA, LIMA",
          estado: "ACTIVO",
          condicion: "HABIDO",
        },
      };
    } else if (tipoDocumento === "DNI" && numeroDocumento.length === 8) {
      // Simulación de datos de persona
      return {
        success: true,
        data: {
          numeroDocumento,
          nombres: "JUAN CARLOS",
          apellidoPaterno: "PEREZ",
          apellidoMaterno: "GARCIA",
        },
      };
    }

    return {
      success: false,
      error: "Documento no válido o no encontrado",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Función para anular comprobante
export async function anularComprobante(comprobanteId, motivo) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "CONTADOR"]);

    const comprobante = await prisma.comprobantes_electronicos.findUnique({
      where: { id: comprobanteId },
    });

    if (!comprobante) {
      return {
        success: false,
        error: "Comprobante no encontrado",
      };
    }

    if (comprobante.estado === "ANULADO") {
      return {
        success: false,
        error: "El comprobante ya está anulado",
      };
    }

    // Actualizar estado a anulado
    await prisma.comprobantes_electronicos.update({
      where: { id: comprobanteId },
      data: {
        estado: "ANULADO",
        observaciones: `${
          comprobante.observaciones || ""
        }\n\nANULADO: ${motivo}`,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: { mensaje: "Comprobante anulado correctamente" },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Función para obtener comprobante por ID con todos los detalles
export async function obtenerComprobantePorId(comprobanteId) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "CONTADOR"]);

    const comprobante = await prisma.comprobantes_electronicos.findUnique({
      where: { id: comprobanteId },
      include: {
        cliente: true,
        envio: {
          include: {
            sucursalOrigen: true,
            sucursalDestino: true,
          },
        },
        detalles: {
          orderBy: { orden: "asc" },
        },
      },
    });

    if (!comprobante) {
      return {
        success: false,
        error: "Comprobante no encontrado",
      };
    }

    return {
      success: true,
      data: comprobante,
    };
  } catch (error) {
    return handleActionError(error);
  }
}
