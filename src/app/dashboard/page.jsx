"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Package, CheckCircle, AlertTriangle, Truck } from "lucide-react";
import { toast } from "sonner";
import {
  getDashboardKpis,
  getEstadisticasDashboard,
} from "@/lib/actions/dashboard";
import { getSucursales } from "@/lib/actions/sucursales";
import Recientes from "@/components/dashboard/recientes";
import Distribucion from "@/components/dashboard/distribucion";
import AccionesRapidas from "@/components/dashboard/acciones-rapidas";
import AlertasNotificaciones from "@/components/dashboard/alertas-notificaciones";
import TendenciaIngresos from "@/components/dashboard/tendencia-ingresos";
import ResumenMes from "@/components/dashboard/resumen-mes";
import EstadoSistema from "@/components/dashboard/estado-sistema";
import StatCard from "@/components/dashboard/stat-card";
import HeaderDashboard from "@/components/dashboard/header-dashboard";
import SpinnerGeneral from "@/components/spinner-general";
import { palette } from "@/lib/utils/palette";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sucursales, setSucursales] = useState([]);
  const [sucursalId, setSucursalId] = useState("ALL"); // "ALL" = toda s
  const [trend, setTrend] = useState(null);

  useEffect(() => {
    // Cuando esté lista la sesión, cargar dato s
    if (session) {
      if (session?.user?.role === "SUPER_ADMIN") {
        cargarSucursales();
      }
      fetchKpis();
      fetchTrend();
    }
  }, [session]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchKpis();
      fetchTrend();
    }, 90000);
    return () => clearInterval(id);
  }, []);

  const cargarSucursales = async () => {
    try {
      const res = await getSucursales();
      if (res?.success) setSucursales(res.data || []);
    } catch (e) {}
  };

  const fetchKpis = async () => {
    try {
      setLoading(true);
      const result = await getDashboardKpis({
        sucursalId:
          session?.user?.role === "SUPER_ADMIN" &&
          sucursalId &&
          sucursalId !== "ALL"
            ? sucursalId
            : undefined,
      });
      if (result.success) {
        setKpis(result.data);
      } else {
        toast.error(result.error || "Error al cargar estadísticas");
      }
    } catch (error) {
      toast.error("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrend = async () => {
    try {
      const res = await getEstadisticasDashboard({
        periodo: "mes",
        sucursalId:
          session?.user?.role === "SUPER_ADMIN" &&
          sucursalId &&
          sucursalId !== "ALL"
            ? sucursalId
            : undefined,
      });
      if (res?.success) setTrend(res.data);
    } catch (e) {}
  };

  const recientes = kpis?.enviosRecientes || [];

  const estadosData = Object.entries(kpis?.estadisticasPorEstado || {}).map(
    ([estado, cantidad]) => ({ estado, cantidad })
  );

  const chartConfig = estadosData.reduce((acc, item, idx) => {
    acc[item.estado] = {
      label: item.estado.replace(/_/g, " "),
      color: palette[idx % palette.length],
    };
    return acc;
  }, {});

  if (loading) {
    return <SpinnerGeneral text="Cargando estadísticas..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <HeaderDashboard
        session={session}
        sucursales={sucursales}
        sucursalId={sucursalId}
        setSucursalId={setSucursalId}
        fetchKpis={fetchKpis}
        fetchTrend={fetchTrend}
        fetchSucursales={cargarSucursales}
      />

      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Envíos Hoy"
          value={kpis?.enviosHoy || 0}
          description="Registrados hoy"
          icon={Package}
          color="info"
        />
        <StatCard
          title="Entregas Hoy"
          value={kpis?.enviosEntregadosHoy || 0}
          description="Completadas hoy"
          icon={CheckCircle}
          color="success"
        />
        <StatCard
          title="En Tránsito"
          value={kpis?.enviosEnTransito || 0}
          description="En camino"
          icon={Truck}
          color="warning"
        />
        <StatCard
          title="Retrasados"
          value={kpis?.enviosRetrasados || 0}
          description="Más de 5 días"
          icon={AlertTriangle}
          color="danger"
        />
      </div>

      {/* Métricas del Mes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Resumen del Mes */}
        <ResumenMes kpis={kpis} />

        {/* Estado del Sistema */}
        <EstadoSistema kpis={kpis} />
      </div>

      {/* Tendencia de Ingresos */}
      <TendenciaIngresos trend={trend} />

      {/* Recientes y Distribución */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Envíos Recientes */}
        <Recientes recientes={recientes} />

        {/* Distribución por Estado */}
        <Distribucion estadosData={estadosData} chartConfig={chartConfig} />
      </div>

      {/* Acciones Rápidas */}
      <AccionesRapidas />

      {/* Alertas y Notificaciones */}
      {kpis?.enviosRetrasados > 0 && <AlertasNotificaciones kpis={kpis} />}
    </div>
  );
}
