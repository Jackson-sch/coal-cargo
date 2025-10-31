"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { validarDocumentoPeruano } from "../utils/documentos.js"; // Función auxiliar para verificar permiso s
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

// Función auxiliar para manejar errore s
function handleActionError(error) {
  if (error instanceof Error) {
    return { success: false, error: error.message };
  }

  return { success: false, error: "Error interno del servidor" };
}

// Función auxiliar para convertir valores según tip o
function convertirValor(valor, tipo) {
  switch (tipo) {
    case "boolean":
      return valor === "true" || valor === true;
    case "number":
      return parseFloat(valor) || 0;
    case "string":
    default:
      return String(valor);
  }
} // Función auxiliar para preparar valor para B D
function prepararValorParaBD(valor, tipo) {
  switch (tipo) {
    case "boolean":
      return String(valor);
    case "number":
      return String(valor);
    case "string":
    default:
      return String(valor);
  }
}
/** * Obtener configuración general de la empresa */ export async function obtenerConfiguracionGeneral() {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]); // Obtener configuración clave-valo r
    const configuracionKV = await prisma.configuracion.findMany({
      where: {
        clave: {
          in: [
            "empresa_nombre",
            "empresa_ruc",
            "empresa_direccion",
            "empresa_telefono",
            "empresa_email",
            "empresa_sitio_web",
            "logo_empresa",
            "horas_operacion_inicio",
            "horas_operacion_fin",
            "dias_operacion_lunes",
            "dias_operacion_martes",
            "dias_operacion_miercoles",
            "dias_operacion_jueves",
            "dias_operacion_viernes",
            "dias_operacion_sabado",
            "dias_operacion_domingo",
            "tiempo_entrega_estandar",
            "tiempo_entrega_express",
            "peso_maximo_kg",
            "dimension_maxima_cm",
            "notificaciones_email",
            "notificaciones_sms",
            "notificaciones_whatsapp",
            "igv_porcentaje",
            "moneda_principal",
            "formato_factura",
            "mantenimiento_activo",
            "mensaje_mantenimiento",
            "version_sistema",
          ],
        },
      },
    }); // Obtener configuración de facturació n
    const configuracionFacturacion =
      await prisma.configuracion_facturacion.findFirst({
        where: { activo: true },
      }); // Convertir configuración clave-valor a objet o
    const configObj = {};
    configuracionKV.forEach((config) => {
      configObj[config.clave] = convertirValor(config.valor, config.tipo);
    }); // Estructura de respuesta con valores por defect o
    const configuracion = {
      // Información de la empres a
      nombreEmpresa: configObj.empresa_nombre || "Mi Empresa",
      ruc: configObj.empresa_ruc || configuracionFacturacion?.ruc || "",
      direccion:
        configObj.empresa_direccion ||
        configuracionFacturacion?.direccion ||
        "",
      telefono: configObj.empresa_telefono || "",
      email: configObj.empresa_email || "",
      sitioWeb: configObj.empresa_sitio_web || "", // Configuraciones operativa s
      horasOperacion: {
        inicio: configObj.horas_operacion_inicio || "08:00",
        fin: configObj.horas_operacion_fin || "18:00",
      },
      diasOperacion: {
        lunes:
          configObj.dias_operacion_lunes !== undefined
            ? configObj.dias_operacion_lunes
            : true,
        martes:
          configObj.dias_operacion_martes !== undefined
            ? configObj.dias_operacion_martes
            : true,
        miercoles:
          configObj.dias_operacion_miercoles !== undefined
            ? configObj.dias_operacion_miercoles
            : true,
        jueves:
          configObj.dias_operacion_jueves !== undefined
            ? configObj.dias_operacion_jueves
            : true,
        viernes:
          configObj.dias_operacion_viernes !== undefined
            ? configObj.dias_operacion_viernes
            : true,
        sabado:
          configObj.dias_operacion_sabado !== undefined
            ? configObj.dias_operacion_sabado
            : true,
        domingo:
          configObj.dias_operacion_domingo !== undefined
            ? configObj.dias_operacion_domingo
            : false,
      }, // Configuraciones de enví o
      tiempoEntregaEstandar: configObj.tiempo_entrega_estandar || 24,
      tiempoEntregaExpress: configObj.tiempo_entrega_express || 12,
      pesoMaximoKg: configObj.peso_maximo_kg || 50,
      dimensionMaximaCm: configObj.dimension_maxima_cm || 100, // Configuraciones de notificacione s
      notificacionesEmail:
        configObj.notificaciones_email !== undefined
          ? configObj.notificaciones_email
          : true,
      notificacionesSMS:
        configObj.notificaciones_sms !== undefined
          ? configObj.notificaciones_sms
          : false,
      notificacionesWhatsApp:
        configObj.notificaciones_whatsapp !== undefined
          ? configObj.notificaciones_whatsapp
          : true, // Configuraciones de facturació n
      igv:
        configObj.igv_porcentaje ||
        configuracionFacturacion?.porcentajeIgv ||
        18,
      monedaPrincipal: configObj.moneda_principal || "PEN",
      formatoFactura: configObj.formato_factura || "F001-{numero}", // Configuraciones del sistem a
      mantenimientoActivo:
        configObj.mantenimiento_activo !== undefined
          ? configObj.mantenimiento_activo
          : false,
      mensajeMantenimiento:
        configObj.mensaje_mantenimiento ||
        "Sistema en mantenimiento. Disculpe las molestias.",
      versionSistema: configObj.version_sistema || "1.0.0", // Logo de la empresa
      logoEmpresa: configObj.logo_empresa || null,
    };
    return { success: true, data: configuracion };
  } catch (error) {
    return handleActionError(error);
  }
}
/** * Guardar configuración general de la empresa */ export async function guardarConfiguracionGeneral(
  configuracion
) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]); // Validaciones básica s
    if (!configuracion.nombreEmpresa?.trim()) {
      throw new Error("El nombre de la empresa es requerido");
    }

    if (
      configuracion.ruc &&
      !validarDocumentoPeruano("RUC", configuracion.ruc)
    ) {
      throw new Error("El RUC inválido (debe ser un RUC válido de 11 dígitos)");
    }

    if (
      configuracion.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuracion.email)
    ) {
      throw new Error("El email no tiene un formato válido");
    }

    // Preparar configuraciones para guarda r
    const configuracionesAGuardar = [
      {
        clave: "empresa_nombre",
        valor: configuracion.nombreEmpresa,
        tipo: "string",
      },
      { clave: "empresa_ruc", valor: configuracion.ruc || "", tipo: "string" },
      {
        clave: "empresa_direccion",
        valor: configuracion.direccion || "",
        tipo: "string",
      },
      {
        clave: "empresa_telefono",
        valor: configuracion.telefono || "",
        tipo: "string",
      },
      {
        clave: "empresa_email",
        valor: configuracion.email || "",
        tipo: "string",
      },
      {
        clave: "empresa_sitio_web",
        valor: configuracion.sitioWeb || "",
        tipo: "string",
      },
      {
        clave: "logo_empresa",
        valor: configuracion.logoEmpresa || "",
        tipo: "string",
      }, // Horarios
      {
        clave: "horas_operacion_inicio",
        valor: configuracion.horasOperacion?.inicio || "08:00",
        tipo: "string",
      },
      {
        clave: "horas_operacion_fin",
        valor: configuracion.horasOperacion?.fin || "18:00",
        tipo: "string",
      }, // Días de operació n
      {
        clave: "dias_operacion_lunes",
        valor: configuracion.diasOperacion?.lunes,
        tipo: "boolean",
      },
      {
        clave: "dias_operacion_martes",
        valor: configuracion.diasOperacion?.martes,
        tipo: "boolean",
      },
      {
        clave: "dias_operacion_miercoles",
        valor: configuracion.diasOperacion?.miercoles,
        tipo: "boolean",
      },
      {
        clave: "dias_operacion_jueves",
        valor: configuracion.diasOperacion?.jueves,
        tipo: "boolean",
      },
      {
        clave: "dias_operacion_viernes",
        valor: configuracion.diasOperacion?.viernes,
        tipo: "boolean",
      },
      {
        clave: "dias_operacion_sabado",
        valor: configuracion.diasOperacion?.sabado,
        tipo: "boolean",
      },
      {
        clave: "dias_operacion_domingo",
        valor: configuracion.diasOperacion?.domingo,
        tipo: "boolean",
      }, // Configuraciones de enví o
      {
        clave: "tiempo_entrega_estandar",
        valor: configuracion.tiempoEntregaEstandar || 24,
        tipo: "number",
      },
      {
        clave: "tiempo_entrega_express",
        valor: configuracion.tiempoEntregaExpress || 12,
        tipo: "number",
      },
      {
        clave: "peso_maximo_kg",
        valor: configuracion.pesoMaximoKg || 50,
        tipo: "number",
      },
      {
        clave: "dimension_maxima_cm",
        valor: configuracion.dimensionMaximaCm || 100,
        tipo: "number",
      }, // Notificacione s
      {
        clave: "notificaciones_email",
        valor: configuracion.notificacionesEmail,
        tipo: "boolean",
      },
      {
        clave: "notificaciones_sms",
        valor: configuracion.notificacionesSMS,
        tipo: "boolean",
      },
      {
        clave: "notificaciones_whatsapp",
        valor: configuracion.notificacionesWhatsApp,
        tipo: "boolean",
      }, // Facturació n
      {
        clave: "igv_porcentaje",
        valor: configuracion.igv || 18,
        tipo: "number",
      },
      {
        clave: "moneda_principal",
        valor: configuracion.monedaPrincipal || "PEN",
        tipo: "string",
      },
      {
        clave: "formato_factura",
        valor: configuracion.formatoFactura || "F001-{numero}",
        tipo: "string",
      }, // Sistem a
      {
        clave: "mantenimiento_activo",
        valor: configuracion.mantenimientoActivo,
        tipo: "boolean",
      },
      {
        clave: "mensaje_mantenimiento",
        valor: configuracion.mensajeMantenimiento || "",
        tipo: "string",
      },
      {
        clave: "version_sistema",
        valor: configuracion.versionSistema || "1.0.0",
        tipo: "string",
      },
    ]; // Usar transacción para guardar tod o
    await prisma.$transaction(async (tx) => {
      // Guardar configuraciones clave-valo r
      for (const config of configuracionesAGuardar) {
        await tx.configuracion.upsert({
          where: { clave: config.clave },
          update: {
            valor: prepararValorParaBD(config.valor, config.tipo),
            tipo: config.tipo,
            descripcion: getDescripcionConfig(config.clave),
          },
          create: {
            clave: config.clave,
            valor: prepararValorParaBD(config.valor, config.tipo),
            tipo: config.tipo,
            descripcion: getDescripcionConfig(config.clave),
          },
        });
      }

      // Actualizar configuración de facturación si hay datos relevante s
      if (configuracion.ruc || configuracion.direccion) {
        const configFacturacion = await tx.configuracion_facturacion.findFirst({
          where: { activo: true },
        });
        if (configFacturacion) {
          await tx.configuracion_facturacion.update({
            where: { id: configFacturacion.id },
            data: {
              ...(configuracion.ruc && { ruc: configuracion.ruc }),
              ...(configuracion.direccion && {
                direccion: configuracion.direccion,
              }),
              ...(configuracion.nombreEmpresa && {
                razonSocial: configuracion.nombreEmpresa,
              }),
              ...(configuracion.igv && { porcentajeIgv: configuracion.igv }),
            },
          });
        }
      }
    }); // Revalidar páginas relacionada s
    revalidatePath("/dashboard/configuracion/general");
    revalidatePath("/dashboard/configuracion");
    return { success: true, message: "Configuración guardada correctamente" };
  } catch (error) {
    return handleActionError(error);
  }
} // Función auxiliar para obtener descripciones de configuració n
function getDescripcionConfig(clave) {
  const descripciones = {
    empresa_nombre: "Nombre de la empresa",
    empresa_ruc: "RUC de la empresa",
    empresa_direccion: "Dirección fiscal de la empresa",
    empresa_telefono: "Teléfono principal",
    empresa_email: "Email de contacto",
    empresa_sitio_web: "Sitio web de la empresa",
    logo_empresa: "Logo de la empresa",
    horas_operacion_inicio: "Hora de inicio de operaciones",
    horas_operacion_fin: "Hora de fin de operaciones",
    dias_operacion_lunes: "Operación los lunes",
    dias_operacion_martes: "Operación los martes",
    dias_operacion_miercoles: "Operación los miércoles",
    dias_operacion_jueves: "Operación los jueves",
    dias_operacion_viernes: "Operación los viernes",
    dias_operacion_sabado: "Operación los sábados",
    dias_operacion_domingo: "Operación los domingos",
    tiempo_entrega_estandar: "Tiempo de entrega estándar en horas",
    tiempo_entrega_express: "Tiempo de entrega express en horas",
    peso_maximo_kg: "Peso máximo por envío en kg",
    dimension_maxima_cm: "Dimensión máxima por envío en cm",
    notificaciones_email: "Activar notificaciones por email",
    notificaciones_sms: "Activar notificaciones por SMS",
    notificaciones_whatsapp: "Activar notificaciones por WhatsApp",
    igv_porcentaje: "Porcentaje de IGV",
    moneda_principal: "Moneda principal del sistema",
    formato_factura: "Formato de numeración de facturas",
    mantenimiento_activo: "Modo mantenimiento activo",
    mensaje_mantenimiento: "Mensaje de mantenimiento",
    version_sistema: "Versión del sistema",
  };
  return descripciones[clave] || "Configuración del sistema";
}
