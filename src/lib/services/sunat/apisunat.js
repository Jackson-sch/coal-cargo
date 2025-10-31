/**
 * Servicio de integración con APISUNAT para facturación electrónica
 * Documentación: https://docs.apisunat.com/
 */
class ApiSunatService {
  constructor() {
    this.baseUrl = process.env.APISUNAT_BASE_URL || "https://back.apisunat.com";
    this.personaId = process.env.APISUNAT_PERSONA_ID;
    this.personaToken = process.env.APISUNAT_TOKEN;
    this.environment = process.env.APISUNAT_ENVIRONMENT || "development";

    if (!this.personaId || !this.personaToken) {
      throw new Error(
        "APISUNAT_PERSONA_ID y APISUNAT_TOKEN deben estar configurados en las variables de entorno"
      );
    }
  }

  /**
   * Configuración de headers para las peticiones
   */
  getHeaders() {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Emitir una factura electrónica
   * @param {Object} facturaData - Datos de la factura
   * @returns {Promise<Object>} - Respuesta de APISUNAT
   */
  async emitirFactura(facturaData) {
    try {
      const payload = this.formatearFactura(facturaData);

      const response = await fetch(`${this.baseUrl}/personas/v1/sendBill`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        const textResponse = await response.text();
        throw new Error(
          `Error al parsear respuesta JSON: ${jsonError.message}. Respuesta: ${textResponse}`
        );
      }

      if (!response.ok) {
        const errorMessage =
          result.message ||
          result.error ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Error APISUNAT: ${errorMessage}`);
      }

      return {
        success: true,
        data: result,
        pseId: result.id,
        estado: result.estado,
        xmlUrl: result.xml_url,
        pdfUrl: result.pdf_url,
        cdrUrl: result.cdr_url,
        message: "Factura emitida correctamente",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Error al emitir la factura",
      };
    }
  }

  /**
   * Emitir una boleta electrónica
   * @param {Object} boletaData - Datos de la boleta
   * @returns {Promise<Object>} - Respuesta de APISUNAT
   */
  async emitirBoleta(boletaData) {
    try {
      const payload = this.formatearBoleta(boletaData);

      const response = await fetch(`${this.baseUrl}/personas/v1/sendBill`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          `Error APISUNAT: ${result.message || "Error desconocido"}`
        );
      }

      return {
        success: true,
        data: result,
        pseId: result.id,
        estado: result.estado,
        xmlUrl: result.xml_url,
        pdfUrl: result.pdf_url,
        cdrUrl: result.cdr_url,
        message: "Boleta emitida correctamente",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Error al emitir la boleta",
      };
    }
  }

  /**
   * Consultar el estado de un comprobante
   * @param {string} pseId - ID del comprobante en APISUNAT
   * @returns {Promise<Object>} - Estado del comprobante
   */
  async consultarEstado(pseId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/personas/v1/status/${pseId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          `Error APISUNAT: ${result.message || "Error desconocido"}`
        );
      }

      return {
        success: true,
        data: result,
        estado: result.estado,
        message: "Estado consultado correctamente",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Error al consultar el estado",
      };
    }
  }

  /**
   * Descargar archivo XML
   * @param {string} xmlUrl - URL del archivo XML
   * @returns {Promise<Buffer>} - Contenido del archivo
   */
  async descargarXML(xmlUrl) {
    try {
      const response = await fetch(xmlUrl);
      if (!response.ok) {
        throw new Error(`Error al descargar XML: ${response.status}`);
      }
      return await response.arrayBuffer();
    } catch (error) {
      throw new Error(`Error al descargar XML: ${error.message}`);
    }
  }

  /**
   * Descargar archivo PDF
   * @param {string} pdfUrl - URL del archivo PDF
   * @returns {Promise<Buffer>} - Contenido del archivo
   */
  async descargarPDF(pdfUrl) {
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Error al descargar PDF: ${response.status}`);
      }
      return await response.arrayBuffer();
    } catch (error) {
      throw new Error(`Error al descargar PDF: ${error.message}`);
    }
  }

  /**
   * Descargar CDR (Constancia de Recepción)
   * @param {string} cdrUrl - URL del archivo CDR
   * @returns {Promise<Buffer>} - Contenido del archivo
   */
  async descargarCDR(cdrUrl) {
    try {
      const response = await fetch(cdrUrl);
      if (!response.ok) {
        throw new Error(`Error al descargar CDR: ${response.status}`);
      }
      return await response.arrayBuffer();
    } catch (error) {
      throw new Error(`Error al descargar CDR: ${error.message}`);
    }
  }

