"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SeguimientoPublicoSchema } from "@/lib/validaciones-zod";
import { procesarNotificacion } from "@/lib/services/notificaciones/notificacion-service";
import { crearNotificacionAutomatica } from "@/lib/utils/crear-notificacion-automatica";

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
  if (error.name === "ZodError") {
    return {
      success: false,
      error: "Datos inválidos",
      details: error.errors,
    };
  }

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

// Función auxiliar para calcular progreso
function calcularProgreso(estado) {
  const progresoMap = {
    REGISTRADO: 10,
    RECOLECTADO: 25,
    EN_AGENCIA_ORIGEN: 35,
    EN_TRANSITO: 50,
    EN_AGENCIA_DESTINO: 70,
    EN_REPARTO: 85,
    ENTREGADO: 100,
    DEVUELTO: 100,
    EXTRAVIADO: 100,
    ANULADO: 100,
  };

  return progresoMap[estado] || 0;
}

// Obtener seguimiento público mejorado
export async function getSeguimientoPublicoMejorado(numeroGuia) {
  try {
    if (
      !numeroGuia ||
      typeof numeroGuia !== "string" ||
      numeroGuia.trim() === ""
    ) {
      return {
        success: false,
        error: "Debe proporcionar un número de guía válido",
      };
    }

    const validatedParams = SeguimientoPublicoSchema.parse({
      guia: numeroGuia.trim(),
    });

    const envio = await prisma.envios.findUnique({
      where: { guia: validatedParams.guia.toUpperCase() },
      select: {
        id: true,
        guia: true,
        estado: true,
        progreso: true,
        peso: true,
        descripcion: true,
        total: true,
        tipoServicio: true,
        modalidad: true,
        fechaRegistro: true,
        fechaRecoleccion: true,
        fechaEnTransito: true,
        fechaLlegadaDestino: true,
        fechaEntrega: true,
        instruccionesEspeciales: true,
        remitenteNombre: true,
        remitenteTelefono: true,
        remitenteEmail: true,
        remitenteDireccion: true,
        destinatarioNombre: true,
        destinatarioTelefono: true,
        destinatarioEmail: true,
        destinatarioDireccion: true,
        cliente: {
          select: {
            tipoDocumento: true,
            numeroDocumento: true,
            razonSocial: true,
            ruc: true,
            nombre: true,
            apellidos: true,
          },
        },
        sucursalOrigen: {
          select: {
            nombre: true,
            direccion: true,
            telefono: true,
            provincia: true,
          },
        },
        sucursalDestino: {
          select: {
            nombre: true,
            direccion: true,
            telefono: true,
            provincia: true,
          },
        },
        eventos_envio: {
          orderBy: { fechaEvento: "desc" },
          select: {
            id: true,
            estado: true,
            descripcion: true,
            comentario: true,
            ubicacion: true,
            direccion: true,
            fechaEvento: true,
            createdAt: true,
            nombreResponsable: true,
            fotoUrl: true,
            firmaUrl: true,
          },
        },
      },
    });

    if (!envio) {
      return {
        success: false,
        error: "No se encontró ningún envío con ese número de guía",
      };
    }

    const seguimientoData = {
      guia: envio.guia || "N/A",
      estado: envio.estado || "DESCONOCIDO",
      progreso:
        envio.progreso || calcularProgreso(envio.estado || "REGISTRADO"),
      peso: envio.peso || 0,
      descripcion: envio.descripcion || "Sin descripción",
      total: envio.total || 0,
      tipoServicio: envio.tipoServicio || "NORMAL",
      modalidad: envio.modalidad || "SUCURSAL_SUCURSAL",
      fechaRegistro: envio.fechaRegistro || null,
      fechaRecoleccion: envio.fechaRecoleccion || null,
      fechaEnTransito: envio.fechaEnTransito || null,
      fechaLlegadaDestino: envio.fechaLlegadaDestino || null,
      fechaEntrega: envio.fechaEntrega || null,
      instruccionesEspeciales: envio.instruccionesEspeciales || null,
      remitente: {
        nombre:
          (envio.cliente?.tipoDocumento === "RUC"
            ? envio.cliente?.razonSocial
            : envio.remitenteNombre) ||
          envio.remitenteNombre ||
          "No especificado",
        apellidos: "",
        telefono: envio.remitenteTelefono || "No especificado",
        email: envio.remitenteEmail || null,
        direccion: envio.remitenteDireccion || null,
        tipoDocumento: envio.cliente?.tipoDocumento || null,
        numeroDocumento:
          (envio.cliente?.tipoDocumento === "RUC"
            ? envio.cliente?.ruc || envio.cliente?.numeroDocumento
            : envio.cliente?.numeroDocumento) || null,
      },
      destinatario: {
        nombre: envio.destinatarioNombre || "No especificado",
        apellidos: "",
        telefono: envio.destinatarioTelefono || "No especificado",
        email: envio.destinatarioEmail || null,
        direccion: envio.destinatarioDireccion || null,
      },
      sucursalOrigen: {
        nombre: envio.sucursalOrigen?.nombre || "No especificado",
        direccion: envio.sucursalOrigen?.direccion || "N/A",
        telefono: envio.sucursalOrigen?.telefono || "N/A",
        provincia: envio.sucursalOrigen?.provincia || "N/A",
      },
      sucursalDestino: {
        nombre: envio.sucursalDestino?.nombre || "No especificado",
        direccion: envio.sucursalDestino?.direccion || "N/A",
        telefono: envio.sucursalDestino?.telefono || "N/A",
        provincia: envio.sucursalDestino?.provincia || "N/A",
      },
      eventos: (envio.eventos_envio || []).map((evento) => ({
        id: evento?.id || null,
        estado: evento?.estado || "DESCONOCIDO",
        descripcion:
          evento?.descripcion || evento?.comentario || "Sin descripción",
        comentario: evento?.comentario || null,
        ubicacion: evento?.ubicacion || "No especificado",
        direccion: evento?.direccion || null,
        fechaEvento: evento?.fechaEvento || evento?.createdAt || null,
        createdAt: evento?.createdAt || null,
        responsable: evento?.nombreResponsable || "Sistema",
        fotoUrl: evento?.fotoUrl || null,
        firmaUrl: evento?.firmaUrl || null,
      })),
    };

    return {
      success: true,
      data: seguimientoData,
    };
  } catch (error) {
    if (error.name === "ZodError") {
      return {
        success: false,
        error: "Número de guía inválido. Debe tener el formato correcto.",
        details: error.errors,
      };
    }

    return handleActionError(error);
  }
}

