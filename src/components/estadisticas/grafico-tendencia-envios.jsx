"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, TrendingUp } from "lucide-react";
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

export default function GraficoTendenciaEnvios({ estadisticas, chartConfig }) {
  const data = estadisticas?.ingresosPorMes || [];

  const primerMes = data?.[0]?.envios || 0;
  const ultimoMes = data?.[data.length - 1]?.envios || 0;
  const cambioPorc =
    primerMes > 0
      ? (((ultimoMes - primerMes) / primerMes) * 100).toFixed(1)
      : 0;
  const tendencia = ultimoMes >= primerMes ? "up" : "down";

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Tendencia de Envíos
            </CardTitle>
            <CardDescription>
              Evolución mensual de la cantidad de envíos
            </CardDescription>
          </div>
          <div
            className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-md ${
              tendencia === "up"
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : "bg-red-500/10 text-red-700 dark:text-red-400"
            }`}
          >
            <TrendingUp
              className={`h-4 w-4 ${tendencia === "down" ? "rotate-180" : ""}`}
            />
            <span>{Math.abs(cambioPorc)}%</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
            >
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

              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                width={30}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />

              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.2 }}
                content={
                  <ChartTooltipContent
                    className="rounded-lg shadow-lg"
                    formatter={(value) => (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground text-xs">
                          Envíos:
                        </span>
                        <span className="text-foreground font-mono font-bold text-sm">
                          {value?.toLocaleString?.() || value}
                        </span>
                      </div>
                    )}
                  />
                }
              />

              <Area
                dataKey="envios"
                type="monotone"
                fill="url(#fillEnvios)"
                stroke="var(--color-envios)"
                strokeWidth={2}
                isAnimationActive={true}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {data.length > 0 && (
          <div className="grid grid-cols-3 gap-3 text-xs border-t pt-3">
            <div className="text-center">
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold text-foreground">
                {data
                  .reduce((sum, m) => sum + (m.envios || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Promedio</p>
              <p className="font-semibold text-foreground">
                {Math.round(
                  data.reduce((sum, m) => sum + (m.envios || 0), 0) /
                    data.length
                ).toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Máximo</p>
              <p className="font-semibold text-foreground">
                {Math.max(...data.map((m) => m.envios || 0)).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
