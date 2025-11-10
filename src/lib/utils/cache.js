/**
 * Utilidades de cacheo estratégico para Next.js
 * Usa unstable_cache de Next.js para cachear datos frecuentemente consultados
 */

import { unstable_cache } from "next/cache";

/**
 * Tiempos de cache en segundos
 */
export const CACHE_TTL = {
  SHORT: 60, // 1 minuto - para datos que cambian frecuentemente
  MEDIUM: 300, // 5 minutos - para estadísticas y datos semi-estáticos
  LONG: 1800, // 30 minutos - para datos muy estáticos
  VERY_LONG: 3600, // 1 hora - para datos que raramente cambian
};

/**
 * Tags para invalidar cache específico
 */
export const CACHE_TAGS = {
  SUCURSALES: "sucursales",
  RUTAS: "rutas",
  VEHICULOS: "vehiculos",
  CLIENTES: "clientes",
  ENVIOS: "envios",
  ESTADISTICAS: "estadisticas",
  DASHBOARD: "dashboard",
  TARIFAS: "tarifas",
  UBIGEO: "ubigeo",
};

/**
 * Crear función cacheada con configuración personalizada
 *
 * @param {Function} fn - Función a cachear
 * @param {string[]} keyParts - Partes de la clave de cache (se unen con "-")
 * @param {string[]} tags - Tags para invalidar cache
 * @param {number} revalidate - Tiempo en segundos antes de revalidar
 * @returns {Function} Función cacheada
 */
export function createCachedFunction(fn, keyParts, tags = [], revalidate = CACHE_TTL.MEDIUM) {
  return unstable_cache(
    async (...args) => {
      return fn(...args);
    },
    keyParts,
    {
      tags,
      revalidate,
    }
  );
}

/**
 * Cachear función de estadísticas
 * Las estadísticas cambian poco, así que usamos cache largo
 */
export function cacheEstadisticas(fn, keyParts) {
  return createCachedFunction(
    fn,
    keyParts,
    [CACHE_TAGS.ESTADISTICAS],
    CACHE_TTL.MEDIUM
  );
}

/**
 * Cachear función de datos estáticos (sucursales, tipos, etc.)
 * Estos datos cambian muy poco, así que usamos cache muy largo
 */
export function cacheDatosEstaticos(fn, keyParts, tag) {
  return createCachedFunction(
    fn,
    keyParts,
    [tag],
    CACHE_TTL.VERY_LONG
  );
}

/**
 * Cachear función de dashboard KPIs
 * Los KPIs se actualizan frecuentemente, pero podemos cachear por un tiempo corto
 */
export function cacheDashboardKpis(fn, keyParts, sucursalId = "all") {
  return unstable_cache(
    async (...args) => {
      return fn(...args);
    },
    keyParts,
    {
      tags: [CACHE_TAGS.DASHBOARD, CACHE_TAGS.ESTADISTICAS],
      revalidate: CACHE_TTL.SHORT,
    }
  );
}

/**
 * Cachear función de listas con paginación
 * Cache más corto porque las listas cambian frecuentemente
 */
export function cacheLista(fn, keyParts, tag, filtros = {}) {
  // Incluir filtros relevantes en la clave de cache
  const filterKey = Object.entries(filtros)
    .filter(([_, value]) => value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");

  return createCachedFunction(
    fn,
    [...keyParts, filterKey],
    [tag],
    CACHE_TTL.SHORT
  );
}

/**
 * Invalidar cache por tag
 * Nota: Esto requiere usar revalidateTag de next/cache
 * Se debe usar en server actions después de mutaciones
 */
export function getCacheTagsToInvalidate(entityType) {
  const tagMap = {
    sucursal: [CACHE_TAGS.SUCURSALES, CACHE_TAGS.ESTADISTICAS, CACHE_TAGS.DASHBOARD],
    ruta: [CACHE_TAGS.RUTAS, CACHE_TAGS.ESTADISTICAS],
    vehiculo: [CACHE_TAGS.VEHICULOS, CACHE_TAGS.ESTADISTICAS],
    cliente: [CACHE_TAGS.CLIENTES, CACHE_TAGS.ESTADISTICAS],
    envio: [CACHE_TAGS.ENVIOS, CACHE_TAGS.ESTADISTICAS, CACHE_TAGS.DASHBOARD],
    tarifa: [CACHE_TAGS.TARIFAS, CACHE_TAGS.ESTADISTICAS],
  };

  return tagMap[entityType] || [];
}

