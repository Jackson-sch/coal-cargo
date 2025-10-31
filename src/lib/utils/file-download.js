import { toast } from "sonner";

/**
 * Utilidades para descarga de archivos
 * Implementa las mejores prácticas recomendadas en INTEGRACION_NEXTJS.md
 */

/**
 * Descargar archivo desde una URL
 * @param {string} url - URL del archivo
 * @param {string} filename - Nombre del archivo
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<boolean>} - True si la descarga fue exitosa
 */
export const downloadFromUrl = async (url, filename, options = {}) => {
  const {
    showToast = true,
    onProgress = null,
    onError = null,
    headers = {},
  } = options;
  try {
    if (showToast) {
      toast.info("Iniciando descarga...");
    }

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/pdf", ...headers },
    });
    if (!response.ok) {
      throw new Error(
        `Error HTTP: ${response.status} - ${response.statusText}`
      );
    }

    const blob = await response.blob();

    // Crear URL temporal para el blob
    const blobUrl = window.URL.createObjectURL(blob);

    // Crear elemento de descarga
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;

    // Agregar al DOM temporalmente y hacer click
    document.body.appendChild(link);
    link.click();

    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    if (showToast) {
      toast.success(`Archivo descargado: ${filename}`);
    }

    return true;
  } catch (error) {
    const errorMessage = error.message || "Error al descargar el archivo";
    if (onError) {
      onError(error);
    } else if (showToast) {
      toast.error(errorMessage);
    }

    return false;
  }
};

/**
 * Descargar archivo desde blob
 * @param {Blob} blob - Blob del archivo
 * @param {string} filename - Nombre del archivo
 * @param {Object} options - Opciones adicionales
 * @returns {boolean} - True si la descarga fue exitosa
 */
export const downloadFromBlob = (blob, filename, options = {}) => {
  const { showToast = true, onError = null } = options;
  try {
    // Validar blob
    if (!blob || !(blob instanceof Blob)) {
      throw new Error("Blob inválido");
    }

    if (showToast) {
      toast.info("Preparando descarga...");
    }

    // Crear URL temporal para el blob
    const blobUrl = window.URL.createObjectURL(blob);

    // Crear elemento de descarga
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;

    // Agregar al DOM temporalmente y hacer click
    document.body.appendChild(link);
    link.click();

    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    if (showToast) {
      toast.success(`Archivo descargado: ${filename}`);
    }

    return true;
  } catch (error) {
    const errorMessage = error.message || "Error al descargar el archivo";
    if (onError) {
      onError(error);
    } else if (showToast) {
      toast.error(errorMessage);
    }

    return false;
  }
};

/**
 * Descargar archivo desde base64
 * @param {string} base64Data - Datos en base64
 * @param {string} filename - Nombre del archivo
 * @param {string} mimeType - Tipo MIME del archivo
 * @param {Object} options - Opciones adicionales
 * @returns {boolean} - True si la descarga fue exitosa
 */
export const downloadFromBase64 = (
  base64Data,
  filename,
  mimeType = "application/pdf",
  options = {}
) => {
  const { showToast = true, onError = null } = options;
  try {
    if (showToast) {
      toast.info("Procesando archivo...");
    }

    // Limpiar el base64 si tiene prefijo
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");

    // Convertir base64 a bytes
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return downloadFromBlob(blob, filename, { showToast, onError });
  } catch (error) {
    const errorMessage = error.message || "Error al procesar el archivo";
    if (onError) {
      onError(error);
    } else if (showToast) {
      toast.error(errorMessage);
    }

    return false;
  }
};

/**
 * Descargar PDF de factura con manejo específico
 * @param {string|number} facturaId - ID de la factura
 * @param {string} numeroFactura - Número de la factura para el nombre del archivo
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<boolean>} - True si la descarga fue exitosa
 */
