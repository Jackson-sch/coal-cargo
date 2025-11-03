"use client";
import { useState, useEffect } from "react";
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
  Search,
  Eye,
  Package,
  Truck,
  MapPin,
  Edit,
  User,
  Clock,
  CheckCircle,
  RefreshCw,
  Copy,
  Check,
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
export default function EnviosTransitoPage() {
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEnvios, setTotalEnvios] = useState(0); // Estados para modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEnvio, setSelectedEnvio] = useState(null); // Estado para el botón de copia
  const [copiedGuia, setCopiedGuia] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [descripcionEvento, setDescripcionEvento] = useState("");
  const [ubicacionEvento, setUbicacionEvento] = useState("");
  const [usuarioAsignado, setUsuarioAsignado] = useState("");
  const [saving, setSaving] = useState(false);
  const [fotoUrl, setFotoUrl] = useState("");
  const [firmaUrl, setFirmaUrl] = useState("");
  const itemsPerPage = 8;

  // Estados considerados "en tránsito"
  const estadosTransito = [
    "EN_TRANSITO",
    "EN_AGENCIA_ORIGEN",
    "EN_AGENCIA_DESTINO",
    "EN_REPARTO",
  ];

  // Cargar envíos en tránsito
  const fetchEnvios = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: itemsPerPage };
      if (searchQuery) params.guia = searchQuery;
      // Filtrar por múltiples estados de tránsito
      params.estados = estadosTransito;
      const result = await getEnvios(params);
      if (result.success) {
        setEnvios(result.data.envios);
        setTotalPages(result.data.pagination.totalPages);
        setTotalEnvios(result.data.pagination.total);
      } else {
        toast.error(result.error || "Error al cargar envíos en tránsito");
      }
    } catch (error) {
      toast.error("Error al cargar envíos en tránsito");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchEnvios();
    cargarUsuarios();
  }, [currentPage, searchQuery]);

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

  // Manejar búsqued a
  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Función para copiar número de guía
  const copiarNumeroGuia = async (numeroGuia) => {
    try {
      await navigator.clipboard.writeText(numeroGuia);
      setCopiedGuia(numeroGuia);
      toast.success(`Número de guía ${numeroGuia} copiado al portapapeles`);
      // Resetear el estado después de 2 segundos para evitar que se muestre el icono de copia repetidamente
      setTimeout(() => {
        setCopiedGuia(null);
      }, 2000);
    } catch (error) {
      toast.error("Error al copiar el número de guía");
    }
  };

  // Calcular tiempo en tránsito
  const calcularTiempoTransito = (fechaRegistro) => {
    const ahora = new Date();
    const registro = new Date(fechaRegistro);
    const diferencia = ahora - registro;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor(
      (diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    if (dias > 0) {
      return `${dias}d ${horas}h`;
    }
    return `${horas}h`;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Envíos en Tránsito
          </h1>
          <p className="text-muted-foreground">
            Gestiona todos los envíos que están en proceso de entrega
          </p>
        </div>
        <Button onClick={fetchEnvios} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </div>
      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total en Tránsito
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnvios}</div>
            <p className="text-xs text-muted-foreground">Envíos en proceso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Tránsito</CardTitle>
            <Truck className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {envios.filter((e) => e.estado === "EN_TRANSITO").length}
            </div>
            <p className="text-xs text-muted-foreground">En ruta</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Agencias</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                envios.filter(
                  (e) =>
                    e.estado === "EN_AGENCIA_ORIGEN" ||
                    e.estado === "EN_AGENCIA_DESTINO"
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">En almacén</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Reparto</CardTitle>
            <MapPin className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {envios.filter((e) => e.estado === "EN_REPARTO").length}
            </div>
            <p className="text-xs text-muted-foreground">Para entrega</p>
          </CardContent>
        </Card>
      </div>
      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca envíos por número de guía</CardDescription>
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
          </div>
        </CardContent>
      </Card>
      {/* Tabla de envíos */}
      <Card>
        <CardHeader>
          <CardTitle>Envíos en Tránsito ({totalEnvios})</CardTitle>
          <CardDescription>
            Lista de todos los envíos que están en proceso de entrega
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : envios.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                No hay envíos en tránsito
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery
                  ? "No se encontraron envíos con ese criterio"
                  : "Todos los envíos han sido entregados"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guía</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Sucursal Origen</TableHead>
                    <TableHead>Remitente / Destinatario</TableHead>
                    <TableHead>Origen → Destino</TableHead>
                    <TableHead>Tiempo en Tránsito</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {envios.map((envio) => (
                      <TableRow key={envio.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
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
                          {getEstadoBadge(envio.estado)}
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
                              {envio.remitenteNombre || "No especificado"}
                            </div>
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
                              {envio.sucursal_origen?.nombre || "N/A"}
                            </div>
                            <div className="text-muted-foreground">↓</div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {envio.sucursal_destino?.nombre || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {calcularTiempoTransito(
                              envio.fechaRegistro || envio.createdAt
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            S/ {envio.total?.toFixed(2) || "0.00"}
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
