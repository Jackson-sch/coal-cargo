import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter } from "lucide-react";
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

export default function FiltrosEnvios({
  filtros,
  setFiltros,
  estadosEnvio,
  sucursales,
  clientes,
}) {
  console.log(clientes);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" /> Filtros de Búsqueda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="numeroGuia">Número de Guía</Label>
            <Input
              id="numeroGuia"
              placeholder="CC241002001"
              value={filtros.numeroGuia}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  numeroGuia: e.target.value,
                  page: 1,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={filtros.estado}
              onValueChange={(value) =>
                setFiltros({ ...filtros, estado: value, page: 1 })
              }
            >
              <SelectTrigger className="w-full sm:w-60">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-states">Todos los estados</SelectItem>
                {estadosEnvio.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sucursalOrigen">Sucursal Origen</Label>
            <Select
              value={filtros.sucursalOrigenId}
              onValueChange={(value) =>
                setFiltros({ ...filtros, sucursalOrigenId: value, page: 1 })
              }
            >
              <SelectTrigger className="w-full sm:w-60">
                <SelectValue placeholder="Todas las sucursales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-branches">
                  Todas las sucursales
                </SelectItem>
                {sucursales.map((sucursal) => (
                  <SelectItem key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre} - {sucursal.provincia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Select
              value={filtros.clienteId}
              onValueChange={(value) =>
                setFiltros({ ...filtros, clienteId: value, page: 1 })
              }
            >
              <SelectTrigger className="w-full sm:w-60">
                <SelectValue placeholder="Todos los clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-clients">Todos los clientes</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    <p className="capitalize">
                      {cliente.nombre} {cliente.apellidos}
                    </p>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Rango de Fechas</Label>
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
              placeholder="Seleccionar rango de fechas"
              className="w-full"
            />
          </div>
          <div className="flex items-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setFiltros({
                  estado: "all-states",
                  sucursalOrigenId: "all-branches",
                  sucursalDestinoId: "all-branches",
                  clienteId: "all-clients",
                  numeroGuia: "",
                  fechaRango: { from: null, to: null },
                  page: 1,
                });
              }}
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
