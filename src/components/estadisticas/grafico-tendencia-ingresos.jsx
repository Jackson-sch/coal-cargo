"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { formatSoles } from "@/lib/utils/formatters";

export default function GraficoTendenciaIngresos({
  estadisticas,
  chartConfig,
}) {
  const data = estadisticas.ingresosPorMes || [];
  const ultimoMes = data[data.length - 1];
  const mesAnterior = data[data.length - 2];

  const variacion = mesAnterior
    ? ((ultimoMes?.ingresos - mesAnterior?.ingresos) / mesAnterior?.ingresos) *
      100
    : 0;

  const esPositivo = variacion >= 0;
  const iconoVariacion = esPositivo ? (
    <TrendingUp className="h-4 w-4" />
  ) : (
    <TrendingDown className="h-4 w-4" />
  );
  const colorVariacion = esPositivo
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle>Tendencia de Ingresos</CardTitle>
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              esPositivo
                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            {iconoVariacion}
            <span>
              {variacion >= 0 ? "+" : ""}
              {variacion.toFixed(1)}%
            </span>
          </div>
        </div>
        <CardDescription>
          Evolución mensual del monto de ingresos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                width={56}
                tickFormatter={(v) => formatSoles(v)}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="flex flex-1 justify-between items-center leading-none gap-4">
                        <span className="text-muted-foreground text-sm">
                          {name}
                        </span>
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
                isAnimationActive={true}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
