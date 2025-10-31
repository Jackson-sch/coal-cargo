
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";

export default function TendenciaIngresos({ trend }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> Tendencia de Ingresos (mes)
        </CardTitle>
        <CardDescription>
          Evolución de ingresos del período actual
        </CardDescription>
      </CardHeader>
      <CardContent>
        {trend?.ingresosPorMes?.length ? (
          <ChartContainer
            config={{ ingresos: { label: "Ingresos", color: "#10b981" } }}
            className="w-full h-[180px]"
          >
            <AreaChart
              data={trend.ingresosPorMes}
              margin={{ left: 12, right: 12, top: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} />
              <ChartTooltip
                content={<ChartTooltipContent nameKey="ingresos" />}
              />
              <Area
                type="monotone"
                dataKey="ingresos"
                stroke="var(--color-ingresos)"
                fill="var(--color-ingresos)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sin datos para mostrar.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
