"use server";

import { enviarEmail } from "@/lib/services/notificaciones/email-service";
import { prisma } from "@/lib/prisma";

/**
 * Generar HTML del email para comprobante
 */
function generarHTMLEmailComprobante(comprobante, tipo = "emision") {
  const tipoComprobante = comprobante.tipoComprobante === "FACTURA" ? "Factura" : "Boleta";
  const nombreCliente = comprobante.nombreCliente || "Cliente";
  const numeroCompleto = comprobante.numeroCompleto || "";
  const total = comprobante.total?.toFixed(2) || "0.00";
  const fechaEmision = new Date(comprobante.fechaEmision).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let titulo = "";
  let mensaje = "";

  if (tipo === "emision") {
    titulo = `${tipoComprobante} Electrónica Emitida`;
    mensaje = `Su ${tipoComprobante.toLowerCase()} electrónica ha sido emitida exitosamente.`;
  } else if (tipo === "reenvio") {
    titulo = `Reenvío de ${tipoComprobante} Electrónica`;
    mensaje = `Se ha reenviado su ${tipoComprobante.toLowerCase()} electrónica.`;
  }

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #0066cc;
      margin: 0;
      font-size: 24px;
    }
    .content {
      margin-bottom: 30px;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #0066cc;
      padding: 15px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: bold;
      color: #666;
    }
    .info-value {
      color: #333;
    }
    .total-box {
      background-color: #0066cc;
      color: white;
      padding: 20px;
      border-radius: 4px;
      text-align: center;
      margin: 20px 0;
    }
    .total-box .label {
      font-size: 14px;
      opacity: 0.9;
    }
    .total-box .amount {
      font-size: 28px;
      font-weight: bold;
      margin-top: 5px;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
    .button {
      display: inline-block;
      background-color: #0066cc;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${titulo}</h1>
    </div>
    
    <div class="content">
      <p>Estimado/a <strong>${nombreCliente}</strong>,</p>
      
      <p>${mensaje}</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Tipo de Comprobante:</span>
          <span class="info-value">${tipoComprobante}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Número:</span>
          <span class="info-value">${numeroCompleto}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Fecha de Emisión:</span>
          <span class="info-value">${fechaEmision}</span>
        </div>
        ${comprobante.envio?.guia ? `
        <div class="info-row">
          <span class="info-label">Guía de Envío:</span>
          <span class="info-value">${comprobante.envio.guia}</span>
        </div>
        ` : ""}
      </div>
      
      <div class="total-box">
        <div class="label">Total a Pagar</div>
        <div class="amount">S/ ${total}</div>
      </div>
      
      ${comprobante.pdfUrl ? `
      <p style="text-align: center;">
        <a href="${comprobante.pdfUrl}" class="button" target="_blank">
          Descargar Comprobante PDF
        </a>
      </p>
      ` : ""}
      
      <p style="color: #666; font-size: 14px;">
        Este es un email automático. Por favor, no responda a este mensaje.
      </p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Coal Cargo. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generar HTML del email para pago registrado
 */
function generarHTMLEmailPago(pago, envio) {
  const nombreCliente = envio?.cliente?.esEmpresa
    ? envio.cliente.razonSocial
    : `${envio?.cliente?.nombre || ""} ${envio?.cliente?.apellidos || ""}`.trim() || "Cliente";
  
  const monto = pago.monto?.toFixed(2) || "0.00";
  const metodo = pago.metodo || "No especificado";
  const fecha = new Date(pago.fecha).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const guia = envio?.guia || "N/A";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Pago</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #28a745;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #28a745;
      margin: 0;
      font-size: 24px;
    }
    .content {
      margin-bottom: 30px;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #28a745;
      padding: 15px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: bold;
      color: #666;
    }
    .info-value {
      color: #333;
    }
    .total-box {
      background-color: #28a745;
      color: white;
      padding: 20px;
      border-radius: 4px;
      text-align: center;
      margin: 20px 0;
    }
    .total-box .label {
      font-size: 14px;
      opacity: 0.9;
    }
    .total-box .amount {
      font-size: 28px;
      font-weight: bold;
      margin-top: 5px;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Confirmación de Pago</h1>
    </div>
    
    <div class="content">
      <p>Estimado/a <strong>${nombreCliente}</strong>,</p>
      
      <p>Le confirmamos que hemos registrado su pago exitosamente.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Guía de Envío:</span>
          <span class="info-value">${guia}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Método de Pago:</span>
          <span class="info-value">${metodo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Fecha de Pago:</span>
          <span class="info-value">${fecha}</span>
        </div>
        ${pago.referencia ? `
        <div class="info-row">
          <span class="info-label">Referencia:</span>
          <span class="info-value">${pago.referencia}</span>
        </div>
        ` : ""}
      </div>
      
      <div class="total-box">
        <div class="label">Monto Pagado</div>
        <div class="amount">S/ ${monto}</div>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        Este es un email automático. Por favor, no responda a este mensaje.
      </p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Coal Cargo. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Enviar email cuando un comprobante se emite exitosamente
 */
export async function enviarEmailComprobanteEmitido(comprobanteId) {
  try {
    // Obtener comprobante con relaciones
    const comprobante = await prisma.comprobantes_electronicos.findUnique({
      where: { id: comprobanteId },
      include: {
        cliente: true,
        envio: {
          select: {
            id: true,
            guia: true,
          },
        },
      },
    });

    if (!comprobante) {
      console.error("Comprobante no encontrado para envío de email:", comprobanteId);
      return { success: false, error: "Comprobante no encontrado" };
    }

    // Obtener email del cliente
    const emailCliente = comprobante.cliente?.email || comprobante.emailCliente;
    
    if (!emailCliente) {
      console.warn("No se encontró email del cliente para comprobante:", comprobanteId);
      return { success: false, error: "Email del cliente no encontrado" };
    }

    // Generar HTML del email
    const html = generarHTMLEmailComprobante(comprobante, "emision");
    const tipoComprobante = comprobante.tipoComprobante === "FACTURA" ? "Factura" : "Boleta";
    const asunto = `${tipoComprobante} Electrónica ${comprobante.numeroCompleto} - Coal Cargo`;

    // Enviar email
    const resultado = await enviarEmail({
      destinatario: emailCliente,
      asunto,
      mensaje: `Su ${tipoComprobante.toLowerCase()} electrónica ${comprobante.numeroCompleto} ha sido emitida exitosamente.`,
      html,
    });

    if (resultado.success) {
      console.log(`✅ Email de comprobante enviado a ${emailCliente}`);
    } else {
      console.error("Error al enviar email de comprobante:", resultado.error);
    }

    return resultado;
  } catch (error) {
    console.error("Error en enviarEmailComprobanteEmitido:", error);
    return {
      success: false,
      error: error.message || "Error al enviar email de comprobante",
    };
  }
}

/**
 * Enviar email cuando se reenvía un comprobante
 */
export async function enviarEmailComprobanteReenviado(comprobanteId) {
  try {
    // Obtener comprobante con relaciones
    const comprobante = await prisma.comprobantes_electronicos.findUnique({
      where: { id: comprobanteId },
      include: {
        cliente: true,
        envio: {
          select: {
            id: true,
            guia: true,
          },
        },
      },
    });

    if (!comprobante) {
      return { success: false, error: "Comprobante no encontrado" };
    }

    const emailCliente = comprobante.cliente?.email || comprobante.emailCliente;
    
    if (!emailCliente) {
      return { success: false, error: "Email del cliente no encontrado" };
    }

    const html = generarHTMLEmailComprobante(comprobante, "reenvio");
    const tipoComprobante = comprobante.tipoComprobante === "FACTURA" ? "Factura" : "Boleta";
    const asunto = `Reenvío de ${tipoComprobante} Electrónica ${comprobante.numeroCompleto} - Coal Cargo`;

    const resultado = await enviarEmail({
      destinatario: emailCliente,
      asunto,
      mensaje: `Se ha reenviado su ${tipoComprobante.toLowerCase()} electrónica ${comprobante.numeroCompleto}.`,
      html,
    });

    return resultado;
  } catch (error) {
    console.error("Error en enviarEmailComprobanteReenviado:", error);
    return {
      success: false,
      error: error.message || "Error al enviar email de reenvío",
    };
  }
}

/**
 * Enviar email cuando se registra un pago
 */
export async function enviarEmailPagoRegistrado(pagoId) {
  try {
    // Obtener pago con relaciones
    const pago = await prisma.pagos.findUnique({
      where: { id: pagoId },
      include: {
        envios: {
          include: {
            cliente: true,
          },
        },
      },
    });

    if (!pago || !pago.envios) {
      return { success: false, error: "Pago o envío no encontrado" };
    }

    const envio = pago.envios;
    const emailCliente = envio.cliente?.email;
    
    if (!emailCliente) {
      console.warn("No se encontró email del cliente para pago:", pagoId);
      return { success: false, error: "Email del cliente no encontrado" };
    }

    const html = generarHTMLEmailPago(pago, envio);
    const asunto = `Confirmación de Pago - Guía ${envio.guia} - Coal Cargo`;

    const resultado = await enviarEmail({
      destinatario: emailCliente,
      asunto,
      mensaje: `Su pago de S/ ${pago.monto?.toFixed(2) || "0.00"} ha sido registrado exitosamente para la guía ${envio.guia}.`,
      html,
    });

    if (resultado.success) {
      console.log(`✅ Email de pago enviado a ${emailCliente}`);
    }

    return resultado;
  } catch (error) {
    console.error("Error en enviarEmailPagoRegistrado:", error);
    return {
      success: false,
      error: error.message || "Error al enviar email de pago",
    };
  }
}

