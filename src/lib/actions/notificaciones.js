"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { procesarNotificacionesPendientes as procesarNotificacionesPendientesService } from "@/lib/services/notificaciones/notificacion-service";

// Función auxiliar para verificar permisos
async function checkPermissions(requiredRoles = []) {
  const { auth } = await import("@/lib/auth");
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
    return { success: false, error: error.message };
  }
  return { success: false, error: "Error interno del servidor" };
}

/**
 * Obtener notificaciones con filtros y paginación
 */
export async function getNotificaciones(filtros = {}) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    const {
      estado = "",
      canal = "",
      tipo = "",
      envioId = "",
      fechaDesde = null,
      fechaHasta = null,
      page = 1,
      limit = 50,
    } = filtros;

    const skip = (page - 1) * limit;

    // Construir condiciones de filtro
    const whereConditions = {};

    if (estado && estado !== "TODOS") {
      whereConditions.estado = estado;
    }

    if (canal && canal !== "TODOS") {
      whereConditions.canal = canal;
    }

    if (tipo && tipo !== "TODOS") {
      whereConditions.tipo = tipo;
    }

    if (envioId) {
      whereConditions.envioId = envioId;
    }

    // Filtros de fecha
    if (fechaDesde || fechaHasta) {
      whereConditions.createdAt = {};
      if (fechaDesde) {
        whereConditions.createdAt.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        const fechaHastaFinal = new Date(fechaHasta);
        fechaHastaFinal.setHours(23, 59, 59, 999);
        whereConditions.createdAt.lte = fechaHastaFinal;
      }
    }

    // Obtener notificaciones con relaciones
    const [notificaciones, total] = await Promise.all([
      prisma.notificaciones.findMany({
        where: whereConditions,
        include: {
          envio: {
            select: {
              id: true,
              guia: true,
              cliente: {
                select: {
                  id: true,
                  nombre: true,
                  apellidos: true,
                  razonSocial: true,
                  email: true,
                  telefono: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notificaciones.count({ where: whereConditions }),
    ]);

    return {
      success: true,
      data: {
        notificaciones,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Obtener estadísticas de notificaciones
 */
export async function getEstadisticasNotificaciones() {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    const [
      total,
      pendientes,
      enviadas,
      entregadas,
      fallidas,
      canceladas,
      porEmail,
      porSMS,
      porWhatsApp,
    ] = await Promise.all([
      prisma.notificaciones.count(),
      prisma.notificaciones.count({ where: { estado: "PENDIENTE" } }),
      prisma.notificaciones.count({ where: { estado: "ENVIADA" } }),
      prisma.notificaciones.count({ where: { estado: "ENTREGADA" } }),
      prisma.notificaciones.count({ where: { estado: "FALLIDA" } }),
      prisma.notificaciones.count({ where: { estado: "CANCELADA" } }),
      prisma.notificaciones.count({ where: { canal: "EMAIL" } }),
      prisma.notificaciones.count({ where: { canal: "SMS" } }),
      prisma.notificaciones.count({ where: { canal: "WHATSAPP" } }),
    ]);

    return {
      success: true,
      data: {
        total,
        pendientes,
        enviadas,
        entregadas,
        fallidas,
        canceladas,
        porEmail,
        porSMS,
        porWhatsApp,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Obtener configuración de notificaciones
 */
export async function obtenerConfiguracionNotificaciones() {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    const configuracionKV = await prisma.configuracion.findMany({
      where: {
        clave: {
          in: [
            "notificaciones_email",
            "notificaciones_sms",
            "notificaciones_whatsapp",
            "notificaciones_push",
            "notificaciones_llamada",
            "notificaciones_auto_registro",
            "notificaciones_auto_cambio_estado",
            "notificaciones_auto_entrega",
            "notificaciones_auto_intento",
            "notificaciones_auto_retraso",
            "notificaciones_auto_problema",
            "notificaciones_auto_recordatorio",
            "notificaciones_max_intentos",
            "notificaciones_reintento_intervalo",
            "notificaciones_plantilla_email",
            "notificaciones_plantilla_sms",
            "notificaciones_plantilla_whatsapp",
          ],
        },
      },
    });

    // Convertir configuración clave-valor a objeto
    const configObj = {};
    configuracionKV.forEach((config) => {
      const valor =
        config.tipo === "boolean"
          ? config.valor === "true" || config.valor === true
          : config.tipo === "number"
          ? parseFloat(config.valor) || 0
          : String(config.valor);
      configObj[config.clave] = valor;
    });

    return {
      success: true,
      data: {
        email: configObj.notificaciones_email || false,
        sms: configObj.notificaciones_sms || false,
        whatsapp: configObj.notificaciones_whatsapp || false,
        push: configObj.notificaciones_push || false,
        llamada: configObj.notificaciones_llamada || false,
        autoRegistro: configObj.notificaciones_auto_registro || false,
        autoCambioEstado: configObj.notificaciones_auto_cambio_estado || false,
        autoEntrega: configObj.notificaciones_auto_entrega || false,
        autoIntento: configObj.notificaciones_auto_intento || false,
        autoRetraso: configObj.notificaciones_auto_retraso || false,
        autoProblema: configObj.notificaciones_auto_problema || false,
        autoRecordatorio: configObj.notificaciones_auto_recordatorio || false,
        maxIntentos: configObj.notificaciones_max_intentos || 3,
        reintentoIntervalo: configObj.notificaciones_reintento_intervalo || 60,
        plantillaEmail: configObj.notificaciones_plantilla_email || "",
        plantillaSMS: configObj.notificaciones_plantilla_sms || "",
        plantillaWhatsApp: configObj.notificaciones_plantilla_whatsapp || "",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Actualizar configuración de notificaciones
 */
export async function actualizarConfiguracionNotificaciones(configuracion) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    const configuracionesAGuardar = [
      {
        clave: "notificaciones_email",
        valor: configuracion.email ? "true" : "false",
        tipo: "boolean",
      },
      {
        clave: "notificaciones_sms",
        valor: configuracion.sms ? "true" : "false",
        tipo: "boolean",
      },
      {
        clave: "notificaciones_whatsapp",
        valor: configuracion.whatsapp ? "true" : "false",
        tipo: "boolean",
      },
      {
        clave: "notificaciones_push",
        valor: configuracion.push ? "true" : "false",
        tipo: "boolean",
      },
      {
        clave: "notificaciones_llamada",
        valor: configuracion.llamada ? "true" : "false",
        tipo: "boolean",
      },
      {
        clave: "notificaciones_auto_registro",
        valor: configuracion.autoRegistro ? "true" : "false",
        tipo: "boolean",
      },
      {
        clave: "notificaciones_auto_cambio_estado",
        valor: configuracion.autoCambioEstado ? "true" : "false",
        tipo: "boolean",
      },
      {
        clave: "notificaciones_auto_entrega",
        valor: configuracion.autoEntrega ? "true" : "false",
        tipo: "boolean",
      },
      {
        clave: "notificaciones_auto_intento",
        valor: configuracion.autoIntento ? "true" : "false",
        tipo: "boolean",
      },
      {
        clave: "notificaciones_auto_retraso",
        valor: configuracion.autoRetraso ? "true" : "false",
        tipo: "boolean",
      },
      {
        clave: "notificaciones_auto_problema",
        valor: configuracion.autoProblema ? "true" : "false",
        tipo: "boolean",
      },
      {
        clave: "notificaciones_auto_recordatorio",
        valor: configuracion.autoRecordatorio ? "true" : "false",
        tipo: "boolean",
      },
      {
        clave: "notificaciones_max_intentos",
        valor: String(configuracion.maxIntentos || 3),
        tipo: "number",
      },
      {
        clave: "notificaciones_reintento_intervalo",
        valor: String(configuracion.reintentoIntervalo || 60),
        tipo: "number",
      },
      {
        clave: "notificaciones_plantilla_email",
        valor: configuracion.plantillaEmail || "",
        tipo: "string",
      },
      {
        clave: "notificaciones_plantilla_sms",
        valor: configuracion.plantillaSMS || "",
        tipo: "string",
      },
      {
        clave: "notificaciones_plantilla_whatsapp",
        valor: configuracion.plantillaWhatsApp || "",
        tipo: "string",
      },
    ];

    // Guardar cada configuración
    for (const config of configuracionesAGuardar) {
      await prisma.configuracion.upsert({
        where: { clave: config.clave },
        update: {
          valor: config.valor,
          tipo: config.tipo,
          updatedAt: new Date(),
        },
        create: {
          clave: config.clave,
          valor: config.valor,
          tipo: config.tipo,
          descripcion: `Configuración de notificaciones: ${config.clave}`,
        },
      });
    }

    revalidatePath("/dashboard/configuracion/notificaciones");
    revalidatePath("/dashboard/configuracion/general");

    return {
      success: true,
      message: "Configuración de notificaciones actualizada correctamente",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Procesar notificaciones pendientes (wrapper para usar desde la UI)
 */
export async function procesarNotificacionesPendientes() {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);
    const result = await procesarNotificacionesPendientesService();
    if (result.success) {
      revalidatePath("/dashboard/configuracion/notificaciones");
    }
    return result;
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Reintentar envío de notificación fallida
 */
export async function reintentarNotificacion(notificacionId) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    const notificacion = await prisma.notificaciones.findUnique({
      where: { id: notificacionId },
    });

    if (!notificacion) {
      return { success: false, error: "Notificación no encontrada" };
    }

    if (notificacion.estado !== "FALLIDA") {
      return {
        success: false,
        error: "Solo se pueden reintentar notificaciones fallidas",
      };
    }

    // Resetear la notificación para reintento
    await prisma.notificaciones.update({
      where: { id: notificacionId },
      data: {
        estado: "PENDIENTE",
        intentos: 0,
        codigoError: null,
        respuesta: null,
      },
    });

    revalidatePath("/dashboard/configuracion/notificaciones");

    return {
      success: true,
      message: "Notificación marcada para reintento",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Cancelar notificación pendiente
 */
export async function cancelarNotificacion(notificacionId) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    const notificacion = await prisma.notificaciones.findUnique({
      where: { id: notificacionId },
    });

    if (!notificacion) {
      return { success: false, error: "Notificación no encontrada" };
    }

    if (notificacion.estado !== "PENDIENTE") {
      return {
        success: false,
        error: "Solo se pueden cancelar notificaciones pendientes",
      };
    }

    await prisma.notificaciones.update({
      where: { id: notificacionId },
      data: {
        estado: "CANCELADA",
      },
    });

    revalidatePath("/dashboard/configuracion/notificaciones");

    return {
      success: true,
      message: "Notificación cancelada correctamente",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

