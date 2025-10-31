/**
 * Servicio de integración con API-GO para facturación electrónica
 * API-GO: https://github.com/giansalex/api-facturacion-sunat
 * Documentación: https://apigo.apuuraydev.com/docs/
 */
class ApiGoService {
  constructor() {
    this.baseUrl =
      process.env.API_GO_BASE_URL || "http://127.0.0.1:8000/api/v1";
    this.token = process.env.API_GO_TOKEN;
    this.environment = process.env.API_GO_ENVIRONMENT || "development";

    // Forzar simulación en desarrollo si la API no está disponible
    this.simulateInDevelopment = this.environment === "development";
    this.autoSendToSunat = process.env.API_GO_AUTO_SEND === "true" || true;

    // Verificar conectividad con API-GO al inicializar
    if (this.environment === "development") {
      this.verificarConectividad();
    }
  }

  /**
   * Verificar conectividad con API-GO
   */
  async verificarConectividad() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(3000), // Timeout de 3 segundos
      });

      if (response.ok) {
        this.simulateInDevelopment = false; // Desactivar simulación si API está disponible
      } else if (response.status === 401) {
        this.simulateInDevelopment = true;
      } else {
        this.simulateInDevelopment = true;
      }
    } catch (error) {
      this.simulateInDevelopment = true;
    }
  }

  /**
   * Configuración de headers para las peticiones
   */
  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Emitir una factura electrónica
   * @param {Object} facturaData - Datos de la factura
   * @returns {Promise<Object>} - Respuesta de API-GO
   */
  async emitirFactura(facturaData) {
    try {
      // Simulación activa
      if (this.simulateInDevelopment) {
        return this.simularEmisionExitosa(facturaData, "01");
      }

      // Crear factura
      const createResponse = await fetch(`${this.baseUrl}/invoices`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(await this.formatearFacturaApiGo(facturaData)),
      });

      if (!createResponse.ok) {
        const status = createResponse.status;
        const errorText = await createResponse.text().catch(() => "");

        if (
          this.environment === "development" &&
          (status === 401 || status === 403 || status === 404)
        ) {
          this.simulateInDevelopment = true;
          return this.simularEmisionExitosa(facturaData, "01");
        }

        throw new Error(`Error al crear factura: ${status} ${errorText}`);
      }

      const invoiceResult = await createResponse.json();

      // Enviar a SUNAT
      if (invoiceResult?.id) {
        const sendResponse = await fetch(
          `${this.baseUrl}/invoices/${invoiceResult.id}/send`,
          {
            method: "POST",
            headers: this.getHeaders(),
          }
        );

        if (!sendResponse.ok) {
          const status = sendResponse.status;
          const errorText = await sendResponse.text().catch(() => "");

          if (
            this.environment === "development" &&
            (status === 401 || status === 403)
          ) {
            this.simulateInDevelopment = true;
            return this.simularEnvioExitoso(invoiceResult.id, "factura");
          }

          throw new Error(
            `Error al enviar factura a SUNAT: ${status} ${errorText}`
          );
        }

        const sendResult = await sendResponse.json();

        return {
          success: true,
          message: "Factura emitida correctamente",
          estado: sendResult?.status || "ENVIADO",
          pseId: invoiceResult.id,
          codigoHash: sendResult?.hash || null,
          urlPdf: null,
          urlXml: null,
          urlCdr: null,
        };
      }

      if (this.environment === "development") {
        this.simulateInDevelopment = true;
        return this.simularEmisionExitosa(facturaData, "01");
      }

      return { success: false, message: "No se pudo crear la factura" };
    } catch (error) {
      if (this.environment === "development") {
        this.simulateInDevelopment = true;
        return this.simularEmisionExitosa(facturaData, "01");
      }
      return this.manejarErrorSunat(error);
    }
  }

  /**
   * Crear una factura electrónica (método requerido por sunat-services)
   * @param {Object} facturaData - Datos de la factura
   * @returns {Promise<Object>} - Respuesta de API-GO
   */
  async crearFactura(facturaData) {
    return this.emitirFactura(facturaData);
  }

  /**
   * Crear una boleta electrónica (sin enviar a SUNAT)
   * @param {Object} boletaData - Datos de la boleta
   * @returns {Promise<Object>} - Respuesta de API-GO
   */
  async crearBoleta(boletaData) {
    try {
      // Validar datos antes de procesar
      const validacion = this.validarDatosComprobante(boletaData, "03");
      if (!validacion.esValido) {
        return {
          success: false,
          errores: validacion.errores,
          message: "Datos de boleta no válidos",
        };
      }

      if (validacion.advertencias.length > 0) {
        console.warn("Advertencias en boleta:", validacion.advertencias);
      }

      // En modo desarrollo, verificar primero si API está disponible
      if (this.environment === "development") {
        await this.verificarConectividad();
      }

      // Si está en modo simulación, devolver solo el objeto con id simulado
      if (this.simulateInDevelopment) {
        const sim = this.simularCreacionExitosa(boletaData, "03");
        return sim.data; // Debe incluir id para el siguiente paso de envío
      }

      // Crear la boleta (sin enviar)
      const receiptPayload = await this.formatearBoletaApiGo(boletaData);
      const createResponse = await fetch(`${this.baseUrl}/boletas`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(receiptPayload),
      });

      if (!createResponse.ok) {
        const status = createResponse.status;
        const errorText = await createResponse.text().catch(() => "");

        if (
          this.environment === "development" &&
          (status === 401 || status === 403 || status === 404)
        ) {
          this.simulateInDevelopment = true;
          const sim = this.simularCreacionExitosa(boletaData, "03");
          return sim.data;
        }

        throw new Error(`Error al crear boleta: ${status} - ${errorText}`);
      }

      const receiptResult = await createResponse.json();

      // Devolver el objeto tal cual lo entrega API-GO (debe incluir id)
      return receiptResult;
    } catch (error) {
      if (this.environment === "development") {
        this.simulateInDevelopment = true;
        const sim = this.simularCreacionExitosa(boletaData, "03");
        return sim.data;
      }
      throw error;
    }
  }

  /**
   * Enviar boleta existente a SUNAT
   * @param {string} boletaId - ID de la boleta en API-GO
   * @returns {Promise<Object>} - Respuesta de SUNAT
   */
  async enviarComprobante(boletaId, tipoDocumento = "boleta") {
    try {
      // En modo desarrollo, verificar primero si API está disponible
      if (this.environment === "development") {
        await this.verificarConectividad();
      }

      if (this.simulateInDevelopment) {
        return this.simularEnvioExitoso(boletaId, tipoDocumento);
      }

      const sendResponse = await fetch(
        `${this.baseUrl}/boletas/${boletaId}/send`,
        {
          method: "POST",
          headers: this.getHeaders(),
        }
      );

      if (!sendResponse.ok) {
        throw new Error(
          `Error al enviar ${tipoDocumento}: ${sendResponse.status}`
        );
      }

      const sendResult = await sendResponse.json();

      return {
        success: true,
        estado: sendResult.estado || "ENVIADO",
        mensaje: `${tipoDocumento} enviada a SUNAT exitosamente`,
        codigoHash: sendResult.hash,
        data: sendResult,
      };
    } catch (error) {
      return this.manejarErrorSunat(error);
    }
  }

  /**
   * Emitir una boleta electrónica (crear y enviar en un solo paso)
   * @param {Object} boletaData - Datos de la boleta
   * @returns {Promise<Object>} - Respuesta de API-GO
   */
  async emitirBoleta(boletaData) {
    try {
      // Validar datos antes de procesar
      const validacion = this.validarDatosComprobante(boletaData, "03");
      if (!validacion.esValido) {
        return {
          success: false,
          errores: validacion.errores,
          message: "Datos de boleta no válidos",
        };
      }

      // Simulación activa
      if (this.simulateInDevelopment) {
        return this.simularEmisionExitosa(boletaData, "03");
      }

      // Crear boleta
      const receipt = await this.crearBoleta(boletaData);
      if (!receipt?.id) {
        throw new Error("No se pudo crear la boleta");
      }

      // Enviar a SUNAT
      const sendResponse = await fetch(
        `${this.baseUrl}/boletas/${receipt.id}/send`,
        {
          method: "POST",
          headers: this.getHeaders(),
        }
      );

      if (!sendResponse.ok) {
        const status = sendResponse.status;
        const errorText = await sendResponse.text().catch(() => "");

        if (
          this.environment === "development" &&
          (status === 401 || status === 403)
        ) {
          this.simulateInDevelopment = true;
          return this.simularEmisionExitosa(boletaData, "03");
        }

        throw new Error(
          `Error al enviar boleta a SUNAT: ${status} ${errorText}`
        );
      }

      const sendResult = await sendResponse.json();

      return {
        success: true,
        message: "Boleta emitida correctamente",
        estado: sendResult?.status || "ENVIADO",
        pseId: receipt?.id || null,
        codigoHash: sendResult?.hash || null,
        urlPdf: null,
        urlXml: null,
        urlCdr: null,
      };
    } catch (error) {
      if (this.environment === "development") {
        this.simulateInDevelopment = true;
        return this.simularEmisionExitosa(boletaData, "03");
      }
      return this.manejarErrorSunat(error);
    }
  }

  // Métodos de utilidad y simulación...
  // (Continuaré con el resto de métodos en la siguiente parte)

  /**
   * Simular emisión exitosa para desarrollo
   */
  simularEmisionExitosa(data, tipoDoc) {
    const simulatedId = `SIM-${tipoDoc}-${Date.now()}`;
    const tipoDocumento = tipoDoc === "01" ? "Factura" : "Boleta";

    return {
      success: true,
      message: `${tipoDocumento} simulada exitosamente - Modo desarrollo`,
      estado: "ACEPTADO",
      pseId: simulatedId,
      codigoHash: `HASH-${simulatedId}`,
      urlPdf: null,
      urlXml: null,
      urlCdr: null,
      simulado: true,
      advertencias: ["Este es un documento simulado para desarrollo"],
    };
  }

  /**
   * Simular creación exitosa
   */
  simularCreacionExitosa(data, tipoDoc) {
    const simulatedId = `SIM-${tipoDoc}-${Date.now()}`;

    return {
      success: true,
      data: {
        id: simulatedId,
        tipo_documento: tipoDoc,
        serie: data.serie,
        correlativo: data.numero,
        fecha_emision: data.fechaEmision,
        cliente: data.nombreCliente,
        total: data.total,
        estado: "CREADO",
        simulado: true,
      },
    };
  }

  /**
   * Simular envío exitoso
   */
  simularEnvioExitoso(id, tipoDocumento) {
    return {
      success: true,
      estado: "ACEPTADO",
      mensaje: `${tipoDocumento} simulada enviada a SUNAT exitosamente`,
      codigoHash: `HASH-${id}`,
      data: {
        id,
        estado: "ACEPTADO",
        codigo_respuesta: "0",
        descripcion: "Documento aceptado (SIMULADO)",
        fecha_proceso: new Date().toISOString(),
        simulado: true,
      },
    };
  }

  /**
   * Manejar errores de SUNAT
   */
  manejarErrorSunat(error) {
    return {
      success: false,
      error: error.message,
      message: "Error en el servicio de facturación",
    };
  }

  /**
   * Validar datos del comprobante
   */
  validarDatosComprobante(data, tipoDoc) {
    const errores = [];
    const advertencias = [];

    if (!data.serie) errores.push("Serie es requerida");
    if (!data.numero) errores.push("Número es requerido");
    if (!data.fechaEmision) errores.push("Fecha de emisión es requerida");
    if (!data.nombreCliente) errores.push("Nombre del cliente es requerido");
    if (!data.total || data.total <= 0)
      errores.push("Total debe ser mayor a 0");

    return {
      esValido: errores.length === 0,
      errores,
      advertencias,
    };
  }

  /**
   * Formatear datos para factura según formato API-GO
   */
  async formatearFacturaApiGo(facturaData) {
    // Implementación básica - se puede expandir según necesidades
    return {
      tipoDoc: "01",
      serie: facturaData.serie,
      correlativo: facturaData.numero.toString(),
      fecha_emision: facturaData.fechaEmision,
      tipoMoneda: "PEN",
      company_id: 1,
      branch_id: 1,
      cliente: {
        tipoDoc: facturaData.tipoDocumentoCliente || "6",
        numDoc: facturaData.numeroDocumentoCliente,
        rznSocial: facturaData.nombreCliente,
        address: facturaData.direccionCliente || "",
      },
      details: facturaData.detalles || [],
      mtoOperGravadas: facturaData.subtotal || 0,
      mtoIGV: facturaData.igv || 0,
      totalImpuestos: facturaData.igv || 0,
      mtoImpVenta: facturaData.total || 0,
    };
  }

  /**
   * Formatear datos para boleta según formato API-GO
   */
  async formatearBoletaApiGo(boletaData) {
    // Implementación básica - se puede expandir según necesidades
    return {
      tipoDoc: "03",
      serie: boletaData.serie,
      correlativo: boletaData.numero.toString(),
      fecha_emision: boletaData.fechaEmision,
      tipoMoneda: "PEN",
      company_id: 1,
      branch_id: 1,
      cliente: {
        tipoDoc: boletaData.tipoDocumentoCliente || "1",
        numDoc: boletaData.numeroDocumentoCliente || "00000000",
        rznSocial: boletaData.nombreCliente || "Cliente",
      },
      details: boletaData.detalles || [],
      mtoOperGravadas: boletaData.subtotal || 0,
      mtoIGV: boletaData.igv || 0,
      totalImpuestos: boletaData.igv || 0,
      mtoImpVenta: boletaData.total || 0,
    };
  }
}

module.exports = ApiGoService;
