/**
 * Sistema centralizado de manejo de errores
 */

/**
 * Tipos de errores comunes en la aplicación
 */
export const ErrorTypes = {
  NETWORK: "NETWORK",
  VALIDATION: "VALIDATION",
  AUTHENTICATION: "AUTHENTICATION",
  AUTHORIZATION: "AUTHORIZATION",
  NOT_FOUND: "NOT_FOUND",
  SERVER: "SERVER",
  UNKNOWN: "UNKNOWN",
};

/**
 * Clasifica un error según su tipo
 */
export function classifyError(error) {
  if (!error) return ErrorTypes.UNKNOWN;

  const message = error?.message?.toLowerCase() || "";
  const code = error?.code || error?.status || "";

  // Errores de red
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection") ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT"
  ) {
    return ErrorTypes.NETWORK;
  }

  // Errores de validación
  if (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("requerido") ||
    message.includes("required") ||
    error.name === "ZodError"
  ) {
    return ErrorTypes.VALIDATION;
  }

  // Errores de autenticación
  if (
    message.includes("unauthorized") ||
    message.includes("not authenticated") ||
    message.includes("sesión") ||
    code === 401
  ) {
    return ErrorTypes.AUTHENTICATION;
  }

  // Errores de autorización
  if (
    message.includes("forbidden") ||
    message.includes("permission") ||
    message.includes("permisos") ||
    code === 403
  ) {
    return ErrorTypes.AUTHORIZATION;
  }

  // Errores de no encontrado
  if (
    message.includes("not found") ||
    message.includes("no encontrado") ||
    code === 404
  ) {
    return ErrorTypes.NOT_FOUND;
  }

  // Errores del servidor
  if (code >= 500 || message.includes("server error")) {
    return ErrorTypes.SERVER;
  }

  return ErrorTypes.UNKNOWN;
}

/**
 * Obtiene un mensaje de error amigable para el usuario
 */
export function getErrorMessage(error, defaultMessage = "Ocurrió un error inesperado") {
  if (!error) return defaultMessage;

  const type = classifyError(error);
  const message = error?.message || "";

  // Si el mensaje es amigable, usarlo directamente
  if (message && !message.includes("Error:") && message.length < 200) {
    return message;
  }

  // Mensajes por tipo de error
  const errorMessages = {
    [ErrorTypes.NETWORK]:
      "Error de conexión. Verifica tu conexión a internet e intenta nuevamente.",
    [ErrorTypes.VALIDATION]:
      "Los datos ingresados no son válidos. Por favor, revisa los campos y vuelve a intentar.",
    [ErrorTypes.AUTHENTICATION]:
      "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
    [ErrorTypes.AUTHORIZATION]:
      "No tienes permisos para realizar esta acción.",
    [ErrorTypes.NOT_FOUND]: "El recurso solicitado no fue encontrado.",
    [ErrorTypes.SERVER]:
      "Error del servidor. Por favor, intenta nuevamente más tarde.",
    [ErrorTypes.UNKNOWN]: defaultMessage,
  };

  return errorMessages[type] || defaultMessage;
}

/**
 * Logs de errores (puede ser extendido para enviar a un servicio externo)
 */
export function logError(error, context = {}) {
  // Asegurarse de que tenemos un error válido
  if (!error) {
    console.warn("logError called without error object:", context);
    return null;
  }

  const errorInfo = {
    message: error?.message || String(error) || "Error desconocido",
    stack: error?.stack,
    type: classifyError(error),
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
  };

  // En desarrollo, log a consola
  if (process.env.NODE_ENV === "development") {
    console.error("Error logged:", errorInfo);
  }

  // En producción, aquí podrías enviar a un servicio como Sentry, LogRocket, etc.
  // Ejemplo:
  // if (process.env.NODE_ENV === "production") {
  //   Sentry.captureException(error, { extra: context });
  // }

  return errorInfo;
}

/**
 * Maneja errores de Server Actions de forma consistente
 */
export function handleServerActionError(error) {
  const classified = classifyError(error);
  const message = getErrorMessage(error);

  // Log del error
  logError(error, { source: "server-action" });

  return {
    success: false,
    error: message,
    type: classified,
    originalError: process.env.NODE_ENV === "development" ? error : undefined,
  };
}

/**
 * Maneja errores de fetch/API de forma consistente
 */
export async function handleApiError(response) {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `Error ${response.status}: ${response.statusText}` };
    }

    const error = new Error(errorData.message || "Error en la solicitud");
    error.status = response.status;
    error.code = response.status;
    error.data = errorData;

    logError(error, { source: "api", status: response.status });
    return handleServerActionError(error);
  }

  return null;
}

/**
 * Wrapper para funciones async que maneja errores automáticamente
 */
export function withErrorHandling(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context);
      throw error;
    }
  };
}

