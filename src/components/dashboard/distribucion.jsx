import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { BarChart3, Calendar, TrendingUp } from "lucide-react";
import { useMemo } from "react";

export default function Distribucion({
  estadosData,
  chartConfig,
  mesSeleccionado,
  setMesSeleccionado,
  mesesDisponibles = [],
}) {
  const handleMesChange = (value) => {
    setMesSeleccionado(value);
  };

  // Función para obtener el label legible del estado
  const getEstadoLabel = (estado) => {
    return chartConfig[estado]?.label || estado.replace(/_/g, " ");
  };

  // Obtener el label del mes seleccionado
  const mesLabel =
    mesesDisponibles.find((m) => m.value === mesSeleccionado)?.label ||
    (mesSeleccionado
      ? new Date(mesSeleccionado + "-01").toLocaleString("es-PE", {
          month: "long",
          year: "numeric",
        })
      : "Mes actual");

  const dominantState = useMemo(() => {
    if (!estadosData || estadosData.length === 0) return null;
    const total = estadosData.reduce((sum, item) => sum + item.cantidad, 0);
    const highest = estadosData.reduce((prev, current) =>
      prev.cantidad > current.cantidad ? prev : current
    );
    return {
      estado: highest.estado,
      estadoLabel: getEstadoLabel(highest.estado),
      cantidad: highest.cantidad,
      porcentaje: ((highest.cantidad / total) * 100).toFixed(1),
    };
  }, [estadosData, chartConfig]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Distribución por Estado
          </CardTitle>
          <CardDescription>Proporción de envíos por estado</CardDescription>
        </div>
        <div className="flex items-center gap-2 space-y-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={mesSeleccionado} onValueChange={handleMesChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar mes" />
            </SelectTrigger>
            <SelectContent>
              {mesesDisponibles.length > 0 ? (
                mesesDisponibles.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value}>
                    {mes.label}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value={mesSeleccionado}>{mesLabel}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {dominantState && (
          <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">
                Estado dominante: {dominantState.estadoLabel}
              </span>{" "}
              lidera con{" "}
              <span className="font-semibold text-foreground">
                {dominantState.porcentaje}%
              </span>
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {estadosData.length === 0 ? (
          <div className="text-xs sm:text-sm text-muted-foreground py-8 text-center">
            Sin datos para el período.
          </div>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[320px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelKey="estado"
                      nameKey="estado"
                      formatter={(value, name, props) => {
                        const total = estadosData.reduce(
                          (sum, item) => sum + item.cantidad,
                          0
                        );
                        const porcentaje = (
                          (props.payload.cantidad / total) *
                          100
                        ).toFixed(1);
                        return [
                          `${props.payload.cantidad} (${porcentaje}%) `,
                          getEstadoLabel(props.payload.estado),
                        ];
                      }}
                    />
                  }
                />
                <Pie
                  data={estadosData}
                  dataKey="cantidad"
                  nameKey="estado"
                  innerRadius={60}
                  strokeWidth={2}
                  outerRadius={90}
                >
                  {estadosData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={chartConfig[entry.estado]?.color}
                    />
                  ))}
                </Pie>
                <ChartLegend
                  content={
                    <ChartLegendContent
                      nameKey="estado"
                      formatter={(value) => getEstadoLabel(value)}
                    />
                  }
                  className="-translate-y-1 flex-wrap gap-2 *:justify-center text-xs sm:text-sm"
                />
              </PieChart>
            </ChartContainer>

            <div className="border-t pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {estadosData.map((item) => {
                  const total = estadosData.reduce(
                    (sum, i) => sum + i.cantidad,
                    0
                  );
                  const porcentaje = ((item.cantidad / total) * 100).toFixed(1);

                  return (
                    <div
                      key={item.estado}
                      className="p-3 sm:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: chartConfig[item.estado]?.color,
                          }}
                        />
                        <span className="text-sm sm:text-base font-medium truncate">
                          {getEstadoLabel(item.estado)}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 mt-1">
                        <div className="text-xl sm:text-2xl font-bold">
                          {item.cantidad}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ({porcentaje}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
