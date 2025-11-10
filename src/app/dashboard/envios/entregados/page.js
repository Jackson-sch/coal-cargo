"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Eye,
  Package,
  CheckCircle,
  MapPin,
  Calendar,
  Edit,
  User,
  Clock,
  RefreshCw,
  Download,
  Filter,
  TrendingUp,
  Copy,
  Check,
  FileText,
  Truck,
  XCircle,
  ArrowRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  getEnvios,
  actualizarEstadoEnvio,
  asignarEnvio,
} from "@/lib/actions/envios";
import { getUsuarios } from "@/lib/actions/usuarios";
import Paginator from "@/components/ui/paginator";
import ModalDetalle from "@/components/envios/modal-detalle";
import ModalActualizarEstado from "@/components/envios/modal-actualizar-estado";
import ModalAsignarUsuario from "@/components/envios/modal-asignar-usuario";
import { estadosEnvioArray, modalidadesArray } from "@/lib/constants/estados";
import EstadisticaRapidasEntregados from "@/components/envios/entregados/estadisticas-rapidas";
import FiltrosBusquedaEntregados from "@/components/envios/entregados/filtros-busqueda";
import TablaEntregados from "@/components/envios/entregados/tabla-entregados";
import { useCopiarGuia } from "@/hooks/useCopiarGuia";
import { useEnviosActions } from "@/hooks/useEnviosActions";
import { useUsuarios } from "@/hooks/useUsuarios";
import { getEstadoBadge } from "@/lib/utils/estado-badge";
import { useGuia, useFechaFilter, usePage } from "@/hooks/useQueryParams";

const estadosEnvio = estadosEnvioArray;
const modalidades = modalidadesArray;

