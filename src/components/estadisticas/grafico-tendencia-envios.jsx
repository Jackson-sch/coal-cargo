import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export default function GraficoTendenciaEnvios({ estadisticas, chartConfig }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Tendencia de Envíos
        </CardTitle>
        <CardDescription>
          Evolución mensual de la cantidad de envíos
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
            <YAxis width={36} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex flex-1 justify-between items-center leading-none">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {value?.toLocaleString?.() || value}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <defs>
              <linearGradient id="fillEnvios" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-envios)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-envios)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="envios"
              type="natural"
              fill="url(#fillEnvios)"
              fillOpacity={0.4}
              stroke="var(--color-envios)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