// Crear evento de seguimiento
export async function crearEventoSeguimiento(envioId, eventoData) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    const { estado, descripcion, comentario, ubicacion, direccion } =
      eventoData;

    const evento = await prisma.eventos_envio.create({
      data: {
        envioId,
        estado,
        descripcion,
        comentario: comentario || null,
        ubicacion: ubicacion || null,
        direccion: direccion || null,
        fechaEvento: new Date(),
      },
    });

    // Actualizar el estado del envío
    await prisma.envios.update({
      where: { id: envioId },
      data: {
        estado,
        progreso: calcularProgreso(estado),
      },
    });

    // Crear notificación automática
    await crearNotificacionAutomatica({
      envioId,
      tipo: "CAMBIO_ESTADO",
      estado,
      descripcion: descripcion || comentario || "",
    });

    return {
      success: true,
      data: evento,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Obtener estadísticas de seguimiento mejoradas
export async function getEstadisticasSeguimientoMejoradas() {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    const [totalEnvios, enviosPorEstado, eventosRecientes] = await Promise.all([
      prisma.envios.count({
        where: { deletedAt: null },
      }),
      prisma.envios.groupBy({
        by: ["estado"],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      prisma.eventos_envio.findMany({
        take: 10,
        orderBy: { fechaEvento: "desc" },
        include: {
          envio: {
            select: {
              guia: true,
              destinatarioNombre: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalEnvios,
        enviosPorEstado,
        eventosRecientes,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Procesar notificaciones pendientes
export async function procesarNotificacionesPendientes() {
  try {
    await checkPermissions(["SUPER_ADMIN"]);

    const notificacionesPendientes = await prisma.notificaciones.findMany({
      where: {
        estado: "PENDIENTE",
      },
      take: 50,
    });

    const resultados = [];
    for (const notificacion of notificacionesPendientes) {
      const resultado = await procesarNotificacion(notificacion.id);
      resultados.push(resultado);
    }

    return {
      success: true,
      data: {
        procesadas: resultados.length,
        exitosas: resultados.filter((r) => r.success).length,
        fallidas: resultados.filter((r) => !r.success).length,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
