"use server";

import { Resend } from 'resend';

/**
 * Servicio de envío de emails usando Resend
 * 
 * Variables de entorno requeridas:
 * - RESEND_API_KEY: API key de Resend
 * - EMAIL_FROM: Email remitente (ej: notificaciones@tudominio.com)
 */

// Inicializar cliente de Resend
let resend = null;

function getResendClient() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ RESEND_API_KEY no configurada. Los emails se simularán.");
      return null;
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

/**
 * Convierte texto plano a HTML básico
 */
function convertirTextoAHTML(mensaje) {
  // Si ya es HTML, retornarlo tal cual
  if (mensaje.includes('<html>') || mensaje.includes('<div>') || mensaje.includes('<p>')) {
    return mensaje;
  }
  
  // Convertir saltos de línea a <br>
  return mensaje
    .split('\n')
    .map(linea => `<p>${linea || '&nbsp;'}</p>`)
    .join('');
}

export async function enviarEmail({ destinatario, asunto, mensaje, html }) {
  try {
    // Validar destinatario
    if (!destinatario || !destinatario.trim()) {
      return {
        success: false,
        error: "El destinatario es requerido",
      };
    }

    // Validar asunto
    if (!asunto || !asunto.trim()) {
      return {
        success: false,
        error: "El asunto es requerido",
      };
    }

    // Obtener cliente de Resend
    const client = getResendClient();
    
    // Si no hay API key, simular envío (modo desarrollo)
    if (!client) {
      console.log("📧 [SIMULADO] Email enviado:", {
        to: destinatario,
        subject: asunto,
        message: mensaje.substring(0, 100) + "...",
      });

      return {
        success: true,
        messageId: `email_simulado_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        timestamp: new Date(),
      };
    }

    // Obtener email remitente
    const emailFrom = process.env.EMAIL_FROM;
    if (!emailFrom) {
      return {
        success: false,
        error: "EMAIL_FROM no configurado en variables de entorno",
      };
    }

    // Validar que no se use un dominio no verificado (como gmail.com)
    const dominioFrom = emailFrom.split('@')[1];
    const dominiosNoPermitidos = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'];
    
    if (dominiosNoPermitidos.includes(dominioFrom?.toLowerCase())) {
      console.error(`⚠️ Dominio no permitido: ${dominioFrom}`);
      return {
        success: false,
        error: `El dominio ${dominioFrom} no está verificado en Resend. Por favor, verifica tu propio dominio en https://resend.com/domains o usa el dominio de prueba: onboarding@resend.dev`,
      };
    }

    // Preparar contenido HTML
    const contenidoHTML = html || convertirTextoAHTML(mensaje);

    // Enviar email con Resend
    const { data, error } = await client.emails.send({
      from: emailFrom,
      to: destinatario,
      subject: asunto,
      html: contenidoHTML,
    });

    if (error) {
      console.error("Error de Resend:", error);
      
      // Mensaje de error más descriptivo para dominio no verificado
      let mensajeError = error.message || "Error al enviar email con Resend";
      
      if (error.message?.includes("domain is not verified") || error.message?.includes("not verified")) {
        mensajeError = `El dominio del remitente no está verificado en Resend. Por favor, verifica tu dominio en https://resend.com/domains. Para desarrollo, puedes usar: onboarding@resend.dev`;
      }
      
      return {
        success: false,
        error: mensajeError,
      };
    }

    console.log("✅ Email enviado exitosamente:", {
      to: destinatario,
      subject: asunto,
      messageId: data.id,
    });

    return {
      success: true,
      messageId: data.id,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Error al enviar email:", error);
    return {
      success: false,
      error: error.message || "Error al enviar email",
    };
  }
}



