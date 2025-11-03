import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { formatSoles } from "@/lib/utils/formatters";

export default function GraficoTendenciaIngresosCostos({
  estadisticas,
  chartConfig,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Análisis Financiero
        </CardTitle>
        <CardDescription>
          Comparación de ingresos vs costos operativos mensuales
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            ...chartConfig,
            costos: { label: "Costos", color: "#ef4444" },
          }}
        >
          <AreaChart
            accessibilityLayer
            data={estadisticas.ingresosPorMes.map((item) => ({
              ...item,
              costos: Math.round(item.ingresos * 0.7),
            }))}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="mes"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <defs>
              <linearGradient id="fillIngresosFin" x1="0" y1="0" x2="0" y2="1">
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
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => (
                    <div className="flex flex-1 justify-between items-center leading-none">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {formatSoles(value)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area
              dataKey="ingresos"
              type="monotone"
              fill="url(#fillIngresosFin)"
              fillOpacity={0.4}
              stroke="var(--color-ingresos)"
              strokeWidth={1.6}
              dot={false}
            />
            <Area
              dataKey="costos"
              type="monotone"
              fill="url(#fillCostosFin)"
              fillOpacity={0.35}
              stroke="var(--color-costos)"
              strokeWidth={1.6}
              dot={false}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
