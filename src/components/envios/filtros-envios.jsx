"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, Search, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ESTADOS_ENVIO_VALIDOS } from "@/lib/constants/estados";

// Hook personalizado para debounce
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function FiltrosEnvios({
  filtros,
  setFiltros,
  estadosEnvio,
  sucursales,
  isSuperAdmin = true,
}) {
  const [busquedaTemporal, setBusquedaTemporal] = useState(
    filtros.busqueda || ""
  );

  const busquedaDebounced = useDebounce(busquedaTemporal, 500);

  useEffect(() => {
    if (busquedaDebounced !== (filtros.busqueda || "")) {
      setFiltros({
        ...filtros,
        busqueda: busquedaDebounced,
        numeroGuia: "",
        clienteId: "",
        page: 1,
      });
    }
  }, [busquedaDebounced]);

  const filtrosActivos = [
    filtros.estado && filtros.estado !== "all-states",
    filtros.sucursalOrigenId && filtros.sucursalOrigenId !== "all-branches",
    filtros.sucursalDestinoId && filtros.sucursalDestinoId !== "all-branches",
    filtros.fechaRango?.from && filtros.fechaRango?.to,
    busquedaTemporal?.trim(),
  ].filter(Boolean).length;

  const fechaDesdeValida =
    !filtros.fechaRango?.from ||
    !filtros.fechaRango?.to ||
    filtros.fechaRango.from <= filtros.fechaRango.to;

  const handleLimpiarFiltros = useCallback(() => {
    setBusquedaTemporal("");
    setFiltros({
      estado: "all-states",
      sucursalOrigenId: "all-branches",
      sucursalDestinoId: "all-branches",
      busqueda: "",
      numeroGuia: "",
      clienteId: "",
      fechaRango: { from: null, to: null },
      page: 1,
    });
  }, [setFiltros]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" /> Filtros de Búsqueda
        </CardTitle>
        {filtrosActivos > 0 && (
          <Badge
            variant="secondary"
            className="ml-auto"
            aria-label={`${filtrosActivos} filtros activos`}
          >
            {filtrosActivos} activo{filtrosActivos > 1 ? "s" : ""}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Búsqueda */}
          <div className="space-y-2">
            <Label htmlFor="busqueda">Buscar por Guía o Cliente</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
              <Input
                id="busqueda"
                placeholder="Número de guía, nombre..."
                value={busquedaTemporal}
                onChange={(e) => setBusquedaTemporal(e.target.value)}
                className="pl-9"
                aria-label="Buscar envíos por número de guía o nombre de cliente"
              />
              {busquedaTemporal && (
                <button
                  onClick={() => setBusquedaTemporal("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={filtros.estado || "all-states"}
              onValueChange={(value) =>
                setFiltros({ ...filtros, estado: value, page: 1 })
              }
            >
              <SelectTrigger
                id="estado"
                className="w-full"
                aria-label="Filtrar por estado de envío"
              >
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-states">Todos los estados</SelectItem>
                {estadosEnvio
                  ?.filter((estado) =>
                    ESTADOS_ENVIO_VALIDOS.includes(estado.value)
                  )
                  .map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sucursal Origen - Solo visible para SUPER_ADMIN */}
          {isSuperAdmin && (
            <div className="space-y-2">
              <Label htmlFor="sucursalOrigen">Sucursal Origen</Label>
              <Select
                value={filtros.sucursalOrigenId || "all-branches"}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, sucursalOrigenId: value, page: 1 })
                }
              >
                <SelectTrigger
                  id="sucursalOrigen"
                  className="w-full"
                  aria-label="Filtrar por sucursal de origen"
                >
                  <SelectValue placeholder="Todas las sucursales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-branches">
                    Todas las sucursales
                  </SelectItem>
                  {sucursales?.map((sucursal) => (
                    <SelectItem key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre} - {sucursal.provincia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Rango de Fechas */}
          <div className="space-y-2">
            <Label>
              Rango de Fechas
              {!fechaDesdeValida && (
                <span className="text-destructive text-xs ml-2">
                  (inválido)
                </span>
              )}
            </Label>
            <DatePickerWithRange
              date={filtros.fechaRango}
              setDate={(dateRange) =>
                setFiltros({
                  ...filtros,
                  fechaRango: dateRange,
                  fechaDesde: dateRange?.from
                    ? dateRange.from.toISOString().split("T")[0]
                    : "",
                  fechaHasta: dateRange?.to
                    ? dateRange.to.toISOString().split("T")[0]
                    : "",
                  page: 1,
                })
              }
              placeholder="Seleccionar rango"
              className="w-full"
              disabled={!fechaDesdeValida}
              aria-label="Filtrar por rango de fechas"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex items-end space-x-2 col-span-full md:col-span-2 lg:col-span-4">
            <Button
              variant="outline"
              onClick={handleLimpiarFiltros}
              disabled={filtrosActivos === 0}
              aria-label="Limpiar todos los filtros aplicados"
              className="flex items-center gap-2 bg-transparent"
            >
              <X className="h-4 w-4" />
              Limpiar Filtros
            </Button>

            {filtrosActivos > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {filtrosActivos} filtro{filtrosActivos > 1 ? "s" : ""} activo
                {filtrosActivos > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
