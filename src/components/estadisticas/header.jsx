import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";

export default function HeaderEstadisticas({
  periodo,
  setPeriodo,
  fechaRango,
  setFechaRango,
  limpiarFiltros,
  loading,
  session,
  sucursales = [],
  sucursalId,
  setSucursalId,
  filtroTipo,
  setFiltroTipo,
  datePickerKey = 0,
}) {
  const periodos = [
    { value: "semana", label: "Última Semana" },
    { value: "mes", label: "Último Mes" },
    { value: "trimestre", label: "Último Trimestre" },
    { value: "año", label: "Último Año" },
    { value: "personalizado", label: "Personalizado" },
  ];

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
          <p className="text-muted-foreground">
            Análisis detallado del rendimiento de tu negocio
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DatePickerWithRange
            key={datePickerKey}
            date={fechaRango}
            setDate={setFechaRango}
            placeholder="Seleccionar rango de fechas"
            className="w-full md:w-[300px]"
          />

          <Button
            variant="outline"
            onClick={limpiarFiltros}
            disabled={loading}
            size="sm"
          >
            Limpiar
          </Button>
        </div>
      </div>

      {/* Filtros de sucursal para SUPER_ADMIN */}
      {isSuperAdmin && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sucursal</span>
            <Select
              value={sucursalId}
              onValueChange={(val) => {
                setSucursalId(val);
              }}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Todas las sucursales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                {sucursales.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {sucursalId && sucursalId !== "ALL" && (
            <Select
              value={filtroTipo}
              onValueChange={(val) => {
                setFiltroTipo(val);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ambos">Desde y hacia</SelectItem>
                <SelectItem value="origen">Solo origen</SelectItem>
                <SelectItem value="destino">Solo destino</SelectItem>
              </SelectContent>
            </Select>
          )}
          {sucursalId && sucursalId !== "ALL" && (
            <p className="text-xs text-muted-foreground">
              {filtroTipo === "origen" && "Mostrando: envíos registrados en esta sucursal"}
              {filtroTipo === "destino" && "Mostrando: envíos que van a esta sucursal"}
              {filtroTipo === "ambos" && "Mostrando: envíos desde y hacia esta sucursal"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
