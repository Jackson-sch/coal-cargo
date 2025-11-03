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

const estadosEnvio = estadosEnvioArray;
const modalidades = modalidadesArray;

export default function EnviosEntregadosPage() {
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
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
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [descripcionEvento, setDescripcionEvento] = useState("");
  const [ubicacionEvento, setUbicacionEvento] = useState("");
  const [usuarioAsignado, setUsuarioAsignado] = useState("");
  const [saving, setSaving] = useState(false);
  const [fotoUrl, setFotoUrl] = useState("");
  const [firmaUrl, setFirmaUrl] = useState("");

  // Estado para el botón de copia
  const [copiedGuia, setCopiedGuia] = useState(null);

  const itemsPerPage = 8;

  // Cargar envíos entregados (memoizado para cumplir exhaustive-deps)
  const fetchEnvios = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        estado: "ENTREGADO",
      };

      if (searchQuery) params.guia = searchQuery;

      // Aplicar filtro de fecha
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
        setTotalPages(result.data.pagination.totalPages);
        setTotalEnvios(result.data.pagination.total);
        // Calcular estadísticas
        calcularEstadisticas(result.data.envios);
      } else {
        toast.error(result.error || "Error al cargar envíos entregados");
      }
    } catch (error) {
      toast.error("Error al cargar envíos entregados");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, fechaFiltro]);

  // Calcular estadísticas de entrega
  const calcularEstadisticas = (enviosData) => {
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
  };

  useEffect(() => {
    fetchEnvios();
    cargarUsuarios();
  }, [fetchEnvios]);

  const cargarUsuarios = async () => {
    try {
      const result = await getUsuarios();
      if (result.success) {
        setUsuarios(result.data);
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  // Manejar búsqueda
  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Manejar filtro de fecha
  const handleFechaFilter = (value) => {
    setFechaFiltro(value);
    setCurrentPage(1);
  };

  // Función para copiar número de guía
  const copiarNumeroGuia = async (numeroGuia) => {
    try {
      await navigator.clipboard.writeText(numeroGuia);
      setCopiedGuia(numeroGuia);
      toast.success(`Número de guía ${numeroGuia} copiado al portapapeles`);
      // Resetear el estado después de 2 segundos
      setTimeout(() => {
        setCopiedGuia(null);
      }, 2000);
    } catch (error) {
      toast.error("Error al copiar el número de guía");
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedEnvio || !nuevoEstado) {
      toast.error("Complete todos los campos requeridos");
      return;
    }

    try {
      setSaving(true);
      const result = await actualizarEstadoEnvio(
        selectedEnvio.id,
        nuevoEstado,
        descripcionEvento,
        ubicacionEvento,
        fotoUrl || null,
        firmaUrl || null
      );
      if (result.success) {
        toast.success("Estado actualizado correctamente");
        setShowStatusModal(false);
        resetStatusForm();
        await fetchEnvios();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al actualizar estado");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignUser = async () => {
    if (!selectedEnvio || !usuarioAsignado) {
      toast.error("Seleccione un usuario válido");
      return;
    }

    try {
      setSaving(true);
      const result = await asignarEnvio(selectedEnvio.id, usuarioAsignado);
      if (result.success) {
        toast.success("Envío asignado correctamente");
        setShowAssignModal(false);
        setUsuarioAsignado("");
        await fetchEnvios();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al asignar envío");
    } finally {
      setSaving(false);
    }
  };

  const resetStatusForm = () => {
    setNuevoEstado("");
    setDescripcionEvento("");
    setUbicacionEvento("");
    setFotoUrl("");
    setFirmaUrl("");
  };

  const getEstadoBadge = (estado) => {
    const estadoInfo = estadosEnvio.find((e) => e.value === estado);
    if (!estadoInfo) return null;
    const Icon = estadoInfo.icon;
    return (
      <Badge className={`${estadoInfo.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" /> {estadoInfo.label}
      </Badge>
    );
  };

  // Calcular tiempo de entrega
  const calcularTiempoEntrega = (fechaRegistro, fechaEntrega) => {
    if (!fechaEntrega) return "N/A";

    const registro = new Date(fechaRegistro);
    const entrega = new Date(fechaEntrega);
    const diferencia = entrega - registro;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor(
      (diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (dias > 0) {
      return `${dias}d ${horas}h`;
    }
    return `${horas}h`;
  };

  // Exportar datos
  const handleExport = () => {
    // TODO: Implementar exportación a Excel/CSV
    toast.info("Función de exportación en desarrollo");
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
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={fetchEnvios} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Entregados
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {estadisticas.totalEntregados}
            </div>
            <p className="text-xs text-muted-foreground">Envíos completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Entregados Hoy
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {estadisticas.entregadosHoy}
            </div>
            <p className="text-xs text-muted-foreground">En las últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {estadisticas.entregadosSemana}
            </div>
            <p className="text-xs text-muted-foreground">Últimos 7 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tiempo Promedio
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {estadisticas.tiempoPromedioEntrega}d
            </div>
            <p className="text-xs text-muted-foreground">Días de entrega</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra envíos entregados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número de guía..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={fechaFiltro} onValueChange={handleFechaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los envíos</SelectItem>
                  <SelectItem value="hoy">Entregados hoy</SelectItem>
                  <SelectItem value="semana">Última semana</SelectItem>
                  <SelectItem value="mes">Último mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de envíos */}
      <Card>
        <CardHeader>
          <CardTitle>Envíos Entregados ({totalEnvios})</CardTitle>
          <CardDescription>
            Lista de todos los envíos entregados exitosamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : envios.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                No hay envíos entregados
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery
                  ? "No se encontraron envíos con ese criterio"
                  : "Aún no se han entregado envíos"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guía</TableHead>
                    <TableHead>Sucursal Origen</TableHead>
                    <TableHead>Remitente / Destinatario</TableHead>
                    <TableHead>Origen → Destino</TableHead>
                    <TableHead>Fecha Entrega</TableHead>
                    <TableHead>Tiempo Entrega</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {envios.map((envio) => (
                    <TableRow key={envio.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{envio.guia}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-gray-100"
                                  onClick={() => copiarNumeroGuia(envio.guia)}
                                >
                                  {copiedGuia === envio.guia ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-gray-500" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copiar número de guía al portapapeles</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {envio.sucursal_origen?.nombre || "N/A"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {envio.sucursal_origen?.provincia || ""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Remitente:
                          </div>
                          <div className="font-medium text-sm">
                            {envio?.cliente?.tipoDocumento === "RUC"
                              ? envio?.cliente?.razonSocial ||
                                envio?.remitenteNombre ||
                                "No especificado"
                              : envio?.remitenteNombre || "No especificado"}
                          </div>
                          {envio?.cliente?.tipoDocumento &&
                            (envio?.cliente?.numeroDocumento ||
                              envio?.cliente?.ruc) && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>
                                  {envio.cliente.tipoDocumento}:
                                  {envio.cliente.tipoDocumento === "RUC"
                                    ? envio.cliente.ruc ||
                                      envio.cliente.numeroDocumento
                                    : envio.cliente.numeroDocumento}
                                </span>
                              </div>
                            )}
                          <div className="text-xs text-muted-foreground">
                            Destinatario:
                          </div>
                          <div className="font-medium text-sm">
                            {envio.destinatarioNombre || "No especificado"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {envio.sucursalOrigen?.nombre}
                          </div>
                          <div className="text-muted-foreground">↓</div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {envio.sucursalDestino?.nombre}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <div>
                            {envio.fechaEntrega
                              ? format(
                                  new Date(envio.fechaEntrega),
                                  "dd/MM/yyyy",
                                  {
                                    locale: es,
                                  }
                                )
                              : "No especificada"}
                            {envio.fechaEntrega && (
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(envio.fechaEntrega), "HH:mm", {
                                  locale: es,
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {calcularTiempoEntrega(
                            envio.fechaRegistro,
                            envio.fechaEntrega
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          S/ {envio.total?.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEnvio(envio);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEnvio(envio);
                              setNuevoEstado(envio.estado);
                              setShowStatusModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {(envio.estado === "REGISTRADO" ||
                            envio.estado === "EN_BODEGA") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEnvio(envio);
                                setUsuarioAsignado(envio.asignadoA || "");
                                setShowAssignModal(true);
                              }}
                            >
                              <User className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación */}
          <div className="py-4">
            <Paginator
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              limit={itemsPerPage}
              total={totalEnvios}
              entityLabel="envíos"
            />
          </div>
        </CardContent>
      </Card>

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
        handleUpdateStatus={handleUpdateStatus}
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
        handleAssignUser={handleAssignUser}
        saving={saving}
        setShowAssignModal={setShowAssignModal}
      />
      </div>
  );
}
