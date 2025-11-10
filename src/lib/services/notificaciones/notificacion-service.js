"use server";

import { prisma } from "@/lib/prisma";
import { enviarEmail } from "./email-service";
import { enviarSMS } from "./sms-service";
import { enviarWhatsApp } from "./whatsapp-service";
import { obtenerConfiguracionNotificaciones } from "@/lib/actions/notificaciones";

/**
 * Procesar y enviar una notificación
 */
export async function procesarNotificacion(notificacionId) {
  try {
    // Obtener la notificación
    const notificacion = await prisma.notificaciones.findUnique({
      where: { id: notificacionId },
      include: {
        envio: {
          include: {
            cliente: true,
          },
        },
      },
    });

    if (!notificacion) {
      return {
        success: false,
        error: "Notificación no encontrada",
      };
    }

    if (notificacion.estado !== "PENDIENTE") {
      return {
        success: false,
        error: "La notificación ya fue procesada",
      };
    }

    // Obtener configuración de notificaciones
    const configResult = await obtenerConfiguracionNotificaciones();
    if (!configResult.success) {
      return {
        success: false,
        error: "Error al obtener configuración de notificaciones",
      };
    }

    const config = configResult.data;

    // Verificar si el canal está habilitado
    let canalHabilitado = false;
    switch (notificacion.canal) {
      case "EMAIL":
        canalHabilitado = config.email;
        break;
      case "SMS":
        canalHabilitado = config.sms;
        break;
      case "WHATSAPP":
        canalHabilitado = config.whatsapp;
        break;
      case "PUSH":
        canalHabilitado = config.push;
        break;
      case "LLAMADA":
        canalHabilitado = config.llamada;
        break;
    }

    if (!canalHabilitado) {
      // Marcar como cancelada si el canal no está habilitado
      await prisma.notificaciones.update({
        where: { id: notificacionId },
        data: {
          estado: "CANCELADA",
          respuesta: "Canal de notificación deshabilitado",
        },
      });

      return {
        success: false,
        error: "Canal de notificación deshabilitado",
      };
    }

    // Incrementar intentos
    const nuevosIntentos = notificacion.intentos + 1;

    // Intentar enviar según el canal
    let resultado = null;

    try {
      switch (notificacion.canal) {
        case "EMAIL":
          resultado = await enviarEmail({
            destinatario: notificacion.destinatario,
            asunto: notificacion.asunto || "Notificación de Envío",
            mensaje: notificacion.mensaje,
            html: procesarPlantilla(notificacion.mensaje, notificacion.envio),
          });
          break;

        case "SMS":
          resultado = await enviarSMS({
            destinatario: notificacion.destinatario,
            mensaje: procesarPlantilla(notificacion.mensaje, notificacion.envio),
          });
          break;

        case "WHATSAPP":
          resultado = await enviarWhatsApp({
            destinatario: notificacion.destinatario,
            mensaje: procesarPlantilla(notificacion.mensaje, notificacion.envio),
          });
          break;

        case "PUSH":
          // TODO: Implementar notificaciones push
          resultado = {
            success: false,
            error: "Notificaciones push no implementadas",
          };
          break;

        case "LLAMADA":
          // TODO: Implementar llamadas automáticas
          resultado = {
            success: false,
            error: "Llamadas automáticas no implementadas",
          };
          break;

        default:
          resultado = {
            success: false,
            error: "Canal no válido",
          };
      }

      // Actualizar estado de la notificación
      if (resultado.success) {
        await prisma.notificaciones.update({
          where: { id: notificacionId },
          data: {
            estado: "ENVIADA",
            intentos: nuevosIntentos,
            enviadaEn: new Date(),
            respuesta: resultado.messageId || "Enviado exitosamente",
          },
        });

        return {
          success: true,
          messageId: resultado.messageId,
          timestamp: resultado.timestamp,
        };
      } else {
        // Verificar si se alcanzó el máximo de intentos
        if (nuevosIntentos >= notificacion.maxIntentos) {
          await prisma.notificaciones.update({
            where: { id: notificacionId },
            data: {
              estado: "FALLIDA",
              intentos: nuevosIntentos,
              codigoError: resultado.error || "Error desconocido",
              respuesta: resultado.error || "Error al enviar",
            },
          });
        } else {
          // Mantener como pendiente para reintento
          await prisma.notificaciones.update({
            where: { id: notificacionId },
            data: {
              intentos: nuevosIntentos,
              codigoError: resultado.error || "Error al enviar",
              respuesta: resultado.error || "Error al enviar",
            },
          });
        }

        return {
          success: false,
          error: resultado.error || "Error al enviar notificación",
        };
      }
    } catch (error) {
      // Error en el envío
      if (nuevosIntentos >= notificacion.maxIntentos) {
        await prisma.notificaciones.update({
          where: { id: notificacionId },
          data: {
            estado: "FALLIDA",
            intentos: nuevosIntentos,
            codigoError: error.message || "Error desconocido",
            respuesta: error.message || "Error al enviar",
          },
        });
      } else {
        await prisma.notificaciones.update({
          where: { id: notificacionId },
          data: {
            intentos: nuevosIntentos,
            codigoError: error.message || "Error desconocido",
            respuesta: error.message || "Error al enviar",
          },
        });
      }

      return {
        success: false,
        error: error.message || "Error al procesar notificación",
      };
    }
  } catch (error) {
    console.error("Error al procesar notificación:", error);
    return {
      success: false,
      error: error.message || "Error interno al procesar notificación",
    };
  }
}

