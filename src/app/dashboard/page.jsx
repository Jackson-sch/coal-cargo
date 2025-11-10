"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Package, CheckCircle, AlertTriangle, Truck } from "lucide-react";
import { toast } from "sonner";
import {
  getDashboardKpis,
  getEstadisticasDashboard,
  getMesesDisponibles,
} from "@/lib/actions/dashboard";
import { getSucursalesList } from "@/lib/actions/sucursales";
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
  const [sucursalId, setSucursalId] = useState("ALL"); // "ALL" = todas
  const [filtroTipo, setFiltroTipo] = useState("ambos"); // "origen", "destino", "ambos"
  const [trend, setTrend] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    // Por defecto, mes actual en formato "YYYY-MM"
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  });
  const [mesesDisponibles, setMesesDisponibles] = useState([]);

  useEffect(() => {
    // Cuando esté lista la sesión, cargar datos
    if (session) {
      if (session?.user?.role === "SUPER_ADMIN") {
        cargarSucursales();
      }
      cargarMesesDisponibles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sucursalId, filtroTipo]);

  // Cargar KPIs cuando cambie la sesión, la sucursal o el tipo de filtro
  useEffect(() => {
    if (session) {
      fetchKpis(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, sucursalId, filtroTipo]); // Depende de cambios en usuario, sucursal o tipo de filtro

  // Cargar trend cuando cambie el mes seleccionado
  useEffect(() => {
    if (session && mesSeleccionado) {
      fetchTrend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesSeleccionado]);
  
  // Actualizar datos cuando la página vuelve a estar visible
  useEffect(() => {
    if (!session) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Página vuelve a estar visible, actualizar datos
        fetchKpis(false);
        fetchTrend();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, sucursalId, filtroTipo]);

  // Actualizar datos automáticamente cada 5 minutos (300000 ms)
  // Solo cuando la página está activa (no en background)
  useEffect(() => {
    // Solo establecer el intervalo si hay sesión
    if (!session) return;

    // Función para actualizar datos sin mostrar loading
    const actualizarDatosEnSegundoPlano = async () => {
      if (document.hidden) return; // No actualizar si la página está en background
      
      try {
        const selectedSucursalId = 
          session?.user?.role === "SUPER_ADMIN" &&
          sucursalId &&
          sucursalId !== "ALL"
            ? sucursalId
            : undefined;
        
        // Actualizar KPIs sin mostrar loading
        const tipoFiltro = selectedSucursalId ? filtroTipo : "ambos";
        const kpisResult = await getDashboardKpis({ 
          sucursalId: selectedSucursalId,
          filtroTipo: tipoFiltro,
        });
        if (kpisResult.success) {
          setKpis(kpisResult.data);
          setUltimaActualizacion(new Date());
        }
        
        // Actualizar tendencia
        const trendResult = await getEstadisticasDashboard({
          periodo: "mes",
          sucursalId: selectedSucursalId,
          filtroTipo: tipoFiltro,
          mes: mesSeleccionado,
        });
        if (trendResult?.success) {
          setTrend(trendResult.data);
        }
      } catch (error) {
        console.error("Error al actualizar datos en segundo plano:", error);
      }
    };

    const id = setInterval(actualizarDatosEnSegundoPlano, 300000); // 5 minutos
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sucursalId, filtroTipo]);

  const cargarSucursales = async () => {
    try {
      const res = await getSucursalesList();
      if (res?.success) {
        setSucursales(res.data || []);
      } else {
        console.error("Error al cargar sucursales:", res?.error);
      }
    } catch (e) {
      console.error("Error al cargar sucursales:", e);
    }
  };

  const cargarMesesDisponibles = async () => {
    try {
      const selectedSucursalId = 
        session?.user?.role === "SUPER_ADMIN" &&
        sucursalId &&
        sucursalId !== "ALL"
          ? sucursalId
          : undefined;
      
      const tipoFiltro = selectedSucursalId ? filtroTipo : "ambos";
      
      const res = await getMesesDisponibles({
        sucursalId: selectedSucursalId,
        filtroTipo: tipoFiltro,
      });
      
      if (res?.success) {
        setMesesDisponibles(res.data || []);
        // Si el mes seleccionado no está en la lista, usar el mes actual
        if (res.data.length > 0) {
          const mesActual = res.data[0].value; // El primero es el más reciente
          if (!res.data.find((m) => m.value === mesSeleccionado)) {
            setMesSeleccionado(mesActual);
          }
        }
      }
    } catch (e) {
      console.error("Error al cargar meses disponibles:", e);
    }
  };

  const fetchKpis = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      // Determinar el sucursalId a usar y el tipo de filtro
      const selectedSucursalId = 
        session?.user?.role === "SUPER_ADMIN" &&
        sucursalId &&
        sucursalId !== "ALL"
          ? sucursalId
          : undefined;
      
      const tipoFiltro = selectedSucursalId ? filtroTipo : "ambos";
      
      const result = await getDashboardKpis({
        sucursalId: selectedSucursalId,
        filtroTipo: tipoFiltro,
      });
      
      if (result.success) {
        setKpis(result.data);
        setUltimaActualizacion(new Date());
      } else {
        toast.error(result.error || "Error al cargar estadísticas");
      }
    } catch (error) {
      console.error("Error al cargar KPIs:", error);
      toast.error("Error al cargar estadísticas");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [session, sucursalId, filtroTipo]);

  const fetchTrend = useCallback(async () => {
    try {
      // Determinar el sucursalId a usar y el tipo de filtro
      const selectedSucursalId = 
        session?.user?.role === "SUPER_ADMIN" &&
        sucursalId &&
        sucursalId !== "ALL"
          ? sucursalId
          : undefined;
      
      const tipoFiltro = selectedSucursalId ? filtroTipo : "ambos";
      
      const res = await getEstadisticasDashboard({
        periodo: "mes",
        sucursalId: selectedSucursalId,
        filtroTipo: tipoFiltro,
        mes: mesSeleccionado,
      });
      
      if (res?.success) {
        setTrend(res.data);
      } else {
        console.error("Error al cargar tendencia:", res?.error);
      }
    } catch (e) {
      console.error("Error al cargar tendencia:", e);
    }
  }, [session, sucursalId, filtroTipo, mesSeleccionado]);

  // Función para actualizar manualmente
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchKpis(false), fetchTrend()]);
      toast.success("Datos actualizados");
    } catch (error) {
      console.error("Error al actualizar:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchKpis, fetchTrend]);

  const recientes = kpis?.enviosRecientes || [];

  // Usar estadísticas del mes seleccionado desde trend, o del mes actual desde kpis
  const estadosData = trend?.enviosPorEstado?.length
    ? trend.enviosPorEstado.map((item) => ({
        estado: item.estado,
        cantidad: item.cantidad,
      }))
    : Object.entries(kpis?.estadisticasPorEstado || {}).map(
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
        filtroTipo={filtroTipo}
        setFiltroTipo={setFiltroTipo}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        ultimaActualizacion={ultimaActualizacion}
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
      <TendenciaIngresos 
        trend={trend} 
        mesSeleccionado={mesSeleccionado}
        setMesSeleccionado={setMesSeleccionado}
        mesesDisponibles={mesesDisponibles}
      />

      {/* Recientes y Distribución */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Envíos Recientes */}
        <Recientes recientes={recientes} />

        {/* Distribución por Estado */}
        <Distribucion 
          estadosData={estadosData} 
          chartConfig={chartConfig}
          mesSeleccionado={mesSeleccionado}
          setMesSeleccionado={setMesSeleccionado}
          mesesDisponibles={mesesDisponibles}
        />
      </div>

      {/* Acciones Rápidas */}
      <AccionesRapidas />

      {/* Alertas y Notificaciones */}
      {kpis?.enviosRetrasados > 0 && <AlertasNotificaciones kpis={kpis} />}
    </div>
  );
}
