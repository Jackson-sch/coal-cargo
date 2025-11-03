import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatSoles } from "@/lib/utils/formatters";

export default function GraficoIngresosMes({ estadisticas, chartConfig }) {
  return (
    <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Ingresos por Mes
            </CardTitle>
            <CardDescription>
              Evolución de ingresos y cantidad de envíos mensuales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart
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
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v) => formatSoles(v)}
                  width={60}
                />
                <YAxis yAxisId="right" orientation="right" width={40} />
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
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  yAxisId="left"
                  dataKey="ingresos"
                  name="Ingresos"
                  fill="var(--color-ingresos)"
                  radius={4}
                />
                <Bar
                  yAxisId="right"
                  dataKey="envios"
                  name="Envíos"
                  fill="var(--color-envios)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
  );
}