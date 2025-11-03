import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
export default function HeaderEstadisticas({
  periodo,
  setPeriodo,
  fechaRango,
  setFechaRango,
  aplicarFiltros,
  limpiarFiltros,
  loading,
}) {
  const periodos = [
    { value: "semana", label: "Última Semana" },
    { value: "mes", label: "Último Mes" },
    { value: "trimestre", label: "Último Trimestre" },
    { value: "año", label: "Último Año" },
    { value: "personalizado", label: "Personalizado" },
  ];
  return (
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
          date={fechaRango}
          setDate={setFechaRango}
          placeholder="Seleccionar rango de fechas"
          className="w-full md:w-[300px]"
        />

        <div className="flex gap-2">
          <Button onClick={aplicarFiltros} disabled={loading} size="sm">
            {loading ? "Aplicando..." : "Aplicar"}
          </Button>
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
    </div>
  );
}