  /**
   * Formatear datos para factura según formato APISUNAT
   * @param {Object} facturaData - Datos de la factura
   * @returns {Object} - Payload formateado
   */
  formatearFactura(facturaData) {
    return {
      personaId: this.personaId,
      personaToken: this.personaToken,
      fileName: `${facturaData.serie}-${facturaData.numero}`,
      documentType: "01", // Factura
      invoice: {
        serie: facturaData.serie,
        correlativo: facturaData.numero,
        fechaEmision: facturaData.fechaEmision,
        tipoMoneda: "PEN",
        client: {
          tipoDoc: this.mapearTipoDocumento(facturaData.tipoDocumentoCliente),
          numDoc: facturaData.numeroDocumentoCliente,
          rznSocial: facturaData.nombreCliente,
          address: {
            direccion: facturaData.direccionCliente || "",
          },
        },
        company: {
          ruc: facturaData.rucEmisor,
          razonSocial: facturaData.razonSocialEmisor,
          nombreComercial: facturaData.nombreComercialEmisor,
          address: {
            direccion: facturaData.direccionEmisor,
          },
        },
        details: facturaData.detalles.map((detalle) => ({
          codProducto: detalle.codigo || "",
          unidad: detalle.unidad || "NIU",
          descripcion: detalle.descripcion,
          cantidad: detalle.cantidad,
          mtoValorUnitario: detalle.precioUnitario,
          mtoValorVenta: detalle.cantidad * detalle.precioUnitario,
          mtoBaseIgv: detalle.cantidad * detalle.precioUnitario,
          porcentajeIgv: 18.0,
          igv: (detalle.cantidad * detalle.precioUnitario * 18) / 100,
          tipAfeIgv: 10, // Gravado - Operación Onerosa
          totalImpuestos:
            (detalle.cantidad * detalle.precioUnitario * 18) / 100,
          mtoPrecioUnitario: detalle.precioUnitario * 1.18,
        })),
        mtoOperGravadas: facturaData.subtotal,
        mtoIGV: facturaData.igv,
        totalImpuestos: facturaData.igv,
        valorVenta: facturaData.subtotal,
        mtoImpVenta: facturaData.total,
      },
    };
  }

  /**
   * Formatear datos para boleta según formato APISUNAT
   * @param {Object} boletaData - Datos de la boleta
   * @returns {Object} - Payload formateado
   */
  formatearBoleta(boletaData) {
    return {
      personaId: this.personaId,
      personaToken: this.personaToken,
      fileName: `${boletaData.serie}-${boletaData.numero}`,
      documentType: "03", // Boleta
      invoice: {
        serie: boletaData.serie,
        correlativo: boletaData.numero,
        fechaEmision: boletaData.fechaEmision,
        tipoMoneda: "PEN",
        client: {
          tipoDoc: this.mapearTipoDocumento(
            boletaData.tipoDocumentoCliente || "DNI"
          ),
          numDoc: boletaData.numeroDocumentoCliente || "00000000",
          rznSocial: boletaData.nombreCliente || "Cliente",
        },
        company: {
          ruc: boletaData.rucEmisor,
          razonSocial: boletaData.razonSocialEmisor,
          nombreComercial: boletaData.nombreComercialEmisor,
          address: {
            direccion: boletaData.direccionEmisor,
          },
        },
        details: boletaData.detalles.map((detalle) => ({
          codProducto: detalle.codigo || "",
          unidad: detalle.unidad || "NIU",
          descripcion: detalle.descripcion,
          cantidad: detalle.cantidad,
          mtoValorUnitario: detalle.precioUnitario,
          mtoValorVenta: detalle.cantidad * detalle.precioUnitario,
          mtoBaseIgv: detalle.cantidad * detalle.precioUnitario,
          porcentajeIgv: 18.0,
          igv: (detalle.cantidad * detalle.precioUnitario * 18) / 100,
          tipAfeIgv: 10, // Gravado - Operación Onerosa
          totalImpuestos:
            (detalle.cantidad * detalle.precioUnitario * 18) / 100,
          mtoPrecioUnitario: detalle.precioUnitario * 1.18,
        })),
        mtoOperGravadas: boletaData.subtotal,
        mtoIGV: boletaData.igv,
        totalImpuestos: boletaData.igv,
        valorVenta: boletaData.subtotal,
        mtoImpVenta: boletaData.total,
      },
    };
  }

  /**
   * Mapear tipos de documento a códigos SUNAT
   * @param {string} tipoDocumento - Tipo de documento interno
   * @returns {string} - Código SUNAT
   */
  mapearTipoDocumento(tipoDocumento) {
    const mapeo = {
      DNI: "1",
      RUC: "6",
      PASAPORTE: "7",
      CARNET_EXTRANJERIA: "4",
    };
    return mapeo[tipoDocumento] || "1";
  }
}

export default ApiSunatService;
