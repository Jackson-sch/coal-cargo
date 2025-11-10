"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Wallet,
  Calendar,
  FileText,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { formatSoles } from "@/lib/utils/formatters";
import { Button } from "../ui/button";
import Modal from "../ui/modal";
import { useState } from "react";

export default function GraficoIngresosMes({ estadisticas, chartConfig }) {
  const [open, setOpen] = useState(false);
  const data = estadisticas.ingresosPorMes || [];

  const totalIngresos = data.reduce(
    (sum, item) => sum + (item.ingresos || 0),
    0
  );
  const totalEnvios = data.reduce((sum, item) => sum + (item.envios || 0), 0);
  const promedioMensual = data.length > 0 ? totalIngresos / data.length : 0;
  const mesMaximoIngresos =
    data.length > 0
      ? data.reduce((prev, current) =>
          prev.ingresos > current.ingresos ? prev : current
        )
      : null;

  const variacionMensual =
    data.length >= 2
      ? (
          ((data[data.length - 1].ingresos - data[data.length - 2].ingresos) /
            data[data.length - 2].ingresos) *
          100
        ).toFixed(1)
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Evolución de Ingresos y Envíos
        </CardTitle>
        <CardDescription>
          Distribución mensual de ingresos y cantidad de envíos procesados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
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
                yAxisId="left"
                tickFormatter={(v) => formatSoles(v)}
                width={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                width={50}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">
                          {item?.payload?.mes}
                        </span>
                        <div className="flex flex-1 justify-between items-center leading-none gap-2">
                          <span className="text-xs text-muted-foreground">
                            {name}
                          </span>
                          <span className="text-sm font-mono font-medium">
                            {item?.dataKey === "ingresos"
                              ? formatSoles(value)
                              : value?.toLocaleString?.() || value}
                          </span>
                        </div>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend
                content={<ChartLegendContent />}
                wrapperStyle={{ paddingTop: "16px" }}
              />
              <Bar
                yAxisId="left"
                dataKey="ingresos"
                name="Ingresos"
                fill="var(--color-ingresos)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="envios"
                name="Envíos"
                fill="var(--color-envios)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          className="w-full"
        >
          <FileText className="h-4 w-4" />
          Ver más detalles
        </Button>
        <Modal
          title="Evolución de Ingresos y Envíos"
          description="Distribución mensual de ingresos y cantidad de envíos procesados"
          open={open}
          onOpenChange={setOpen}
        >
          {data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Desglose Mensual Detallado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 text-muted-foreground">
                          Mes
                        </th>
                        <th className="text-right py-2 px-2 text-muted-foreground">
                          Ingresos
                        </th>
                        <th className="text-right py-2 px-2 text-muted-foreground">
                          Envíos
                        </th>
                        <th className="text-right py-2 px-2 text-muted-foreground">
                          Promedio/Envío
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-2 px-2 font-medium">{row.mes}</td>
                          <td className="text-right py-2 px-2">
                            {formatSoles(row.ingresos)}
                          </td>
                          <td className="text-right py-2 px-2">
                            {row.envios.toLocaleString()}
                          </td>
                          <td className="text-right py-2 px-2 text-muted-foreground">
                            {formatSoles(
                              row.envios > 0 ? row.ingresos / row.envios : 0
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </Modal>
      </CardFooter>
    </Card>
  );
}
