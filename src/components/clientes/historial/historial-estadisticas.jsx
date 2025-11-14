"use client";

import StatCard from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSoles } from "@/lib/utils/formatters";
import {
  Package,
  Calculator,
  CreditCard,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

export default function HistorialEstadisticas({ estadisticas }) {
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
      iconColor: "text-blue-600",
    },
    {
      title: "Cotizaciones",
      value: estadisticas.totalCotizaciones || 0,
      icon: Calculator,
      iconColor: "text-green-600",
    },
    {
      title: "Entregados",
      value: estadisticas.enviosEntregados || 0,
      icon: CheckCircle,
      iconColor: "text-emerald-600",
      description: `${porcentajeExito}% de éxito`,
    },
    {
      title: "Monto Total",
      value: formatSoles(estadisticas.montoTotal || 0),
      icon: CreditCard,
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          {...stat}
        />
      ))}
    </div>
  );
}
