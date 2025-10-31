"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  DollarSign,
  Calendar,
} from "lucide-react";
const estadoLabels = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  CONVERTIDA_ENVIO: "Convertida a Envío",
  EXPIRADA: "Expirada",
};
const tipoServicioLabels = {
  NORMAL: "Normal",
  EXPRESS: "Express",
  OVERNIGHT: "Overnight",
  ECONOMICO: "Económico",
};
export default function EstadisticasCotizaciones({
  cotizacionesRecientes = [],
}) {
  const [estadisticas, setEstadisticas] = useState({
    hoy: 0,
    semana: 0,
    mes: 0,
    precioPromedio: 0,
    conversionRate: 0,
    tiempoPromedioEntrega: 0,
  });
  useEffect(() => {
    calcularEstadisticas();
  }, [cotizacionesRecientes]);
  const calcularEstadisticas = () => {
    if (cotizacionesRecientes.length === 0) {
      return;
    }

    const ahora = new Date();
    const hoyInicio = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate()
    );
    const semanaAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const mesAtras = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
    const cotizacionesHoy = cotizacionesRecientes.filter(
      (c) => new Date(c.createdAt) >= hoyInicio
    );
    const cotizacionesSemana = cotizacionesRecientes.filter(
      (c) => new Date(c.createdAt) >= semanaAtras
    );
    const cotizacionesMes = cotizacionesRecientes.filter(
      (c) => new Date(c.createdAt) >= mesAtras
    );
    const precioPromedio =
      cotizacionesRecientes.length > 0
        ? cotizacionesRecientes.reduce((sum, c) => sum + c.precioFinal, 0) /
          cotizacionesRecientes.length
        : 0;
    const convertidas = cotizacionesRecientes.filter(
      (c) => c.estado === "CONVERTIDA_ENVIO"
    ).length;
    const conversionRate =
      cotizacionesRecientes.length > 0
        ? (convertidas / cotizacionesRecientes.length) * 100
        : 0;
    setEstadisticas({
      hoy: cotizacionesHoy.length,
      semana: cotizacionesSemana.length,
      mes: cotizacionesMes.length,
      precioPromedio,
      conversionRate,
      tiempoPromedioEntrega: 2, // Placeholde r
    });
  };
  const estadisticasCards = [
    {
      title: "Cotizaciones Hoy",
      value: estadisticas.hoy,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Esta Semana",
      value: estadisticas.semana,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Este Mes",
      value: estadisticas.mes,
      icon: Calculator,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Precio Promedio",
      value:
        estadisticas.precioPromedio > 0
          ? new Intl.NumberFormat("es-PE", {
              style: "currency",
              currency: "PEN",
            }).format(estadisticas.precioPromedio)
          : "S/ 0.00",
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Tasa de Conversión",
      value: `${estadisticas.conversionRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Tiempo Promedio",
      value: `${estadisticas.tiempoPromedioEntrega} días`,
      icon: Clock,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];
  return (
    <div className="space-y-6">
      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {estadisticasCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Distribución por Estado */}
      {cotizacionesRecientes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(estadoLabels).map(([estado, label]) => {
                const count = cotizacionesRecientes.filter(
                  (c) => c.estado === estado
                ).length;
                const percentage =
                  cotizacionesRecientes.length > 0
                    ? (count / cotizacionesRecientes.length) * 100
                    : 0;
                return (
                  <div
                    key={estado}
                    className="text-center p-4 border rounded-lg"
                  >
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                    <Badge variant="outline" className="mt-1">
                      {percentage.toFixed(1)}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Servicios Más Solicitados */}
      {cotizacionesRecientes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Servicios Más Solicitados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(tipoServicioLabels).map(([servicio, label]) => {
                const count = cotizacionesRecientes.filter(
                  (c) => c.tipoServicio === servicio
                ).length;
                const percentage =
                  cotizacionesRecientes.length > 0
                    ? (count / cotizacionesRecientes.length) * 100
                    : 0;
                return (
                  <div
                    key={servicio}
                    className="text-center p-4 border rounded-lg"
                  >
                    <div className="text-xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                    <Badge variant="outline" className="mt-1">
                      {percentage.toFixed(1)}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