export default function EnviosEntregadosPage() {
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Query params con nuqs (sincronizados con URL)
  const [searchQuery, setSearchQuery] = useGuia("");
  const [fechaFiltro, setFechaFiltro] = useFechaFilter("todos");
  const [currentPage, setCurrentPage] = usePage(1);

  const [totalPages, setTotalPages] = useState(1);
  const [totalEnvios, setTotalEnvios] = useState(0);
  const [estadisticas, setEstadisticas] = useState({
    totalEntregados: 0,
    entregadosHoy: 0,
    entregadosSemana: 0,
    tiempoPromedioEntrega: 0,
  });

  // Estados para modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEnvio, setSelectedEnvio] = useState(null);

  // Hooks básicos
  const { copiarNumeroGuia, copiedGuia } = useCopiarGuia();
  const { usuarios } = useUsuarios();

  const itemsPerPage = 8;

  // Calcular estadísticas de entrega (debe ir antes de fetchEnvios)
  const calcularEstadisticas = useCallback((enviosData) => {
    const hoy = new Date();
    const inicioHoy = startOfDay(hoy);
    const inicioSemana = startOfDay(subDays(hoy, 7));

    const entregadosHoy = enviosData.filter(
      (envio) => envio.fechaEntrega && new Date(envio.fechaEntrega) >= inicioHoy
    ).length;

    const entregadosSemana = enviosData.filter(
      (envio) =>
        envio.fechaEntrega && new Date(envio.fechaEntrega) >= inicioSemana
    ).length;

    // Calcular tiempo promedio de entrega
    const tiemposEntrega = enviosData
      .filter((envio) => envio.fechaEntrega && envio.fechaRegistro)
      .map((envio) => {
        const registro = new Date(envio.fechaRegistro);
        const entrega = new Date(envio.fechaEntrega);
        return (entrega - registro) / (1000 * 60 * 60 * 24); // días
      });

    const tiempoPromedio =
      tiemposEntrega.length > 0
        ? tiemposEntrega.reduce((a, b) => a + b, 0) / tiemposEntrega.length
        : 0;

    setEstadisticas({
      totalEntregados: enviosData.length,
      entregadosHoy,
      entregadosSemana,
      tiempoPromedioEntrega: Math.round(tiempoPromedio * 10) / 10,
    });
  }, []);

  // Cargar envíos entregados (memoizado para cumplir exhaustive-deps)
  const fetchEnvios = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        estado: "ENTREGADO",
        filtroPorFechaEntrega: true, // Filtrar por fechaEntrega en lugar de fechaRegistro
      };

      if (searchQuery) params.guia = searchQuery;

      // Aplicar filtro de fecha
      if (fechaFiltro && fechaFiltro !== "todos") {
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
        setEnvios(result.data.envios || []);
        setTotalPages(result.data.pagination?.totalPages || 1);
        setTotalEnvios(result.data.pagination?.total || 0);
        // Calcular estadísticas
        calcularEstadisticas(result.data.envios || []);
      } else {
        // Si result.success es false, puede ser un error real o simplemente no hay datos
        // Verificar si es un error real de servidor o solo falta de datos
        console.error("Error al obtener envíos:", result.error);
        
        // Solo mostrar toast si es un error real (no relacionado con datos vacíos)
        // Los errores de Prisma por datos vacíos no deberían mostrarse como error al usuario
        const isRealError = result.error && 
                           !result.error.includes("sin") && 
                           !result.error.includes("no se encontraron") &&
                           !result.error.includes("no hay");
        
        if (isRealError) {
          toast.error(result.error || "Error al cargar envíos entregados");
        }
        
        // Establecer valores vacíos en cualquier caso
        setEnvios([]);
        setTotalPages(1);
        setTotalEnvios(0);
        calcularEstadisticas([]);
      }
    } catch (error) {
      console.error("Error al cargar envíos entregados:", error);
      // Solo mostrar toast de error si es un error de red o servidor
      // No mostrar si es simplemente que no hay datos
      const isNetworkError = error.message?.includes("fetch") || 
                            error.message?.includes("network") ||
                            error.message?.includes("ECONNREFUSED");
      
      if (isNetworkError) {
        toast.error("Error de conexión al cargar envíos entregados");
      }
      
      // En cualquier caso, establecer valores vacíos para evitar estados inconsistentes
      setEnvios([]);
      setTotalPages(1);
      setTotalEnvios(0);
      calcularEstadisticas([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, fechaFiltro, calcularEstadisticas]);

  // Hook de acciones de envíos (debe ir después de fetchEnvios)
  const {
    saving,
    nuevoEstado,
    setNuevoEstado,
    descripcionEvento,
    setDescripcionEvento,
    ubicacionEvento,
    setUbicacionEvento,
    fotoUrl,
    setFotoUrl,
    firmaUrl,
    setFirmaUrl,
    usuarioAsignado,
    setUsuarioAsignado,
    handleUpdateStatus,
    handleAssignUser,
    resetStatusForm,
  } = useEnviosActions(() => fetchEnvios());

  useEffect(() => {
    fetchEnvios();
  }, [fetchEnvios]);

  // Manejar búsqueda (resetear página al cambiar)
  const handleSearch = (value) => {
    setSearchQuery(value || null); // null elimina el query param de la URL
    setCurrentPage(1);
  };

  // Manejar filtro de fecha (resetear página al cambiar)
  const handleFechaFilter = (value) => {
    setFechaFiltro(value || "todos"); // Mantener "todos" como valor, no null
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Envíos Entregados
          </h1>
          <p className="text-muted-foreground">
            Historial completo de envíos entregados exitosamente
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchEnvios} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <EstadisticaRapidasEntregados estadisticas={estadisticas} />

      {/* Filtros y búsqueda */}
      <FiltrosBusquedaEntregados
        searchQuery={searchQuery}
        handleSearch={handleSearch}
        fechaFiltro={fechaFiltro}
        handleFechaFilter={handleFechaFilter}
      />

      {/* Tabla de envíos */}
      <TablaEntregados
        envios={envios}
        totalEnvios={totalEnvios}
        loading={loading}
        searchQuery={searchQuery}
        setSelectedEnvio={setSelectedEnvio}
        setShowDetailModal={setShowDetailModal}
        setShowStatusModal={setShowStatusModal}
        setNuevoEstado={setNuevoEstado}
        copiedGuia={copiedGuia}
        setUsuarioAsignado={setUsuarioAsignado}
        setShowAssignModal={setShowAssignModal}
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        copiarNumeroGuia={copiarNumeroGuia}
      />

      {/* Modal Detalle de Envío */}
      <ModalDetalle
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        envio={selectedEnvio}
        getEstadoBadge={getEstadoBadge}
        modalidades={modalidades}
      />

      {/* Modal Actualizar Estado */}
      <ModalActualizarEstado
        open={showStatusModal}
        onOpenChange={setShowStatusModal}
        envio={selectedEnvio}
        getEstadoBadge={getEstadoBadge}
        modalidades={modalidades}
        estadosEnvio={estadosEnvio}
        setShowStatusModal={setShowStatusModal}
        handleUpdateStatus={() =>
          handleUpdateStatus(selectedEnvio, setShowStatusModal)
        }
        saving={saving}
        nuevoEstado={nuevoEstado}
        setNuevoEstado={setNuevoEstado}
        descripcionEvento={descripcionEvento}
        setDescripcionEvento={setDescripcionEvento}
        ubicacionEvento={ubicacionEvento}
        setUbicacionEvento={setUbicacionEvento}
        fotoUrl={fotoUrl}
        setFotoUrl={setFotoUrl}
        firmaUrl={firmaUrl}
        setFirmaUrl={setFirmaUrl}
      />

      {/* Modal Asignar Usuario */}
      <ModalAsignarUsuario
        open={showAssignModal}
        onOpenChange={setShowAssignModal}
        envio={selectedEnvio}
        usuarios={usuarios}
        usuarioAsignado={usuarioAsignado}
        setUsuarioAsignado={setUsuarioAsignado}
        handleAssignUser={() =>
          handleAssignUser(selectedEnvio, setShowAssignModal)
        }
        saving={saving}
        setShowAssignModal={setShowAssignModal}
      />
    </div>
  );
}
