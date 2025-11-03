import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatSoles } from "@/lib/utils/formatters";

export default function GraficoTendenciaIngresos({
  estadisticas,
  chartConfig,
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Tendencia de Ingresos
        </CardTitle>
        <CardDescription>
          Evolución mensual del monto de ingresos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={estadisticas.ingresosPorMes || []}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="mes"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis width={56} tickFormatter={(v) => formatSoles(v)} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => (
                    <div className="flex flex-1 justify-between items-center leading-none">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {item?.dataKey === "ingresos"
                          ? formatSoles(value)
                          : value?.toLocaleString?.() || value}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <defs>
              <linearGradient id="fillIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-ingresos)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-ingresos)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="ingresos"
              type="natural"
              fill="url(#fillIngresos)"
              fillOpacity={0.4}
              stroke="var(--color-ingresos)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
