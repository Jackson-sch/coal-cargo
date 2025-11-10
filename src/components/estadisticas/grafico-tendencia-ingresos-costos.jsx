import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, TrendingUp } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  ResponsiveContainer,
} from "recharts";
import { formatSoles } from "@/lib/utils/formatters";

export default function GraficoTendenciaIngresosCostos({
  estadisticas,
  chartConfig,
}) {
  const data = estadisticas.ingresosPorMes.map((item) => ({
    ...item,
    costos: Math.round(item.ingresos * 0.7),
  }));

  const margenPromedio =
    data.reduce((sum, item) => {
      const margen = ((item.ingresos - item.costos) / item.ingresos) * 100;
      return sum + margen;
    }, 0) / data.length;

  const ultimoMargen =
    data.length > 0
      ? ((data[data.length - 1].ingresos - data[data.length - 1].costos) /
          data[data.length - 1].ingresos) *
        100
      : 0;

  const variacion =
    data.length > 1
      ? ultimoMargen -
        ((data[data.length - 2].ingresos - data[data.length - 2].costos) /
          data[data.length - 2].ingresos) *
          100
      : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Análisis Financiero
            </CardTitle>
            <CardDescription>
              Comparación de ingresos vs costos operativos mensuales
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Margen Bruto</div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold">
                {margenPromedio.toFixed(1)}%
              </span>
              <div
                className={`flex items-center gap-0.5 text-xs font-medium ${
                  variacion >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                <TrendingUp className="h-3 w-3" />
                {variacion >= 0 ? "+" : ""}
                {variacion.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            ...chartConfig,
            costos: { label: "Costos", color: "#ef4444" },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{ left: 0, right: 0, top: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient
                  id="fillIngresosFin"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-ingresos)"
                    stopOpacity={0.85}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-ingresos)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillCostosFin" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-costos)"
                    stopOpacity={0.7}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-costos)"
                    stopOpacity={0.08}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => {
                      let label = name;
                      if (name === "ingresos") label = "Ingresos";
                      if (name === "costos") label = "Costos";

                      const margen =
                        item.payload?.ingresos && item.payload?.costos
                          ? (
                              ((item.payload.ingresos - item.payload.costos) /
                                item.payload.ingresos) *
                              100
                            ).toFixed(1)
                          : 0;

                      return (
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-muted-foreground">
                              {label}
                            </span>
                            <span className="text-foreground font-mono font-medium">
                              {formatSoles(value)}
                            </span>
                          </div>
                          {name === "costos" && (
                            <div className="border-t pt-1 mt-1 text-xs">
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                  Margen:
                                </span>
                                <span className="font-medium text-primary">
                                  {margen}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                }
              />
              <Area
                dataKey="ingresos"
                type="monotone"
                fill="url(#fillIngresosFin)"
                fillOpacity={0.4}
                stroke="var(--color-ingresos)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
              />
              <Area
                dataKey="costos"
                type="monotone"
                fill="url(#fillCostosFin)"
                fillOpacity={0.35}
                stroke="var(--color-costos)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
