import { useState, useCallback } from "react";
import { SunatServices } from "../lib/services/sunat-services";
import { toast } from "sonner";

/**
 * Hook personalizado para operaciones SUNAT
 * Implementa la estructura recomendada en INTEGRACION_NEXTJS.md
 */
export const useSunat = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [operacionActual, setOperacionActual] = useState(null);

  /**
   * Ejecuta una operación SUNAT con manejo de estado
   * @param {Function} operacion - Función a ejecutar
   * @param {string} nombreOperacion - Nombre de la operación para logs
   * @returns {Promise} Resultado de la operación
   */
  const ejecutarOperacion = useCallback(
    async (operacion, nombreOperacion = "Operación SUNAT") => {
      setLoading(true);
      setError(null);
      setOperacionActual(nombreOperacion);

      try {
        const resultado = await operacion();

        // Mostrar mensaje de éxito si la operación lo incluye
        if (resultado.success && resultado.message) {
          toast.success(resultado.message);
        }

        return resultado;
      } catch (err) {
        const errorMessage =
          err.message || "Error desconocido en operación SUNAT";
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
        setOperacionActual(null);
      }
    },
    []
  );

  // ==================== FACTURAS ====================

  /**
   * Crear una nueva factura
   * @param {Object} data - Datos de la factura
   * @returns {Promise} Resultado de la creación
   */
  const crearFactura = useCallback(
    (data) => {
      return ejecutarOperacion(
        () => SunatServices.crearFactura(data),
        "Creando factura"
      );
    },
    [ejecutarOperacion]
  );

  /**
   * Enviar factura a SUNAT
   * @param {string|number} id - ID de la factura
   * @returns {Promise} Resultado del envío
   */
  const enviarFactura = useCallback(
    (id) => {
      return ejecutarOperacion(
        () => SunatServices.enviarFacturaASunat(id),
        "Enviando factura a SUNAT"
      );
    },
    [ejecutarOperacion]
  );

  /**
   * Descargar PDF de factura
   * @param {string|number} id - ID de la factura
   * @returns {Promise} Blob del PDF
   */
  const descargarPDF = useCallback(
    (id) => {
      return ejecutarOperacion(
        () => SunatServices.descargarFacturaPDF(id),
        "Descargando PDF"
      );
    },
    [ejecutarOperacion]
  );

  // ==================== BOLETAS ====================

  /**
   * Crear una nueva boleta
   * @param {Object} data - Datos de la boleta
   * @returns {Promise} Resultado de la creación
   */
  const crearBoleta = useCallback(
    (data) => {
      return ejecutarOperacion(
        () => SunatServices.crearBoleta(data),
        "Creando boleta"
      );
    },
    [ejecutarOperacion]
  );

  /**
   * Enviar boleta a SUNAT
   * @param {string|number} id - ID de la boleta
   * @returns {Promise} Resultado del envío
   */
  const enviarBoleta = useCallback(
    (id) => {
      return ejecutarOperacion(
        () => SunatServices.enviarBoletaASunat(id),
        "Enviando boleta a SUNAT"
      );
    },
    [ejecutarOperacion]
  );

  // ==================== NOTAS DE CRÉDITO ====================

  /**
   * Crear una nueva nota de crédito
   * @param {Object} data - Datos de la nota de crédito
   * @returns {Promise} Resultado de la creación
   */
  const crearNotaCredito = useCallback(
    (data) => {
      return ejecutarOperacion(
        () => SunatServices.crearNotaCredito(data),
        "Creando nota de crédito"
      );
    },
    [ejecutarOperacion]
  );

  // ==================== GUÍAS DE REMISIÓN ====================

  /**
   * Crear una nueva guía de remisión
   * @param {Object} data - Datos de la guía
   * @returns {Promise} Resultado de la creación
   */
  const crearGuiaRemision = useCallback(
    (data) => {
      return ejecutarOperacion(
        () => SunatServices.crearGuiaRemision(data),
        "Creando guía de remisión"
      );
    },
    [ejecutarOperacion]
  );

  // ==================== CONSULTAS ====================

  /**
   * Consultar estado de comprobante
   * @param {string} tipo - Tipo de documento
   * @param {string|number} documentoId - ID del documento
   * @returns {Promise} Estado del documento
   */
  const consultarComprobante = useCallback(
    (tipo, documentoId) => {
      return ejecutarOperacion(
        () => SunatServices.consultarComprobante(tipo, documentoId),
        "Consultando estado en SUNAT"
      );
    },
    [ejecutarOperacion]
  );

  // ==================== OPERACIONES COMBINADAS ====================

  /**
   * Crear y enviar factura en una sola operación
   * @param {Object} data - Datos de la factura
   * @returns {Promise} Resultado completo
   */
  const crearYEnviarFactura = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      setOperacionActual("Creando y enviando factura");

      // Validar datos antes de crear
      const validacion = SunatServices.validarDatosFactura(data);
      if (!validacion.valido) {
        throw new Error(`Datos inválidos: ${validacion.errores.join(", ")}`);
      }

      // 1. Crear la factura
      toast.info("Creando factura...");
      const facturaCreada = await SunatServices.crearFactura(data);
      if (!facturaCreada.success) {
        throw new Error("Error al crear la factura");
      }

      // 2. Enviar a SUNAT
      toast.info("Enviando a SUNAT...");
      const respuestaSunat = await SunatServices.enviarFacturaASunat(
        facturaCreada.data.id
      );
      if (!respuestaSunat.success) {
        throw new Error("Error al enviar a SUNAT");
      }

      toast.success("Factura creada y enviada exitosamente");
      return {
        success: true,
        factura: facturaCreada.data,
        sunat: respuestaSunat.data,
        message: "Factura creada y enviada exitosamente",
      };
    } catch (err) {
      const errorMessage = err.message || "Error en proceso completo";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setOperacionActual(null);
    }
  }, []);

  /**
   * Crear y enviar boleta en una sola operación
   * @param {Object} data - Datos de la boleta
   * @returns {Promise} Resultado completo
   */
  const crearYEnviarBoleta = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      setOperacionActual("Creando y enviando boleta");

      // 1. Crear la boleta
      toast.info("Creando boleta...");
      const boletaCreada = await SunatServices.crearBoleta(data);
      if (!boletaCreada.success) {
        throw new Error("Error al crear la boleta");
      }

      // 2. Enviar a SUNAT
      toast.info("Enviando a SUNAT...");
      const respuestaSunat = await SunatServices.enviarBoletaASunat(
        boletaCreada.data.id
      );
      if (!respuestaSunat.success) {
        throw new Error("Error al enviar a SUNAT");
      }

      toast.success("Boleta creada y enviada exitosamente");
      return {
        success: true,
        boleta: boletaCreada.data,
        sunat: respuestaSunat.data,
        message: "Boleta creada y enviada exitosamente",
      };
    } catch (err) {
      const errorMessage = err.message || "Error en proceso completo";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setOperacionActual(null);
    }
  }, []);

  // ==================== UTILIDADES ====================

  /**
   * Limpiar errores manualmente
   */
  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Validar datos antes de enviar
   * @param {Object} datos - Datos a validar
   * @param {string} tipo - Tipo de documento
   * @returns {Object} Resultado de validación
   */
  const validarDatos = useCallback((datos, tipo = "factura") => {
    if (tipo === "factura") {
      return SunatServices.validarDatosFactura(datos);
    }
    // Agregar más validaciones según el tipo
    return { valido: true, errores: [] };
  }, []);

  return {
    // Estado
    loading,
    error,
    operacionActual,
    // Facturas
    crearFactura,
    enviarFactura,
    descargarPDF,
    // Boletas
    crearBoleta,
    enviarBoleta,
    // Notas de crédito
    crearNotaCredito,
    // Guías de remisión
    crearGuiaRemision,
    // Consultas
    consultarComprobante,
    // Operaciones combinadas
    crearYEnviarFactura,
    crearYEnviarBoleta,
    // Utilidades
    limpiarError,
    validarDatos,
  };
};
