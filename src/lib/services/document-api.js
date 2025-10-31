/**
 * Servicios para consultar APIs de documentos peruanos
 * DNI y RUC usando endpoint interno para evitar CORS
 */

/**
 * Consulta datos de DNI usando endpoint interno
 * @param {string} dni - Número de DNI (8 dígitos)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function consultarDNI(dni) {
  return await consultarDocumento("DNI", dni);
}

/**
 * Consulta datos de RUC usando endpoint interno
 * @param {string} ruc - Número de RUC (11 dígitos)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function consultarRUC(ruc) {
  return await consultarDocumento("RUC", ruc);
}

/**
 * Función genérica para consultar documento usando endpoint interno
 * @param {string} tipoDocumento - Tipo de documento (DNI, RUC, etc.)
 * @param {string} numeroDocumento - Número del documento
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function consultarDocumento(tipoDocumento, numeroDocumento) {
  try {
    // Validaciones básicas
    if (!tipoDocumento || !numeroDocumento) {
      return {
        success: false,
        error: "Tipo de documento y número son requeridos",
      };
    }

    if (!puedeConsultarDocumento(tipoDocumento)) {
      return {
        success: false,
        error: `Consulta automática no disponible para ${tipoDocumento}`,
      };
    }

    // Llamar a nuestro endpoint interno
    const response = await fetch("/api/consultar-documento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipoDocumento, numeroDocumento }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const result = await response.json();

    if (result.success) {
      console.log(`✅ Documento ${tipoDocumento} consultado exitosamente`);
    } else {
      console.warn(`⚠️ Error al consultar ${tipoDocumento}:`, result.error);
    }

    return result;
  } catch (error) {
    console.error(`❌ Error en consulta de ${tipoDocumento}:`, error.message);
    return {
      success: false,
      error: `Error de conexión al consultar ${tipoDocumento}. Intenta nuevamente.`,
    };
  }
}
/**
 * Validar si un documento puede ser consultado automáticamente
 * @param {string} tipoDocumento - Tipo de documento
 * @returns {boolean}
 */
export function puedeConsultarDocumento(tipoDocumento) {
  return ["DNI", "RUC"].includes(tipoDocumento);
}
