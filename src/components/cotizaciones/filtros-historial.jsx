import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";

export default function FiltrosHistorial({ filtros, handleFiltroChange }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" /> Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={filtros.estado}
              onValueChange={(value) => handleFiltroChange("estado", value)}
            >
              <SelectTrigger className="w-full sm:w-60">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="APROBADA">Aprobada</SelectItem>
                <SelectItem value="RECHAZADA">Rechazada</SelectItem>
                <SelectItem value="CONVERTIDA_ENVIO">
                  Convertida a Envío
                </SelectItem>
                <SelectItem value="EXPIRADA">Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Rango de Fechas</Label>
            <DatePickerWithRange
              date={filtros.fechaRango}
              setDate={(dateRange) =>
                handleFiltroChange("fechaRango", dateRange)
              }
              placeholder="Seleccionar rango de fechas"
              className="w-full sm:w-60"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => {
                setFiltros({
                  estado: "TODOS",
                  fechaRango: { from: null, to: null },
                  page: 1,
                  limit: 10,
                });
              }}
              variant="outline"
              className="w-full"
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
