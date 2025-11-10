"use server";

import { logError, handleServerActionError } from "@/lib/utils/error-handler";

/**
 * Servicio de envío de SMS
 * 
 * Soporta múltiples proveedores:
 * - Twilio (recomendado)
 * - Nexmo/Vonage
 * - AWS SNS
 * - Infobip
 * 
 * Variables de entorno:
 * - SMS_SERVICE: 'twilio' | 'nexmo' | 'aws' | 'infobip' | 'simulation'
 * - TWILIO_ACCOUNT_SID: (para Twilio)
 * - TWILIO_AUTH_TOKEN: (para Twilio)
 * - TWILIO_PHONE_NUMBER: (para Twilio)
 */

// Validar formato de número de teléfono peruano
function validarTelefonoPeruano(telefono) {
  if (!telefono) return false;
  // Remover espacios y caracteres especiales
  const numero = telefono.replace(/\D/g, "");
  // Debe tener 9 dígitos (número local) o 12 dígitos (con código de país)
  return /^(9\d{8}|519\d{8})$/.test(numero);
}

// Formatear número para envío (agregar código de país si es necesario)
function formatearNumero(telefono) {
  const numero = telefono.replace(/\D/g, "");
  // Si tiene 9 dígitos, agregar código de país Perú (51)
  if (numero.length === 9) {
    return `+51${numero}`;
  }
  // Si ya tiene código de país, asegurar el +
  if (numero.startsWith("51")) {
    return `+${numero}`;
  }
  return `+${numero}`;
}

/**
 * Enviar SMS usando Twilio
 */
async function enviarSMSTwilio({ destinatario, mensaje }) {
  try {
    // Validar que las variables de entorno estén configuradas
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error(
        "Configuración de Twilio incompleta. Verifica TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_PHONE_NUMBER"
      );
    }

    // Importar Twilio dinámicamente
    const twilio = await import("twilio");
    const client = twilio.default(accountSid, authToken);

    const numeroFormateado = formatearNumero(destinatario);

    const message = await client.messages.create({
      body: mensaje,
      from: fromNumber,
      to: numeroFormateado,
    });

    return {
      success: true,
      messageId: message.sid,
      timestamp: new Date(),
      provider: "twilio",
    };
  } catch (error) {
    logError(error, { service: "sms", provider: "twilio" });
    throw error;
  }
}

/**
 * Enviar SMS usando simulación (para desarrollo)
 */
async function enviarSMSSimulacion({ destinatario, mensaje }) {
  // Validar formato de teléfono
  if (!validarTelefonoPeruano(destinatario)) {
    return {
      success: false,
      error: "Número de teléfono inválido. Debe ser un número peruano válido.",
    };
  }

  // En desarrollo, solo loggear
  if (process.env.NODE_ENV === "development") {
    console.log("📱 [SIMULACIÓN] SMS enviado:", {
      to: formatearNumero(destinatario),
      message: mensaje.substring(0, 100),
      preview: mensaje.length > 100 ? "..." : "",
    });
  }

  return {
    success: true,
    messageId: `sms_sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: new Date(),
    provider: "simulation",
    simulated: true,
  };
}

/**
 * Función principal para enviar SMS
 */
export async function enviarSMS({ destinatario, mensaje }) {
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
    const smsProvider = process.env.SMS_SERVICE || "simulation";

    let resultado;

    switch (smsProvider.toLowerCase()) {
      case "twilio":
        resultado = await enviarSMSTwilio({ destinatario, mensaje });
        break;
      case "simulation":
      default:
        resultado = await enviarSMSSimulacion({ destinatario, mensaje });
        break;
      // Aquí se pueden agregar más proveedores:
      // case "nexmo":
      //   resultado = await enviarSMSNexmo({ destinatario, mensaje });
      //   break;
      // case "aws":
      //   resultado = await enviarSMSAWS({ destinatario, mensaje });
      //   break;
    }

    return resultado;
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * Verificar si el servicio de SMS está configurado
 */
export async function isSMSServiceConfigured() {
  const provider = process.env.SMS_SERVICE || "simulation";
  
  if (provider === "simulation") {
    return { configured: false, provider: "simulation", message: "Usando simulación" };
  }

  if (provider === "twilio") {
    const hasConfig =
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER;
    
    return {
      configured: hasConfig,
      provider: "twilio",
      message: hasConfig ? "Twilio configurado" : "Faltan credenciales de Twilio",
    };
  }

  return { configured: false, provider, message: "Proveedor desconocido" };
}

/**
 * Ejemplo de integración con Twilio (descomentar y configurar cuando se implemente)
 * 
 * import twilio from 'twilio';
 * 
 * const client = twilio(
 *   process.env.TWILIO_ACCOUNT_SID,
 *   process.env.TWILIO_AUTH_TOKEN
 * );
 * 
 * export async function enviarSMS({ destinatario, mensaje }) {
 *   try {
 *     const message = await client.messages.create({
 *       body: mensaje,
 *       from: process.env.TWILIO_PHONE_NUMBER,
 *       to: destinatario,
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



