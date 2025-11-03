import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChartIcon } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

export default function GraficoEnviosEstado({ estadisticas, chartConfig }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Envíos por Estado
        </CardTitle>
        <CardDescription>
          Distribución de envíos según su estado actual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent labelKey="estado" nameKey="estado" />
              }
            />
            <Pie
              data={estadisticas.enviosPorEstado || []}
              dataKey="cantidad"
              nameKey="estado"
              innerRadius={60}
              strokeWidth={5}
            >
              {estadisticas.enviosPorEstado?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="estado" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
