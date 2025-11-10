"use server";

import { prisma } from "@/lib/prisma";
import { obtenerConfiguracionNotificaciones } from "@/lib/actions/notificaciones";

/**
 * Crear notificaciones automáticas basadas en la configuración
 */
export async function crearNotificacionAutomatica({
  envioId,
  tipo,
  estado,
  descripcion,
}) {
  try {
    // Obtener el envío con información del cliente
    const envio = await prisma.envios.findUnique({
      where: { id: envioId },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            razonSocial: true,
            email: true,
            telefono: true,
            esEmpresa: true,
          },
        },
      },
    });

    if (!envio) {
      console.error("Envío no encontrado para crear notificación:", envioId);
      return;
    }

    // Obtener configuración de notificaciones
    const configResult = await obtenerConfiguracionNotificaciones();
    if (!configResult.success) {
      console.error("Error al obtener configuración de notificaciones");
      return;
    }

    const config = configResult.data;

    // Verificar si las notificaciones automáticas están habilitadas para este tipo
    let tipoHabilitado = false;
    switch (tipo) {
      case "REGISTRO_ENVIO":
        tipoHabilitado = config.autoRegistro;
        break;
      case "CAMBIO_ESTADO":
        tipoHabilitado = config.autoCambioEstado;
        break;
      case "ENTREGA_EXITOSA":
        tipoHabilitado = config.autoEntrega;
        break;
      case "INTENTO_ENTREGA":
        tipoHabilitado = config.autoIntento;
        break;
      case "RETRASO":
        tipoHabilitado = config.autoRetraso;
        break;
      case "PROBLEMA":
        tipoHabilitado = config.autoProblema;
        break;
      case "RECORDATORIO":
        tipoHabilitado = config.autoRecordatorio;
        break;
      default:
        tipoHabilitado = false;
    }

    if (!tipoHabilitado) {
      return; // No crear notificación si el tipo no está habilitado
    }

    // Obtener destinatarios
    const cliente = envio.cliente;
    const emailDestinatario = cliente?.email || envio.destinatarioEmail;
    const telefonoDestinatario = cliente?.telefono || envio.destinatarioTelefono;

    // Generar mensaje
    const nombreCliente = cliente?.esEmpresa
      ? cliente.razonSocial
      : `${cliente?.nombre || ""} ${cliente?.apellidos || ""}`.trim();

    const mensajeBase = generarMensaje(tipo, envio, estado, descripcion);

    // Crear notificaciones para cada canal habilitado
    const notificacionesACrear = [];

    // Email
    if (config.email && emailDestinatario) {
      notificacionesACrear.push({
        envioId,
        tipo,
        canal: "EMAIL",
        destinatario: emailDestinatario,
        asunto: generarAsunto(tipo, envio),
        mensaje: procesarPlantilla(config.plantillaEmail || mensajeBase, envio, cliente),
        estado: "PENDIENTE",
        maxIntentos: config.maxIntentos || 3,
      });
    }

    // SMS
    if (config.sms && telefonoDestinatario) {
      notificacionesACrear.push({
        envioId,
        tipo,
        canal: "SMS",
        destinatario: telefonoDestinatario,
        mensaje: procesarPlantilla(config.plantillaSMS || mensajeBase, envio, cliente),
        estado: "PENDIENTE",
        maxIntentos: config.maxIntentos || 3,
      });
    }

    // WhatsApp
    if (config.whatsapp && telefonoDestinatario) {
      notificacionesACrear.push({
        envioId,
        tipo,
        canal: "WHATSAPP",
        destinatario: telefonoDestinatario,
        mensaje: procesarPlantilla(
          config.plantillaWhatsApp || mensajeBase,
          envio,
          cliente
        ),
        estado: "PENDIENTE",
        maxIntentos: config.maxIntentos || 3,
      });
    }

    // Crear todas las notificaciones
    if (notificacionesACrear.length > 0) {
      await prisma.notificaciones.createMany({
        data: notificacionesACrear,
      });
    }
  } catch (error) {
    console.error("Error al crear notificación automática:", error);
  }
}

/**
 * Generar mensaje base según el tipo de notificación
 */
function generarMensaje(tipo, envio, estado, descripcion) {
  const guia = envio.guia || "";
  const estadoTexto = estado || envio.estado || "";

  switch (tipo) {
    case "REGISTRO_ENVIO":
      return `Su envío con guía ${guia} ha sido registrado. Estaremos en contacto pronto.`;

    case "CAMBIO_ESTADO":
      return `El estado de su envío ${guia} ha cambiado a: ${estadoTexto}. ${descripcion || ""}`;

    case "ENTREGA_EXITOSA":
      return `¡Su envío ${guia} ha sido entregado exitosamente! Gracias por confiar en nosotros.`;

    case "INTENTO_ENTREGA":
      return `Se realizó un intento de entrega de su envío ${guia}. ${descripcion || ""}`;

    case "RETRASO":
      return `Su envío ${guia} presenta un retraso. ${descripcion || "Estamos trabajando para resolverlo."}`;

    case "PROBLEMA":
      return `Su envío ${guia} presenta un problema. ${descripcion || "Nos pondremos en contacto."}`;

    case "RECORDATORIO":
      return `Recordatorio: Su envío ${guia} está en tránsito. ${descripcion || ""}`;

    case "CONFIRMACION_RECOLECCION":
      return `Su envío ${guia} ha sido recolectado exitosamente.`;

    default:
      return `Actualización sobre su envío ${guia}: ${descripcion || ""}`;
  }
}

/**
 * Generar asunto para emails
 */
function generarAsunto(tipo, envio) {
  const guia = envio.guia || "";

  switch (tipo) {
    case "REGISTRO_ENVIO":
      return `Envío ${guia} registrado`;
    case "CAMBIO_ESTADO":
      return `Actualización de envío ${guia}`;
    case "ENTREGA_EXITOSA":
      return `¡Envío ${guia} entregado!`;
    case "INTENTO_ENTREGA":
      return `Intento de entrega - Envío ${guia}`;
    case "RETRASO":
      return `Aviso de retraso - Envío ${guia}`;
    case "PROBLEMA":
      return `Aviso importante - Envío ${guia}`;
    case "RECORDATORIO":
      return `Recordatorio - Envío ${guia}`;
    default:
      return `Notificación sobre su envío ${guia}`;
  }
}

/**
 * Procesar plantilla reemplazando variables
 */
function procesarPlantilla(plantilla, envio, cliente) {
  if (!plantilla) return "";

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

  let mensajeProcesado = plantilla;
  Object.entries(variables).forEach(([key, value]) => {
    mensajeProcesado = mensajeProcesado.replace(new RegExp(key, "g"), value);
  });

  return mensajeProcesado;
}



