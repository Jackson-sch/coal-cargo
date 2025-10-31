import ApiSunatService from "./apisunat.js";
import ApiGoService from "./api-go.js";

/**
 * Factory para crear instancias del servicio de facturación
 * según la configuración SUNAT_API_TYPE
 */
class SunatServiceFactory {
  /**
   * Crear instancia del servicio de facturación
   * @returns {ApiSunatService|ApiGoService}
   */
  static createService() {
    const apiType = process.env.SUNAT_API_TYPE;

    switch (apiType) {
      case "API_GO":
        return new ApiGoService();
      case "APISUNAT":
        return new ApiSunatService();
      default:
        return new ApiSunatService();
    }
  }

  /**
   * Obtener información del servicio activo
   * @returns {Object}
   */
  static getServiceInfo() {
    const apiType = process.env.SUNAT_API_TYPE;

    const serviceInfo = {
      API_GO: {
        name: "API-GO",
        description: "Servicio local de facturación electrónica",
        baseUrl: process.env.API_GO_BASE_URL,
        environment: process.env.API_GO_ENVIRONMENT,
      },
      APISUNAT: {
        name: "APISUNAT",
        description: "Servicio externo APISUNAT",
        baseUrl: process.env.APISUNAT_BASE_URL,
        environment: process.env.APISUNAT_ENVIRONMENT,
      },
    };

    return serviceInfo[apiType] || serviceInfo["APISUNAT"];
  }
}

/**
 * Función helper para crear instancia del servicio
 * @returns {ApiSunatService|ApiGoService}
 */
export function createServiceFactory() {
  return SunatServiceFactory.createService();
}

export default SunatServiceFactory;
