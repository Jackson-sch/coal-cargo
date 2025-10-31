/**
 * Utilidades para el manejo de cotizaciones
 */
import { marcarCotizacionesExpiradas } from "@/lib/actions/cotizaciones";

/**
 * Ejecutar mantenimiento de cotizaciones (marcar expiradas)
 * Esta función se puede llamar periódicamente o al cargar la página
 */
export async function ejecutarMantenimientoCotizaciones() {
  try {
    const result = await marcarCotizacionesExpiradas();

    if (result.success && result.data.cotizacionesActualizadas > 0) {
      console.log(
        `Se marcaron ${result.data.cotizacionesActualizadas} cotizaciones como expiradas`
      );
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: "Error en mantenimiento de cotizaciones",
    };
  }
}
/**
 * Validar si una cotización puede ser convertida a envío
 */
export function puedeConvertirseAEnvio(cotizacion) {
  if (!cotizacion) return false;

  const estadosValidos = ["PENDIENTE", "APROBADA"];
  const noExpirada = new Date(cotizacion.validoHasta) >= new Date();

  return estadosValidos.includes(cotizacion.estado) && noExpirada;
}

/**
 * Calcular días restantes de validez
 */
export function diasRestantesValidez(validoHasta) {
  const ahora = new Date();
  const fechaVencimiento = new Date(validoHasta);
  const diferencia = fechaVencimiento.getTime() - ahora.getTime();
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  return Math.max(0, dias);
}

/**
 * Obtener color de estado basado en días restantes
 */
export function getColorEstadoValidez(validoHasta) {
  const diasRestantes = diasRestantesValidez(validoHasta);
  if (diasRestantes <= 0) return "text-red-600";
  if (diasRestantes <= 1) return "text-orange-600";
  if (diasRestantes <= 3) return "text-yellow-600";
  return "text-green-600";
}

/**
 * Formatear tiempo restante de validez
 */
export function formatearTiempoRestante(validoHasta) {
  const diasRestantes = diasRestantesValidez(validoHasta);
  if (diasRestantes <= 0) return "Expirada";
  if (diasRestantes === 1) return "Expira hoy";
  if (diasRestantes === 2) return "Expira mañana";
  return `${diasRestantes} días restantes`;
}
