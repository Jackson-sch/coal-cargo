"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HistorialFiltros({
  filtros,
  onFiltroChange,
  onClearFilters,
  isPending,
}) {
  const hasActiveFilters =
    filtros.tipo !== "todos" ||
    filtros.estado !== "todos" ||
    filtros.busqueda ||
    filtros.fechaRango?.from ||
    filtros.fechaRango?.to;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-1">
            <label className="text-xs font-medium mb-2 block">
              Tipo de Registro
            </label>
            <Select
              value={filtros.tipo}
              onValueChange={(value) => onFiltroChange("tipo", value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="envios">Envíos</SelectItem>
                <SelectItem value="cotizaciones">Cotizaciones</SelectItem>
                <SelectItem value="pagos">Pagos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-1">
            <label className="text-xs font-medium mb-2 block">Estado</label>
            <Select
              value={filtros.estado || "todos"}
              onValueChange={(value) =>
                onFiltroChange("estado", value === "todos" ? "" : value)
              }
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {/* Estados de envíos */}
                {(filtros.tipo === "todos" || filtros.tipo === "envios") && (
                  <>
                    <SelectItem value="REGISTRADO">Registrado</SelectItem>
                    <SelectItem value="EN_BODEGA">En Bodega</SelectItem>
                    <SelectItem value="EN_TRANSITO">En Tránsito</SelectItem>
                    <SelectItem value="EN_AGENCIA_ORIGEN">
                      En Agencia Origen
                    </SelectItem>
                    <SelectItem value="EN_AGENCIA_DESTINO">
                      En Agencia Destino
                    </SelectItem>
                    <SelectItem value="EN_REPARTO">En Reparto</SelectItem>
                    <SelectItem value="ENTREGADO">Entregado</SelectItem>
                    <SelectItem value="DEVUELTO">Devuelto</SelectItem>
                    <SelectItem value="ANULADO">Anulado</SelectItem>
                  </>
                )}
                {/* Estados de cotizaciones */}
                {(filtros.tipo === "todos" || filtros.tipo === "cotizaciones") && (
                  <>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="APROBADA">Aprobada</SelectItem>
                    <SelectItem value="RECHAZADA">Rechazada</SelectItem>
                    <SelectItem value="CONVERTIDA_ENVIO">
                      Convertida en Envío
                    </SelectItem>
                    <SelectItem value="EXPIRADA">Expirada</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs font-medium mb-2 block">
              Rango de Fechas
            </label>
            <DatePickerWithRange
              date={filtros.fechaRango}
              setDate={(dateRange) => onFiltroChange("fechaRango", dateRange)}
              placeholder="Seleccionar rango de fechas"
              className="w-full"
              disabled={isPending}
            />
          </div>

          <div className="lg:col-span-1">
            <label className="text-xs font-medium mb-2 block">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Guía, descripción..."
                value={filtros.busqueda}
                onChange={(e) => onFiltroChange("busqueda", e.target.value)}
                className="pl-9"
                disabled={isPending}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