export const downloadFacturaPDF = async (
  facturaId,
  numeroFactura,
  options = {}
) => {
  const { showToast = true, onError = null, useNewApi = true } = options;
  try {
    if (showToast) {
      toast.info("Descargando factura...");
    }

    const endpoint = useNewApi
      ? `/api/facturas/${facturaId}/pdf`
      : `/api/facturas/${facturaId}/download`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      // Intentar obtener mensaje de error del servidor
      let errorMessage = `Error HTTP: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Si no se puede parsear como JSON, usar mensaje genérico
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const filename = `Factura_${numeroFactura}.pdf`;
    return downloadFromBlob(blob, filename, { showToast, onError });
  } catch (error) {
    const errorMessage = error.message || "Error al descargar la factura";
    if (onError) {
      onError(error);
    } else if (showToast) {
      toast.error(errorMessage);
    }

    return false;
  }
};

/**
 * Descargar XML de comprobante
 * @param {string|number} comprobanteId - ID del comprobante
 * @param {string} numeroComprobante - Número del comprobante
 * @param {string} tipoComprobante - Tipo de comprobante (factura, boleta, etc.)
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<boolean>} - True si la descarga fue exitosa
 */
export const downloadComprobanteXML = async (
  comprobanteId,
  numeroComprobante,
  tipoComprobante = "factura",
  options = {}
) => {
  const { showToast = true, onError = null } = options;
  try {
    if (showToast) {
      toast.info("Descargando XML...");
    }

    const response = await fetch(
      `/api/${tipoComprobante}s/${comprobanteId}/xml`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    if (!response.ok) {
      throw new Error(
        `Error HTTP: ${response.status} - ${response.statusText}`
      );
    }

    const blob = await response.blob();
    const filename = `${tipoComprobante.toUpperCase()}_${numeroComprobante}.xml`;
    return downloadFromBlob(blob, filename, { showToast, onError });
  } catch (error) {
    const errorMessage = error.message || "Error al descargar el XML";
    if (onError) {
      onError(error);
    } else if (showToast) {
      toast.error(errorMessage);
    }

    return false;
  }
};

/**
 * Abrir PDF en nueva ventana para impresión
 * @param {string|Blob} source - URL o Blob del PDF
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<boolean>} - True si se abrió correctamente
 */
export const openPDFForPrint = async (source, options = {}) => {
  const { showToast = true, onError = null } = options;
  try {
    let pdfUrl;
    if (typeof source === "string") {
      // Es una URL
      pdfUrl = source;
    } else if (source instanceof Blob) {
      // Es un Blob
      pdfUrl = window.URL.createObjectURL(source);
    } else {
      throw new Error("Fuente de PDF inválida");
    }

    // Abrir en nueva ventana
    const printWindow = window.open(pdfUrl, "_blank");
    if (!printWindow) {
      throw new Error(
        "No se pudo abrir la ventana. Verifique que no esté bloqueada por el navegador."
      );
    }

    // Limpiar URL temporal si se creó desde blob
    if (source instanceof Blob) {
      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 1000);
    }

    if (showToast) {
      toast.success("PDF abierto para impresión");
    }

    return true;
  } catch (error) {
    const errorMessage = error.message || "Error al abrir el PDF";
    if (onError) {
      onError(error);
    } else if (showToast) {
      toast.error(errorMessage);
    }

    return false;
  }
};

/**
 * Validar si el navegador soporta descargas
 * @returns {boolean} - True si soporta descargas
 */
export const supportsDownload = () => {
  return (
    typeof window !== "undefined" &&
    "document" in window &&
    "createElement" in document
  );
};

/**
 * Obtener extensión de archivo desde nombre o URL
 * @param {string} filename - Nombre del archivo o URL
 * @returns {string} - Extensión del archivo
 */
export const getFileExtension = (filename) => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

/**
 * Validar tipo de archivo
 * @param {string} filename - Nombre del archivo
 * @param {string[]} allowedTypes - Tipos permitidos
 * @returns {boolean} - True si el tipo está permitido
 */
export const isValidFileType = (filename, allowedTypes = ["pdf", "xml"]) => {
  const extension = getFileExtension(filename);
  return allowedTypes.includes(extension);
};

/**
 * Formatear tamaño de archivo
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} - Tamaño formateado
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
export default {
  downloadFromUrl,
  downloadFromBlob,
  downloadFromBase64,
  downloadFacturaPDF,
  downloadComprobanteXML,
  openPDFForPrint,
  supportsDownload,
  getFileExtension,
  isValidFileType,
  formatFileSize,
};
