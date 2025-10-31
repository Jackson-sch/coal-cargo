import ApiGoService from "./api-go";
import ApiSunatService from "./apisunat";
import { createServiceFactory } from "./sunat/factory";

/**
 * Servicio principal para operaciones SUNAT
 * Implementa la estructura recomendada en INTEGRACION_NEXTJS.md
 */
export class SunatServices {
  // ==================== FACTURAS ====================

  /**
   * Crear una nueva factura
   * @param {Object} facturaData - Datos de la factura
   * @returns {Promise<Object>} Respuesta de la API
   */
  static async crearFactura(facturaData) {
    try {
      const service = createServiceFactory();
      const response = await service.crearFactura(facturaData);

      return {
        success: true,
        data: response,
        message: "Factura creada correctamente",
      };
    } catch (error) {
      throw new Error(`Error al crear factura: ${error.message}`);
    }
  }

  /**
   * Enviar factura a SUNAT
   * @param {string|number} facturaId - ID de la factura
   * @returns {Promise<Object>} Respuesta de SUNAT
   */
  static async enviarFacturaASunat(facturaId) {
    try {
      const service = createServiceFactory();
      const response = await service.enviarComprobante(facturaId);

      return {
        success: true,
        data: response,
        message: "Factura enviada a SUNAT correctamente",
      };
    } catch (error) {
      throw new Error(`Error al enviar factura: ${error.message}`);
    }
  }

  /**
   * Descargar PDF de factura
   * @param {string|number} facturaId - ID de la factura
   * @returns {Promise<Blob>} Archivo PDF como blob
   */
  static async descargarFacturaPDF(facturaId) {
    try {
      const service = createServiceFactory();

      if (service instanceof ApiGoService) {
        const response = await service.descargarPDF(facturaId);
        if (response.success && response.data) {
          // Convertir buffer a blob
          return new Blob([response.data], { type: "application/pdf" });
        }
        throw new Error(response.error || "Error al descargar PDF");
      } else {
        // Para ApiSunatService
        const response = await service.descargarPDF(facturaId);
        return response;
      }
    } catch (error) {
      throw new Error(`Error al descargar PDF: ${error.message}`);
    }
  }

  // ==================== BOLETAS ====================

  /**
   * Crear una nueva boleta
   * @param {Object} boletaData - Datos de la boleta
   * @returns {Promise<Object>} Respuesta de la API
   */
  static async crearBoleta(boletaData) {
    try {
      const service = createServiceFactory();
      const response = await service.crearBoleta(boletaData);

      return {
        success: true,
        data: response,
        message: "Boleta creada correctamente",
      };
    } catch (error) {
      throw new Error(`Error al crear boleta: ${error.message}`);
    }
  }

  /**
   * Enviar boleta a SUNAT
   * @param {string|number} boletaId - ID de la boleta
   * @returns {Promise<Object>} Respuesta de SUNAT
   */
  static async enviarBoletaASunat(boletaId) {
    try {
      const service = createServiceFactory();
      const response = await service.enviarComprobante(boletaId);

      return {
        success: true,
        data: response,
        message: "Boleta enviada a SUNAT correctamente",
      };
    } catch (error) {
      throw new Error(`Error al enviar boleta: ${error.message}`);
    }
  }

  // ==================== NOTAS DE CRÉDITO ====================

  /**
   * Crear una nueva nota de crédito
   * @param {Object} notaData - Datos de la nota de crédito
   * @returns {Promise<Object>} Respuesta de la API
   */
  static async crearNotaCredito(notaData) {
    try {
      const service = createServiceFactory();
      const response = await service.crearNotaCredito(notaData);

      return {
        success: true,
        data: response,
        message: "Nota de crédito creada correctamente",
      };
    } catch (error) {
      throw new Error(`Error al crear nota de crédito: ${error.message}`);
    }
  }

  // ==================== GUÍAS DE REMISIÓN ====================

  /**
   * Crear una nueva guía de remisión
   * @param {Object} guiaData - Datos de la guía de remisión
   * @returns {Promise<Object>} Respuesta de la API
   */
  static async crearGuiaRemision(guiaData) {
    try {
      const service = createServiceFactory();
      const response = await service.crearGuiaRemision(guiaData);

      return {
        success: true,
        data: response,
        message: "Guía de remisión creada correctamente",
      };
    } catch (error) {
      throw new Error(`Error al crear guía: ${error.message}`);
    }
  }

  // ==================== CONSULTAS ====================

  /**
   * Consultar estado de comprobante en SUNAT
   * @param {string} tipo - Tipo de documento (factura, boleta, etc.)
   * @param {string|number} documentoId - ID del documento
   * @returns {Promise<Object>} Estado del documento
   */
  static async consultarComprobante(tipo, documentoId) {
    try {
      const service = createServiceFactory();
      const response = await service.consultarEstado(documentoId);

      return {
        success: true,
        data: response,
        message: "Consulta realizada correctamente",
      };
    } catch (error) {
      throw new Error(`Error en consulta: ${error.message}`);
    }
  }

  // ==================== CONFIGURACIÓN ====================

  /**
   * Obtener lista de empresas configuradas
   * @returns {Promise<Object>} Lista de empresas
   */
  static async obtenerEmpresas() {
    try {
      // Esta funcionalidad dependerá de tu implementación específica
      // Por ahora retornamos un placeholder
      return {
        success: true,
        data: [],
        message: "Empresas obtenidas correctamente",
      };
    } catch (error) {
      throw new Error(`Error al obtener empresas: ${error.message}`);
    }
  }

  /**
   * Obtener clientes de una empresa
   * @param {string|number} companyId - ID de la empresa
   * @returns {Promise<Object>} Lista de clientes
   */
  static async obtenerClientes(companyId) {
    try {
      // Esta funcionalidad se puede integrar con tu sistema de clientes existente
      return {
        success: true,
        data: [],
        message: "Clientes obtenidos correctamente",
      };
    } catch (error) {
      throw new Error(`Error al obtener clientes: ${error.message}`);
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Validar datos de factura antes de enviar
   * @param {Object} facturaData - Datos a validar
   * @returns {Object} Resultado de validación
   */
  static validarDatosFactura(facturaData) {
    const errores = [];

    if (!facturaData.clienteId) {
      errores.push("Cliente es requerido");
    }

    if (!facturaData.items || facturaData.items.length === 0) {
      errores.push("Debe incluir al menos un item");
    }

    if (facturaData.items) {
      facturaData.items.forEach((item, index) => {
        if (!item.descripcion) {
          errores.push(`Item ${index + 1}: Descripción es requerida`);
        }
        if (!item.cantidad || item.cantidad <= 0) {
          errores.push(`Item ${index + 1}: Cantidad debe ser mayor a 0`);
        }
        if (!item.precio || item.precio <= 0) {
          errores.push(`Item ${index + 1}: Precio debe ser mayor a 0`);
        }
      });
    }

    return {
      valido: errores.length === 0,
      errores,
    };
  }

  /**
   * Formatear datos para API según el servicio configurado
   * @param {Object} datos - Datos originales
   * @param {string} tipoDocumento - Tipo de documento
   * @returns {Object} Datos formateados
   */
  static formatearDatosParaAPI(datos, tipoDocumento = "factura") {
    const service = createServiceFactory();

    if (service instanceof ApiGoService) {
      return service.formatearFacturaApiGo(datos);
    } else {
      return service.formatearFactura(datos);
    }
  }
}
