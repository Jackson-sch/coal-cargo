"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Users,
  Truck,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
} from "lucide-react";
import { formatSoles } from "@/lib/utils/formatters";
import HeaderEstadisticas from "@/components/estadisticas/header";
import SpinnerGeneral from "@/components/spinner-general";
import Resumen from "@/components/estadisticas/resumen";
import GraficoIngresosMes from "@/components/estadisticas/grafico-ingresos-mes";
import GraficoEnviosEstado from "@/components/estadisticas/grafico-envios-estado";
import GraficoTendenciaEnvios from "@/components/estadisticas/grafico-tendencia-envios";
import GraficoTendenciaIngresos from "@/components/estadisticas/grafico-tendencia-ingresos";
import GraficoTendenciaIngresosCostos from "@/components/estadisticas/grafico-tendencia-ingresos-costos";
import TopClientes from "@/components/estadisticas/top-clientes";
import RutasPopulares from "@/components/estadisticas/rutas-populares";

export default function EstadisticasPage() {
  const [loading, setLoading] = useState(false);
  const [fechaRango, setFechaRango] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [periodo, setPeriodo] = useState("mes");
  // Estado para estadísticas reales;
  const [estadisticas, setEstadisticas] = useState({
    resumen: {
      totalEnvios: 0,
      ingresosTotales: 0,
      clientesActivos: 0,
      enviosEnTransito: 0,
    },
    enviosPorEstado: [],
    ingresosPorMes: [],
    topClientes: [],
    rutasPopulares: [],
  });

  // Configuración de colores para los gráficos
  const chartConfig = {
    // Claves que coinciden con los valores reales de "estado" para que el ChartLegend muestre texto
    ENTREGADO: { label: "Entregado", color: "#22c55e" },
    EN_TRANSITO: { label: "En Tránsito", color: "#3b82f6" },
    EN_REPARTO: { label: "En Reparto", color: "#3b82f6" },
    EN_BODEGA: { label: "En bodega", color: "#6b7280" },
    PENDIENTE: { label: "Pendiente", color: "#f59e0b" },
    REGISTRADO: { label: "Registrado", color: "#f59e0b" },
    ANULADO: { label: "Anulado", color: "#ef4444" },
    DEVUELTO: { label: "Devuelto", color: "#ef4444" },
    ingresos: {
      label: "Ingresos",
      color: "#8b5cf6",
    },
    envios: {
      label: "Envíos",
      color: "#06b6d4",
    },
  };

  useEffect(() => {
    cargarEstadisticas();
  }, [fechaRango, periodo]);

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        periodo,
        ...(fechaRango?.from
          ? { fechaDesde: fechaRango.from.toISOString() }
          : {}),
        ...(fechaRango?.to ? { fechaHasta: fechaRango.to.toISOString() } : {}),
      });
      const res = await fetch(`/api/estadisticas?${params.toString()}`);
      const result = await res.json();
      if (result?.success) {
        const estadoColor = (estado) => {
          switch (estado) {
            case "ENTREGADO":
              return "#22c55e";
            case "EN_TRANSITO":
            case "EN_REPARTO":
              return "#3b82f6";
            case "EN_BODEGA":
              return "#6b7280";
            case "PENDIENTE":
            case "REGISTRADO":
              return "#f59e0b";
            case "ANULADO":
            case "DEVUELTO":
              return "#ef4444";
            default:
              return "#6b7280";
          }
        };
        setEstadisticas({
          ...result.data,
          enviosPorEstado: result.data.enviosPorEstado.map((e) => ({
            ...e,
            color: estadoColor(e.estado),
          })),
        });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Función para aplicar filtros;
  const aplicarFiltros = () => {
    setLoading(true);

    // Simular llamada a API con filtros;
    setTimeout(() => {
      // Aquí normalmente harías una llamada a la API con los filtros aplicados// Por ahora mantenemos los datos mock;
      setLoading(false);
    }, 1000);
  };

  // Función para limpiar filtros;
  const limpiarFiltros = () => {
    setFechaRango({ from: null, to: null });
    setPeriodo("mes");
    aplicarFiltros();
  };

  // Aplicar filtros cuando cambien;
  useEffect(() => {
    aplicarFiltros();
  }, [fechaRango, periodo]);

  if (loading) {
    return <SpinnerGeneral text="Cargando estadísticas generales..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <HeaderEstadisticas
        periodo={periodo}
        setPeriodo={setPeriodo}
        fechaRango={fechaRango}
        setFechaRango={setFechaRango}
        aplicarFiltros={aplicarFiltros}
        limpiarFiltros={limpiarFiltros}
        loading={loading}
      />

      {/* Tarjetas de Resumen */}
      <Resumen estadisticas={estadisticas} />

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Ingresos por Mes */}
        <GraficoIngresosMes
          estadisticas={estadisticas}
          chartConfig={chartConfig}
        />

        {/* Gráfico de Envíos por Estado */}
        <GraficoEnviosEstado
          estadisticas={estadisticas}
          chartConfig={chartConfig}
        />
      </div>

      {/* Gráficos de Tendencias */}
      <div className="grid gap-6 md:grid-cols-3 items-stretch">
        {/* Tendencia de Envíos */}
        <GraficoTendenciaEnvios
          estadisticas={estadisticas}
          chartConfig={chartConfig}
        />

        {/* Tendencia de Ingresos */}
        <GraficoTendenciaIngresos
          estadisticas={estadisticas}
          chartConfig={chartConfig}
        />

        {/* Gráfico Financiero Adicional - Comparación de Ingresos vs Costos */}
        <GraficoTendenciaIngresosCostos
          estadisticas={estadisticas}
          chartConfig={chartConfig}
        />
      </div>

      {/* Tablas de Datos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Clientes */}
        <TopClientes estadisticas={estadisticas} />

        {/* Rutas Populares */}
        <RutasPopulares estadisticas={estadisticas} />
      </div>
    </div>
  );
}
