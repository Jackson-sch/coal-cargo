/**
 * Generador centralizado de números de guía
 * Mantiene consistencia en todo el sistema
 */

import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Genera un número de guía único y consistente
 * Formato: {PREFIJO}-{YYYYMMDD}-{XXXXXX}
 * Ejemplo: TRU-20251030-123456
 *
 * @param {string} sucursalOrigenId - ID de la sucursal de origen
 * @param {number} maxIntentos - Máximo número de intentos para generar guía única
 * @returns {Promise<string>} - Número de guía único
 */
export async function generarNumeroGuia(sucursalOrigenId, maxIntentos = 10) {
  if (!sucursalOrigenId) {
    throw new Error("ID de sucursal de origen es requerido");
  }

  // Obtener información de la sucursal
  const sucursal = await prisma.sucursales.findUnique({
    where: { id: sucursalOrigenId },
    select: {
      nombre: true,
      provincia: true,
    },
  });

  if (!sucursal) {
    throw new Error("Sucursal no encontrada");
  }

  // Generar prefijo basado en la sucursal
  const prefijo = generarPrefijo(sucursal);

  // Generar fecha en formato YYYYMMDD
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = (ahora.getMonth() + 1).toString().padStart(2, "0");
  const dia = ahora.getDate().toString().padStart(2, "0");
  const fechaFormato = `${año}${mes}${dia}`;

  let intentos = 0;

  while (intentos < maxIntentos) {
    // Generar número aleatorio de 6 dígitos
    const aleatorio = randomInt(0, 1_000_000).toString().padStart(6, "0");

    // Construir número de guía
    const numeroGuia = `${prefijo}-${fechaFormato}-${aleatorio}`;

    try {
      // Verificar que no exista en la base de datos
      const existeGuia = await prisma.envios.findFirst({
        where: { guia: numeroGuia },
        select: { id: true },
      });

      if (!existeGuia) {
        return numeroGuia;
      }

      intentos++;
    } catch (error) {
      console.error("Error al verificar guía existente:", error);
      intentos++;
    }
  }

  throw new Error(
    `No se pudo generar una guía única después de ${maxIntentos} intentos`
  );
}

/**
 * Genera el prefijo para la guía basado en la sucursal
 * Prioridad: provincia > nombre > "GEN"
 *
 * @param {Object} sucursal - Datos de la sucursal
 * @returns {string} - Prefijo de 2-3 caracteres
 */
function generarPrefijo(sucursal) {
  // 1. Si tiene provincia, usar las primeras 3 letras
  if (sucursal.provincia && sucursal.provincia.trim()) {
    return sucursal.provincia.trim().toUpperCase().substring(0, 3);
  }

  // 2. Si tiene nombre, usar las primeras 3 letras
  if (sucursal.nombre && sucursal.nombre.trim()) {
    return sucursal.nombre.trim().toUpperCase().substring(0, 3);
  }

  // 3. Fallback genérico
  return "GEN";
}

/**
 * Valida el formato de una guía
 *
 * @param {string} guia - Número de guía a validar
 * @returns {boolean} - True si el formato es válido
 */
export function validarFormatoGuia(guia) {
  if (!guia || typeof guia !== "string") {
    return false;
  }

  // Formato esperado: XXX-YYYYMMDD-XXXXXX
  const regex = /^[A-Z]{2,3}-\d{8}-\d{6}$/;
  return regex.test(guia);
}

/**
 * Extrae información de una guía
 *
 * @param {string} guia - Número de guía
 * @returns {Object|null} - Información extraída o null si es inválida
 */
export function extraerInfoGuia(guia) {
  if (!validarFormatoGuia(guia)) {
    return null;
  }

  const partes = guia.split("-");
  const [prefijo, fecha, numero] = partes;

  // Extraer fecha
  const año = parseInt(fecha.substring(0, 4));
  const mes = parseInt(fecha.substring(4, 6));
  const dia = parseInt(fecha.substring(6, 8));

  return {
    prefijo,
    fecha: new Date(año, mes - 1, dia),
    numero: parseInt(numero),
    año,
    mes,
    dia,
  };
}

/**
 * Genera un número de guía para migración de datos existentes
 * Mantiene el formato pero con prefijo "MIG" para identificar migraciones
 *
 * @returns {string} - Número de guía para migración
 */
export function generarGuiaMigracion() {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = (ahora.getMonth() + 1).toString().padStart(2, "0");
  const dia = ahora.getDate().toString().padStart(2, "0");
  const fechaFormato = `${año}${mes}${dia}`;

  const aleatorio = randomInt(0, 1_000_000).toString().padStart(6, "0");

  return `MIG-${fechaFormato}-${aleatorio}`;
}
