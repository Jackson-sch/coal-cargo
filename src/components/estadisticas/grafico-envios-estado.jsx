"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { FileText, PieChartIcon, TrendingUp } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Button } from "../ui/button";
import Modal from "../ui/modal";
import { useState } from "react";

export default function GraficoEnviosEstado({ estadisticas, chartConfig }) {
  const [open, setOpen] = useState(false);
  const getEstadoLabel = (estado) => {
    return chartConfig[estado]?.label || estado.replace(/_/g, " ");
  };

  const totalEnvios =
    estadisticas?.enviosPorEstado?.reduce(
      (sum, item) => sum + item.cantidad,
      0
    ) || 0;
  const estadisticasResumen =
    estadisticas?.enviosPorEstado?.map((item) => ({
      ...item,
      porcentaje:
        totalEnvios > 0 ? ((item.cantidad / totalEnvios) * 100).toFixed(1) : 0,
      estadoLabel: getEstadoLabel(item.estado),
    })) || [];

  if (
    !estadisticas?.enviosPorEstado ||
    estadisticas.enviosPorEstado.length === 0
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Envíos por Estado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Envíos por Estado
        </CardTitle>
        <CardDescription>
          Distribución de {totalEnvios} envíos según su estado actual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {estadisticasResumen.slice(0, 4).map((item, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {item.estadoLabel}
                </span>
              </div>
              <p className="text-lg font-bold">{item.cantidad}</p>
              <p className="text-xs text-muted-foreground">
                {item.porcentaje}%
              </p>
            </div>
          ))}
        </div>

        <div className="w-full h-auto">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px] sm:max-h-[350px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, props) => {
                        const estado = props.payload.estado;
                        const label = getEstadoLabel(estado);
                        const porcentaje = (
                          (value / totalEnvios) *
                          100
                        ).toFixed(1);
                        return [`${value} envíos (${porcentaje}%)`, label];
                      }}
                    />
                  }
                />
                <Pie
                  data={estadisticas.enviosPorEstado}
                  dataKey="cantidad"
                  nameKey="estado"
                  innerRadius={60}
                  strokeWidth={2}
                  animationDuration={300}
                >
                  {estadisticas.enviosPorEstado.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <ChartLegend
                  content={
                    <ChartLegendContent
                      nameKey="estado"
                      formatter={(value) => getEstadoLabel(value)}
                    />
                  }
                  className="flex-wrap gap-2 justify-center pt-4"
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
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
          title="Distribución de Envíos por Estado"
          description="Distribución de envíos según su estado actual"
          open={open}
          onOpenChange={setOpen}
        >
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Desglose por Estado</h4>
            </div>
            <div className="space-y-2">
              {estadisticasResumen.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">
                      {item.estadoLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.cantidad}</span>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {item.porcentaje}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      </CardFooter>
    </Card>
  );
}
