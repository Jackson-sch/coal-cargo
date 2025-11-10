"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
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
import { getSucursalesList } from "@/lib/actions/sucursales";

export default function EstadisticasPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [fechaRango, setFechaRango] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [periodo, setPeriodo] = useState("mes");
  const [sucursales, setSucursales] = useState([]);
  const [sucursalId, setSucursalId] = useState("ALL");
  const [filtroTipo, setFiltroTipo] = useState("ambos");
  const [datePickerKey, setDatePickerKey] = useState(0); // Key para forzar re-render del DatePicker
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
    REGISTRADO: { label: "Registrado", color: "#f59e0b" },
    EN_BODEGA: { label: "En Bodega", color: "#6b7280" },
    EN_AGENCIA_ORIGEN: { label: "En Agencia Origen", color: "#3b82f6" },
    EN_TRANSITO: { label: "En Tránsito", color: "#3b82f6" },
    EN_AGENCIA_DESTINO: { label: "En Agencia Destino", color: "#8b5cf6" },
    EN_REPARTO: { label: "En Reparto", color: "#06b6d4" },
    ENTREGADO: { label: "Entregado", color: "#22c55e" },
    DEVUELTO: { label: "Devuelto", color: "#ef4444" },
    ANULADO: { label: "Anulado", color: "#ef4444" },
    PENDIENTE: { label: "Pendiente", color: "#f59e0b" },
    ingresos: {
      label: "Ingresos",
      color: "#8b5cf6",
    },
    envios: {
      label: "Envíos",
      color: "#06b6d4",
    },
  };

  // Cargar sucursales si es SUPER_ADMIN
  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      cargarSucursales();
    }
  }, [session]);

  // Cargar estadísticas cuando cambien los filtros
  useEffect(() => {
    if (session) {
      cargarEstadisticas();
    }
  }, [fechaRango, periodo, sucursalId, filtroTipo, session]);

  const cargarSucursales = async () => {
    try {
      const res = await getSucursalesList();
      if (res?.success) {
        setSucursales(res.data || []);
      }
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
    }
  };

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      const selectedSucursalId =
        session?.user?.role === "SUPER_ADMIN" &&
        sucursalId &&
        sucursalId !== "ALL"
          ? sucursalId
          : undefined;

      const tipoFiltro = selectedSucursalId ? filtroTipo : "ambos";

      const params = new URLSearchParams({
        periodo,
        ...(fechaRango?.from
          ? { fechaDesde: fechaRango.from.toISOString() }
          : {}),
        ...(fechaRango?.to ? { fechaHasta: fechaRango.to.toISOString() } : {}),
        ...(selectedSucursalId ? { sucursalId: selectedSucursalId } : {}),
        ...(tipoFiltro ? { filtroTipo: tipoFiltro } : {}),
      });

      const res = await fetch(`/api/estadisticas?${params.toString()}`);
      const result = await res.json();

      if (result?.success) {
        const estadoColor = (estado) => {
          // Usar el chartConfig para obtener el color, o un valor por defecto
          return chartConfig[estado]?.color || "#6b7280";
        };
        setEstadisticas({
          ...result.data,
          enviosPorEstado: result.data.enviosPorEstado.map((e) => ({
            ...e,
            color: estadoColor(e.estado),
          })),
        });
      } else {
        toast.error(result?.error || "Error al cargar estadísticas");
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      toast.error("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    // Resetear el rango de fechas al mes actual
    const fechaInicioMes = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const fechaFin = new Date();
    fechaInicioMes.setHours(0, 0, 0, 0);
    fechaFin.setHours(23, 59, 59, 999);

    // Actualizar el estado del rango de fechas
    setFechaRango({
      from: fechaInicioMes,
      to: fechaFin,
    });

    // Resetear otros filtros
    setPeriodo("mes");
    setSucursalId("ALL");
    setFiltroTipo("ambos");

    // Forzar re-render del DatePicker cambiando su key
    setDatePickerKey((prev) => prev + 1);
  };

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
        limpiarFiltros={limpiarFiltros}
        loading={loading}
        session={session}
        sucursales={sucursales}
        sucursalId={sucursalId}
        setSucursalId={setSucursalId}
        filtroTipo={filtroTipo}
        setFiltroTipo={setFiltroTipo}
        datePickerKey={datePickerKey}
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
