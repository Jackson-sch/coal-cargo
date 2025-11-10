
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp, Calendar } from "lucide-react";

export default function TendenciaIngresos({ 
  trend, 
  mesSeleccionado, 
  setMesSeleccionado,
  mesesDisponibles = [],
}) {
  const handleMesChange = (value) => {
    setMesSeleccionado(value);
  };

  // Obtener el label del mes seleccionado
  const mesLabel = mesesDisponibles.find((m) => m.value === mesSeleccionado)?.label || 
    (mesSeleccionado 
      ? new Date(mesSeleccionado + "-01").toLocaleString("es-PE", { month: "long", year: "numeric" })
      : "Mes actual");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Tendencia de Ingresos
            </CardTitle>
            <CardDescription>
              Evolución de ingresos del período seleccionado
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
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
                  <SelectItem value={mesSeleccionado}>
                    {mesLabel}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {trend?.ingresosPorMes?.length ? (
          <ChartContainer
            config={{ ingresos: { label: "Ingresos", color: "#10b981" } }}
            className="w-full h-[250px]"
          >
            <AreaChart
              data={trend.ingresosPorMes}
              margin={{ left: 12, right: 12, top: 8, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="mes" 
                tickLine={false} 
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={trend.ingresosPorMes.length > 15 ? "preserveStartEnd" : 0}
              />
              <ChartTooltip
                content={<ChartTooltipContent 
                  nameKey="ingresos"
                  labelFormatter={(value) => {
                    // Buscar el item completo para mostrar más información
                    const item = trend.ingresosPorMes.find((d) => d.mes === value);
                    return item ? `${value} - ${item.envios || 0} envíos` : value;
                  }}
                  formatter={(value) => [`S/ ${Number(value).toLocaleString("es-PE")}`, "Ingresos"]}
                />}
              />
              <Area
                type="monotone"
                dataKey="ingresos"
                stroke="var(--color-ingresos)"
                fill="var(--color-ingresos)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px]">
            <p className="text-sm text-muted-foreground">
              Sin datos para mostrar en este período.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
