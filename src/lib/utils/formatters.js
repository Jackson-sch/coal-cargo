import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Formatea una fecha usando date-fns con localización en español
 * @param {Date|string|number} date - La fecha a formatear
 * @param {string} formatString - El formato deseado (por defecto: 'dd/MM/yyyy')
 * @param {Object} options - Opciones adicionales
 * @returns {string} - La fecha formateada o cadena vacía si es inválida
 */
export function formatDate(date, formatString = "dd/MM/yyyy", options = {}) {
  try {
    if (!date) return "";
    let dateObj;

    // Convertir diferentes tipos de entrada a objeto Date
    if (typeof date === "string") {
      dateObj = parseISO(date);
    } else if (typeof date === "number") {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return "";
    }

    // Verificar si la fecha es válida
    if (!isValid(dateObj)) {
      return "";
    }

    // Formatear con localización en español
    return format(dateObj, formatString, { locale: es, ...options });
  } catch (error) {
    return "";
  }
}
/**
 * Formatea una fecha con formato largo (ej: "15 de enero de 2024")
 * @param {Date|string|number} date - La fecha a formatear
 * @returns {string} - La fecha en formato largo
 */
export function formatDateLong(date) {
  return formatDate(date, "dd 'de' MMMM 'de' yyyy");
}

/**
 * Formatea una fecha con formato corto (ej: "15/01/24")
 * @param {Date|string|number} date - La fecha a formatear
 * @returns {string} - La fecha en formato corto
 */
export function formatDateShort(date) {
  return formatDate(date, "dd/MM/yy");
}

/**
 * Formatea una fecha con hora (ej: "15/01/2024 14:30")
 * @param {Date|string|number} date - La fecha a formatear
 * @returns {string} - La fecha con hora
 */
export function formatDateTime(date) {
  return formatDate(date, "dd/MM/yyyy HH:mm");
}

/**
 * Formatea una fecha con hora completa (ej: "15/01/2024 14:30:45")
 * @param {Date|string|number} date - La fecha a formatear
 * @returns {string} - La fecha con hora completa
 */
export function formatDateTimeFull(date) {
  return formatDate(date, "dd/MM/yyyy HH:mm:ss");
}

/**
 * Formatea solo la hora (ej: "14:30")
 * @param {Date|string|number} date - La fecha a formatear
 * @returns {string} - Solo la hora
 */
export function formatTime(date) {
  return formatDate(date, "HH:mm");
}

/**
 * Formatea un número como moneda peruana (soles)
 * @param {number|string} amount - El monto a formatear
 * @param {Object} options - Opciones de formateo
 * @param {boolean} options.showSymbol - Mostrar símbolo S/ (por defecto: true)
 * @param {boolean} options.showCode - Mostrar código PEN (por defecto: false)
 * @param {number} options.decimals - Número de decimales (por defecto: 2)
 * @returns {string} - El monto formateado
 */
export function formatCurrency(amount, options = {}) {
  const { showSymbol = true, showCode = false, decimals = 2 } = options;
  try {
    // Convertir a número si es string
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

    // Verificar si es un número válido
    if (isNaN(numAmount)) {
      return showSymbol ? "S/ 0.00" : "0.00";
    }

    // Formatear el número con separadores de miles y decimales
    const formattedNumber = numAmount.toLocaleString("es-PE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    // Construir el resultado según las opciones
    let result = formattedNumber;
    if (showSymbol) {
      result = `S/ ${result}`;
    }

    if (showCode) {
      result = showSymbol ? `${result} PEN` : `${result} PEN`;
    }

    return result;
  } catch (error) {
    return showSymbol ? "S/ 0.00" : "0.00";
  }
}
/**
 * Formatea un número como moneda peruana con símbolo S/
 * @param {number|string} amount - El monto a formatear
 * @param {number} decimals - Número de decimales (por defecto: 2)
 * @returns {string} - El monto formateado con símbolo
 */
export function formatSoles(amount, decimals = 2) {
  return formatCurrency(amount, { showSymbol: true, decimals });
}

/**
 * Formatea un número como moneda peruana con código PEN
 * @param {number|string} amount - El monto a formatear
 * @param {number} decimals - Número de decimales (por defecto: 2)
 * @returns {string} - El monto formateado con código PEN
 */
export function formatPEN(amount, decimals = 2) {
  return formatCurrency(amount, {
    showSymbol: false,
    showCode: true,
    decimals,
  });
}

/**
 * Formatea un número como moneda peruana con símbolo y código
 * @param {number|string} amount - El monto a formatear
 * @param {number} decimals - Número de decimales (por defecto: 2)
 * @returns {string} - El monto formateado completo
 */
export function formatSolesPEN(amount, decimals = 2) {
  return formatCurrency(amount, { showSymbol: true, showCode: true, decimals });
}

/**
 * Formatea un número como moneda sin símbolo ni código (solo el número)
 * @param {number|string} amount - El monto a formatear
 * @param {number} decimals - Número de decimales (por defecto: 2)
 * @returns {string} - Solo el número formateado
 */
export function formatNumber(amount, decimals = 2) {
  return formatCurrency(amount, {
    showSymbol: false,
    showCode: false,
    decimals,
  });
}
