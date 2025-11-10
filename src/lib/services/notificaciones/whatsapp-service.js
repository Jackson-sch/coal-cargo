"use server";

import { logError, handleServerActionError } from "@/lib/utils/error-handler";

/**
 * Servicio de envío de WhatsApp
 * 
 * Soporta múltiples proveedores:
 * - Twilio WhatsApp API (recomendado)
 * - WhatsApp Business API (Meta)
 * - MessageBird
 * - ChatAPI
 * 
 * Variables de entorno:
 * - WHATSAPP_SERVICE: 'twilio' | 'meta' | 'messagebird' | 'simulation'
 * - TWILIO_ACCOUNT_SID: (para Twilio)
 * - TWILIO_AUTH_TOKEN: (para Twilio)
 * - TWILIO_WHATSAPP_NUMBER: (para Twilio, formato: whatsapp:+14155238886)
 */

// Validar formato de número de teléfono peruano
function validarTelefonoPeruano(telefono) {
  if (!telefono) return false;
  // Remover espacios y caracteres especiales
  const numero = telefono.replace(/\D/g, "");
  // Debe tener 9 dígitos (número local) o 12 dígitos (con código de país)
  return /^(9\d{8}|519\d{8})$/.test(numero);
}

// Formatear número para WhatsApp
function formatearNumeroWhatsApp(telefono) {
  const numero = telefono.replace(/\D/g, "");
  // Si tiene 9 dígitos, agregar código de país Perú (51)
  if (numero.length === 9) {
    return `whatsapp:+51${numero}`;
  }
  // Si ya tiene código de país, asegurar el formato
  if (numero.startsWith("51")) {
    return `whatsapp:+${numero}`;
  }
  return `whatsapp:+${numero}`;
}

/**
 * Enviar WhatsApp usando Twilio
 */
async function enviarWhatsAppTwilio({ destinatario, mensaje }) {
  try {
    // Validar que las variables de entorno estén configuradas
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error(
        "Configuración de Twilio WhatsApp incompleta. Verifica TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_NUMBER"
      );
    }

    // Importar Twilio dinámicamente
    const twilio = await import("twilio");
    const client = twilio.default(accountSid, authToken);

    const numeroFormateado = formatearNumeroWhatsApp(destinatario);

    const message = await client.messages.create({
      body: mensaje,
      from: fromNumber, // Formato: whatsapp:+14155238886
      to: numeroFormateado,
    });

    return {
      success: true,
      messageId: message.sid,
      timestamp: new Date(),
      provider: "twilio",
    };
  } catch (error) {
    logError(error, { service: "whatsapp", provider: "twilio" });
    throw error;
  }
}

/**
 * Enviar WhatsApp usando WhatsApp Business API (Meta)
 */
async function enviarWhatsAppMeta({ destinatario, mensaje }) {
  try {
    const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
    const apiVersion = process.env.META_WHATSAPP_API_VERSION || "v21.0";

    if (!phoneNumberId || !accessToken) {
      throw new Error(
        "Configuración de Meta WhatsApp incompleta. Verifica META_WHATSAPP_PHONE_NUMBER_ID y META_WHATSAPP_ACCESS_TOKEN"
      );
    }

    const numeroFormateado = formatearNumeroWhatsApp(destinatario).replace(
      "whatsapp:",
      ""
    );

    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: numeroFormateado,
          type: "text",
          text: { body: mensaje },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || `Error ${response.status} al enviar WhatsApp`
      );
    }

    const data = await response.json();

    return {
      success: true,
      messageId: data.messages[0]?.id,
      timestamp: new Date(),
      provider: "meta",
    };
  } catch (error) {
    logError(error, { service: "whatsapp", provider: "meta" });
    throw error;
  }
}

/**
 * Enviar WhatsApp usando simulación (para desarrollo)
 */
async function enviarWhatsAppSimulacion({ destinatario, mensaje }) {
  // Validar formato de teléfono
  if (!validarTelefonoPeruano(destinatario)) {
    return {
      success: false,
      error: "Número de teléfono inválido. Debe ser un número peruano válido.",
    };
  }

  // En desarrollo, solo loggear
  if (process.env.NODE_ENV === "development") {
    console.log("💬 [SIMULACIÓN] WhatsApp enviado:", {
      to: formatearNumeroWhatsApp(destinatario),
      message: mensaje.substring(0, 100),
      preview: mensaje.length > 100 ? "..." : "",
    });
  }

  return {
    success: true,
    messageId: `whatsapp_sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: new Date(),
    provider: "simulation",
    simulated: true,
  };
}

/**
 * Función principal para enviar WhatsApp
 */
export async function enviarWhatsApp({ destinatario, mensaje }) {
  try {
    // Validar parámetros
    if (!destinatario || !destinatario.trim()) {
      return {
        success: false,
        error: "El destinatario es requerido",
      };
    }

    if (!mensaje || !mensaje.trim()) {
      return {
        success: false,
        error: "El mensaje es requerido",
      };
    }

    // Validar formato de teléfono
    if (!validarTelefonoPeruano(destinatario)) {
      return {
        success: false,
        error: "Número de teléfono inválido. Debe ser un número peruano válido (9 dígitos).",
      };
    }

    // Obtener proveedor configurado
    const whatsappProvider = process.env.WHATSAPP_SERVICE || "simulation";

    let resultado;

    switch (whatsappProvider.toLowerCase()) {
      case "twilio":
        resultado = await enviarWhatsAppTwilio({ destinatario, mensaje });
        break;
      case "meta":
      case "whatsapp-business":
        resultado = await enviarWhatsAppMeta({ destinatario, mensaje });
        break;
      case "simulation":
      default:
        resultado = await enviarWhatsAppSimulacion({ destinatario, mensaje });
        break;
    }

    return resultado;
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * Verificar si el servicio de WhatsApp está configurado
 */
export async function isWhatsAppServiceConfigured() {
  const provider = process.env.WHATSAPP_SERVICE || "simulation";
  
  if (provider === "simulation") {
    return { configured: false, provider: "simulation", message: "Usando simulación" };
  }

  if (provider === "twilio") {
    const hasConfig =
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER;
    
    return {
      configured: hasConfig,
      provider: "twilio",
      message: hasConfig ? "Twilio WhatsApp configurado" : "Faltan credenciales de Twilio",
    };
  }

  if (provider === "meta" || provider === "whatsapp-business") {
    const hasConfig =
      process.env.META_WHATSAPP_PHONE_NUMBER_ID &&
      process.env.META_WHATSAPP_ACCESS_TOKEN;
    
    return {
      configured: hasConfig,
      provider: "meta",
      message: hasConfig ? "Meta WhatsApp configurado" : "Faltan credenciales de Meta",
    };
  }

  return { configured: false, provider, message: "Proveedor desconocido" };
}

/**
 * Ejemplo de integración con Twilio WhatsApp (descomentar y configurar cuando se implemente)
 * 
 * import twilio from 'twilio';
 * 
 * const client = twilio(
 *   process.env.TWILIO_ACCOUNT_SID,
 *   process.env.TWILIO_AUTH_TOKEN
 * );
 * 
 * export async function enviarWhatsApp({ destinatario, mensaje }) {
 *   try {
 *     const message = await client.messages.create({
 *       body: mensaje,
 *       from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
 *       to: `whatsapp:${destinatario}`,
 *     });
 * 
 *     return {
 *       success: true,
 *       messageId: message.sid,
 *       timestamp: new Date(),
 *     };
 *   } catch (error) {
 *     return {
 *       success: false,
 *       error: error.message,
 *     };
 *   }
 * }
 */



