"use client";

import { parseAsString, parseAsInteger, useQueryState } from "nuqs";

/**
 * Hook para búsqueda (query de texto)
 */
export function useSearchQuery(defaultValue = "") {
  return useQueryState("q", parseAsString.withDefault(defaultValue));
}

/**
 * Hook para número de página
 */
export function usePage(defaultValue = 1) {
  return useQueryState("page", parseAsInteger.withDefault(defaultValue));
}

/**
 * Hook para filtro de estado (string)
 */
export function useEstadoFilter(defaultValue = "todos") {
  return useQueryState("estado", parseAsString.withDefault(defaultValue));
}

/**
 * Hook para filtro de fecha (string: "todos", "hoy", "semana", "mes")
 */
export function useFechaFilter(defaultValue = "todos") {
  return useQueryState("fecha", parseAsString.withDefault(defaultValue));
}

/**
 * Hook para número de guía (búsqueda específica)
 */
export function useGuia(defaultValue = "") {
  return useQueryState("guia", parseAsString.withDefault(defaultValue));
}

/**
 * Hook para sucursal de origen
 */
export function useSucursalOrigen(defaultValue = "all-branches") {
  return useQueryState("origen", parseAsString.withDefault(defaultValue));
}

/**
 * Hook para sucursal de destino
 */
export function useSucursalDestino(defaultValue = "all-branches") {
  return useQueryState("destino", parseAsString.withDefault(defaultValue));
}

/**
 * Hook para cliente
 */
export function useCliente(defaultValue = "all-clients") {
  return useQueryState("cliente", parseAsString.withDefault(defaultValue));
}

/**
 * Hook para fecha desde (formato ISO string)
 */
export function useFechaDesde(defaultValue = null) {
  return useQueryState("fechaDesde", parseAsString.withDefault(defaultValue));
}

/**
 * Hook para fecha hasta (formato ISO string)
 */
export function useFechaHasta(defaultValue = null) {
  return useQueryState("fechaHasta", parseAsString.withDefault(defaultValue));
}

/**
 * Hook para método de pago
 */
export function useMetodoPago(defaultValue = "ALL") {
  return useQueryState("metodo", parseAsString.withDefault(defaultValue));
}

/**
 * Hook para filtro de búsqueda general (usado en pagos)
 */
export function useBusqueda(defaultValue = "") {
  return useQueryState("busqueda", parseAsString.withDefault(defaultValue));
}

/**
 * Hook para tipo de fecha (envio | pago)
 */
export function useTipoFecha(defaultValue = "envio") {
  return useQueryState("tipoFecha", parseAsString.withDefault(defaultValue));
}
