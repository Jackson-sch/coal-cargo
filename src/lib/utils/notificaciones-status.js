"use server";

import { isSMSServiceConfigured } from "@/lib/services/notificaciones/sms-service";
import { isWhatsAppServiceConfigured } from "@/lib/services/notificaciones/whatsapp-service";

/**
 * Obtener el estado de todos los servicios de notificaciones
 */
export async function obtenerEstadoNotificaciones() {
  const emailConfigured = !!(
    process.env.RESEND_API_KEY && process.env.EMAIL_FROM
  );

  const smsStatus = await isSMSServiceConfigured();
  const whatsappStatus = await isWhatsAppServiceConfigured();

  return {
    email: {
      configured: emailConfigured,
      provider: "resend",
      message: emailConfigured
        ? "Email configurado correctamente"
        : "Faltan RESEND_API_KEY o EMAIL_FROM",
    },
    sms: smsStatus,
    whatsapp: whatsappStatus,
    overall: {
      configured:
        emailConfigured &&
        (smsStatus.configured || whatsappStatus.configured),
      servicesConfigured: [
        emailConfigured && "email",
        smsStatus.configured && "sms",
        whatsappStatus.configured && "whatsapp",
      ].filter(Boolean),
    },
  };
}

