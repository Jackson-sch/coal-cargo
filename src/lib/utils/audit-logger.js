import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Sistema de logging automático para auditoría
 */
export class AuditLogger {
  static async log({
    accion,
    recurso,
    detalles = null,
    categoria = "SISTEMA",
    severidad = "INFO",
    usuarioId = null,
    ip = null,
    userAgent = null,
  }) {
    try {
      // Si no se proporciona usuarioId, intentar obtenerlo de la sesión
      if (!usuarioId) {
        try {
          const session = await auth();
          usuarioId = session?.user?.id || null;
        } catch (error) {
          // Ignorar errores de sesión en logs del sistema
        }
      }

      // Crear el log
      const log = await prisma.logs_auditoria.create({
        data: {
          accion,
          recurso,
          detalles:
            typeof detalles === "object" ? JSON.stringify(detalles) : detalles,
          categoria,
          severidad,
          usuarioId,
          ip,
          userAgent,
          fechaHora: new Date(),
        },
      });

      return log;
    } catch (error) {
      // No fallar si no se puede crear el log
      return null;
    }
  }

  // Métodos específicos para diferentes tipos de eventos
  static async logLogin(
    email,
    success,
    ip = null,
    userAgent = null,
    detalles = {}
  ) {
    return this.log({
      accion: success ? "LOGIN_SUCCESS" : "LOGIN_FAILED",
      recurso: "auth",
      detalles: { email, ...detalles },
      categoria: "SEGURIDAD",
      severidad: success ? "INFO" : "WARNING",
      ip,
      userAgent,
    });
  }

  static async logLogout(usuarioId, ip = null) {
    return this.log({
      accion: "LOGOUT",
      recurso: "auth",
      detalles: { usuarioId },
      categoria: "SEGURIDAD",
      severidad: "INFO",
      usuarioId,
      ip,
    });
  }

  static async logUserAction(accion, usuarioAfectadoId, detalles = {}) {
    return this.log({
      accion,
      recurso: "usuarios",
      detalles: { usuarioAfectadoId, ...detalles },
      categoria: "USUARIOS",
      severidad: "INFO",
    });
  }

  static async logEnvioAction(accion, guia, detalles = {}) {
    return this.log({
      accion,
      recurso: "envios",
      detalles: { guia, ...detalles },
      categoria: "ENVIOS",
      severidad: "INFO",
    });
  }

  static async logClienteAction(accion, clienteId, detalles = {}) {
    return this.log({
      accion,
      recurso: "clientes",
      detalles: { clienteId, ...detalles },
      categoria: "CLIENTES",
      severidad: "INFO",
    });
  }

  static async logConfigAction(accion, seccion, detalles = {}) {
    return this.log({
      accion,
      recurso: "configuracion",
      detalles: { seccion, ...detalles },
      categoria: "CONFIGURACION",
      severidad: "INFO",
    });
  }

  static async logFacturacionAction(accion, numeroComprobante, detalles = {}) {
    return this.log({
      accion,
      recurso: "facturacion",
      detalles: { numeroComprobante, ...detalles },
      categoria: "FACTURACION",
      severidad: "INFO",
    });
  }

  static async logSystemAction(accion, detalles = {}) {
    return this.log({
      accion,
      recurso: "sistema",
      detalles,
      categoria: "SISTEMA",
      severidad: "INFO",
      usuarioId: null, // Acciones del sistema
    });
  }

  static async logError(error, contexto = {}) {
    return this.log({
      accion: "SYSTEM_ERROR",
      recurso: "sistema",
      detalles: {
        error: error.message,
        stack: error.stack?.substring(0, 500), // Limitar stack trace
        ...contexto,
      },
      categoria: "SISTEMA",
      severidad: "ERROR",
      usuarioId: null,
    });
  }

  static async logSecurityEvent(accion, detalles = {}, severidad = "WARNING") {
    return this.log({
      accion,
      recurso: "seguridad",
      detalles,
      categoria: "SEGURIDAD",
      severidad,
    });
  }

  static async logBackup(accion, detalles = {}) {
    return this.log({
      accion,
      recurso: "backup",
      detalles,
      categoria: "BACKUP",
      severidad: "INFO",
      usuarioId: null,
    });
  }

  static async logAuditoria(accion, detalles = {}) {
    return this.log({
      accion,
      recurso: "auditoria",
      detalles,
      categoria: "AUDITORIA",
      severidad: "INFO",
    });
  }
}

// Función helper para obtener IP del request
export function getClientIP(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const remoteAddr = request.headers.get("x-remote-addr");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return realIP || remoteAddr || "unknown";
}

// Función helper para obtener User Agent
export function getUserAgent(request) {
  return request.headers.get("user-agent") || "unknown";
}
