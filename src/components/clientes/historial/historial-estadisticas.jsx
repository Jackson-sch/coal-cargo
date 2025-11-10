"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package,
  Calculator,
  CreditCard,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

export default function HistorialEstadisticas({ estadisticas }) {
  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(precio);
  };

  const porcentajeExito =
    estadisticas.totalEnvios > 0
      ? Math.round(
          (estadisticas.enviosEntregados / estadisticas.totalEnvios) * 100
        )
      : 0;

  const stats = [
    {
      title: "Total Envíos",
      value: estadisticas.totalEnvios || 0,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Cotizaciones",
      value: estadisticas.totalCotizaciones || 0,
      icon: Calculator,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Entregados",
      value: estadisticas.enviosEntregados || 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      subtitle: `${porcentajeExito}% de éxito`,
    },
    {
      title: "Monto Total",
      value: formatearPrecio(estadisticas.montoTotal || 0),
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="border-border/50 hover:shadow-md transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}
              >
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