/**
 * Procesar plantilla de mensaje reemplazando variables
 */
function procesarPlantilla(mensaje, envio) {
  if (!envio) return mensaje;

  const cliente = envio.cliente;
  const nombreCliente = cliente?.esEmpresa
    ? cliente.razonSocial
    : `${cliente?.nombre || ""} ${cliente?.apellidos || ""}`.trim();

  const variables = {
    "{guia}": envio.guia || "",
    "{cliente}": nombreCliente || "",
    "{estado}": envio.estado || "",
    "{destinatario}": envio.destinatarioNombre || "",
    "{direccion}": envio.destinatarioDireccion || "",
    "{telefono}": envio.destinatarioTelefono || "",
    "{total}": envio.total?.toFixed(2) || "0.00",
    "{peso}": envio.peso?.toString() || "",
    "{descripcion}": envio.descripcion || "",
  };

  let mensajeProcesado = mensaje;
  Object.entries(variables).forEach(([key, value]) => {
    mensajeProcesado = mensajeProcesado.replace(new RegExp(key, "g"), value);
  });

  return mensajeProcesado;
}

/**
 * Procesar todas las notificaciones pendientes
 */
export async function procesarNotificacionesPendientes() {
  try {
    // Obtener configuración para el intervalo de reintento
    const configResult = await obtenerConfiguracionNotificaciones();
    const intervaloReintento = configResult.success
      ? configResult.data.reintentoIntervalo || 60
      : 60;

    // Calcular fecha límite para reintentos (solo notificaciones que han esperado el intervalo)
    const fechaLimite = new Date();
    fechaLimite.setMinutes(fechaLimite.getMinutes() - intervaloReintento);

    // Obtener notificaciones pendientes
    const notificacionesPendientes = await prisma.notificaciones.findMany({
      where: {
        estado: "PENDIENTE",
        OR: [
          { intentos: 0 }, // Primera vez
          { updatedAt: { lte: fechaLimite } }, // Reintentos que han esperado el intervalo
        ],
      },
      take: 50, // Procesar máximo 50 a la vez
    });

    const resultados = {
      procesadas: 0,
      exitosas: 0,
      fallidas: 0,
      errores: [],
    };

    for (const notificacion of notificacionesPendientes) {
      const resultado = await procesarNotificacion(notificacion.id);
      resultados.procesadas++;

      if (resultado.success) {
        resultados.exitosas++;
      } else {
        resultados.fallidas++;
        if (resultado.error) {
          resultados.errores.push(resultado.error);
        }
      }
    }

    return {
      success: true,
      data: resultados,
    };
  } catch (error) {
    console.error("Error al procesar notificaciones pendientes:", error);
    return {
      success: false,
      error: error.message || "Error al procesar notificaciones",
    };
  }
}



