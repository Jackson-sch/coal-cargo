"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { getEnvios } from "@/lib/actions/envios";
import { useEmpresaConfig } from "@/hooks/use-empresa-config";
import { useDebounce } from "@/hooks/useDebounce";
import {
  exportEnviosToExcel,
  exportAllEnviosToExcel,
  exportEnviosToCSV,
  exportEnviosToPDF,
} from "@/lib/utils/export-utils";
import HeaderReportes from "@/components/reportes/header";
import KPIsReportes from "@/components/reportes/kpis-reportes";
import TablaFiltrosReportes from "@/components/reportes/tabla-filtros-reportes";
import FiltrosReportes from "@/components/reportes/filtros-reportes";
import {
  useGuia,
  useEstadoFilter,
  useFechaFilter,
  usePage,
} from "@/hooks/useQueryParams";

const ITEMS_PER_PAGE = 8;
export default function ReportesPage() {
  const [loading, setLoading] = useState(true);
  const [envios, setEnvios] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { empresaConfig } = useEmpresaConfig();

  // Query params con nuqs (sincronizados con URL)
  const [searchQuery, setSearchQuery] = useGuia("");
  const [estado, setEstado] = useEstadoFilter("todos");
  const [fechaFiltro, setFechaFiltro] = useFechaFilter("todos");
  const [currentPage, setCurrentPage] = usePage(1);

  // Debounce corto para optimizar llamadas API (300ms)
  const searchQueryDebounced = useDebounce(searchQuery, 300);

  const formatEstadoLabel = (val) => {
    if (!val || val === "todos") return "Todos";
    return val
      .toString()
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const fetchEnvios = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: ITEMS_PER_PAGE };
      // Usar el valor debounced para optimizar llamadas API
      if (searchQueryDebounced) params.guia = searchQueryDebounced;
      if (estado !== "todos") params.estado = estado;
      if (fechaFiltro !== "todos") {
        const hoy = new Date();
        let fechaDesde, fechaHasta;
        switch (fechaFiltro) {
          case "hoy":
            fechaDesde = startOfDay(hoy);
            fechaHasta = endOfDay(hoy);
            break;
          case "semana":
            fechaDesde = startOfDay(subDays(hoy, 7));
            fechaHasta = endOfDay(hoy);
            break;
          case "mes":
            fechaDesde = startOfDay(subDays(hoy, 30));
            fechaHasta = endOfDay(hoy);
            break;
        }
        if (fechaDesde) params.fechaDesde = fechaDesde.toISOString();
        if (fechaHasta) params.fechaHasta = fechaHasta.toISOString();
      }

      const result = await getEnvios(params);
      if (result.success) {
        setEnvios(result.data.envios);
        setTotal(result.data.pagination.total);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        toast.error(result.error || "Error al cargar reportes de envíos");
      }
    } catch (err) {
      toast.error("Error al cargar reportes de envíos");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQueryDebounced, estado, fechaFiltro]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchEnvios();
  }, [fetchEnvios]);

  // Resetear página cuando cambie el searchQuery debounced o filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQueryDebounced, estado, fechaFiltro]);

  const handleSearch = (value) => {
    setSearchQuery(value || null); // null elimina el query param de la URL
    // La página se resetea automáticamente cuando searchQueryDebounced cambie
  };
  const handleEstado = (value) => {
    setEstado(value === "todos" ? null : value); // null para "todos" elimina el param
    setCurrentPage(1);
  };

  const handleFechaFiltro = (value) => {
    setFechaFiltro(value === "todos" ? null : value); // null para "todos" elimina el param
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const result = exportEnviosToExcel(envios);
    if (result.success) {
      toast.success("Reporte exportado correctamente");
    } else {
      toast.error(result.error || "Error al exportar reporte");
    }
  };

  const exportAllToExcel = async () => {
    try {
      const result = await exportAllEnviosToExcel(
        getEnvios,
        { searchQuery: searchQueryDebounced, estado, fechaFiltro },
        total,
        { startOfDay, endOfDay, subDays }
      );
      if (result.success) {
        toast.success("Reporte completo exportado correctamente");
      } else {
        toast.error(result.error || "Error al exportar reporte completo");
      }
    } catch (err) {
      toast.error("Error al exportar reporte completo");
    }
  };

  const exportToCSV = () => {
    const result = exportEnviosToCSV(envios);
    if (result.success) {
      toast.success("CSV exportado correctamente");
    } else {
      toast.error(result.error || "Error al exportar CSV");
    }
  };

  const exportToPDF = () => {
    const result = exportEnviosToPDF(envios, empresaConfig, {
      estado,
      fechaFiltro,
    });
    if (result.success) {
      toast.success("PDF generado correctamente");
    } else {
      toast.error(result.error || "Error al generar PDF");
    }
  };

  const totalPagina = envios.reduce((acc, e) => acc + (e.total || 0), 0);
  const entregadosPagina = envios.filter(
    (e) => e.estado === "ENTREGADO"
  ).length;
  const pendientesPagina = envios.filter(
    (e) => e.estado !== "ENTREGADO"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <HeaderReportes
        exportToExcel={exportToExcel}
        exportAllToExcel={exportAllToExcel}
        exportToCSV={exportToCSV}
        exportToPDF={exportToPDF}
        fetchEnvios={fetchEnvios}
      />

      {/* KPIs */}
      <KPIsReportes
        total={total}
        entregadosPagina={entregadosPagina}
        pendientesPagina={pendientesPagina}
        totalPagina={totalPagina}
      />

      {/* Filtros */}
      <FiltrosReportes
        searchQuery={searchQuery}
        handleSearch={handleSearch}
        estado={estado}
        handleEstado={handleEstado}
        fechaFiltro={fechaFiltro}
        handleFechaFiltro={handleFechaFiltro}
        formatEstadoLabel={formatEstadoLabel}
      />

      {/* Tabla */}
      <TablaFiltrosReportes
        loading={loading}
        envios={envios}
        total={total}
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}
