import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";

export default function Distribucion({ estadosData, chartConfig }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" /> Distribución por Estado (mes)
        </CardTitle>
        <CardDescription>Proporción de envíos por estado</CardDescription>
      </CardHeader>
      <CardContent>
        {estadosData.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Sin datos para el período.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[320px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent labelKey="estado" nameKey="estado" />
                }
              />
              <Pie
                data={estadosData}
                dataKey="cantidad"
                nameKey="estado"
                innerRadius={60}
                strokeWidth={5}
              >
                {estadosData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={chartConfig[entry.estado]?.color}
                  />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="estado" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/3 [&>*]:justify-center"
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
