"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Truck,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Building2,
  ArrowRight,
  Loader2,
  Calendar,
  Weight,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Calculator,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  getEnvios,
  createEnvio,
  actualizarEstadoEnvio,
  asignarEnvio,
  getEstadisticasEnvios,
} from "@/lib/actions/envios";
import { getSucursales } from "@/lib/actions/sucursales";
import { getClientes } from "@/lib/actions/clientes";
import { getUsuarios } from "@/lib/actions/usuarios";
import { calcularCotizacionSucursal } from "@/lib/actions/cotizacion-sucursales";
import FormularioEnvioV2 from "@/components/envios/v2/FormularioEnvio";
import Paginator from "@/components/ui/paginator";
const estadosEnvio = [
  {
    value: "REGISTRADO",
    label: "Registrado",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  {
    value: "EN_BODEGA",
    label: "En Bodega",
    color: "bg-blue-100 text-blue-800",
    icon: Package,
  },
  {
    value: "EN_TRANSITO",
    label: "En Tránsito",
    color: "bg-purple-100 text-purple-800",
    icon: Truck,
  },
  {
    value: "EN_REPARTO",
    label: "En Reparto",
    color: "bg-indigo-100 text-indigo-800",
    icon: MapPin,
  },
  {
    value: "ENTREGADO",
    label: "Entregado",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  {
    value: "DEVUELTO",
    label: "Devuelto",
    color: "bg-orange-100 text-orange-800",
    icon: ArrowRight,
  },
  {
    value: "ANULADO",
    label: "Anulado",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
];
const tiposServicio = [
  { value: "ECONOMICO", label: "Económico" },
  { value: "NORMAL", label: "Normal" },
  { value: "EXPRESS", label: "Express" },
  { value: "OVERNIGHT", label: "Overnight" },
];
const modalidades = [
  { value: "SUCURSAL_SUCURSAL", label: "Sucursal a Sucursal" },
  { value: "SUCURSAL_DOMICILIO", label: "Sucursal a Domicilio" },
  { value: "DOMICILIO_SUCURSAL", label: "Domicilio a Sucursal" },
  { value: "DOMICILIO_DOMICILIO", label: "Domicilio a Domicilio" },
];
export default function EnviosPage() {
  const [loading, setLoading] = useState(false);
  const [envios, setEnvios] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]); // Estados de modale s
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEnvio, setSelectedEnvio] = useState(null);
  const [saving, setSaving] = useState(false); // Estado para el botón de copi a
  const [copiedGuia, setCopiedGuia] = useState(null); // Filtro s
  const [filtros, setFiltros] = useState({
    estado: "all-states",
    sucursalOrigenId: "all-branches",
    sucursalDestinoId: "all-branches",
    clienteId: "all-clients",
    numeroGuia: "",
    fechaRango: { from: null, to: null },
    page: 1,
  }); // Formulario de nuevo enví o
  const [formData, setFormData] = useState({
    clienteId: "",
    sucursalOrigenId: "",
    sucursalDestinoId: "",
    peso: "",
    descripcion: "",
    valorDeclarado: "",
    tipoServicio: "NORMAL",
    modalidad: "SUCURSAL_SUCURSAL",
    largo: "",
    ancho: "",
    alto: "",
    observaciones: "", // ✅ Datos del remitent e
    remitenteNombre: "",
    remitenteTelefono: "",
    remitenteEmail: "",
    remitenteDireccion: "", // ✅ Datos del destinatari o
    destinatarioNombre: "",
    destinatarioTelefono: "",
    destinatarioEmail: "",
    destinatarioDireccion: "",
  }); // Estado para cotización previ a
  const [cotizacionPrevia, setCotizacionPrevia] = useState(null);
  const [calculandoCotizacion, setCalculandoCotizacion] = useState(false); // Estados para actualización de estad o
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [descripcionEvento, setDescripcionEvento] = useState("");
  const [ubicacionEvento, setUbicacionEvento] = useState("");
  const [usuarioAsignado, setUsuarioAsignado] = useState("");
  useEffect(() => {
    cargarDatos();
    cargarDatosIniciales();
  }, []);
  useEffect(() => {
    cargarEnvios();
  }, [filtros]);
  const cargarDatos = async () => {
    try {
      const estadisticasResult = await getEstadisticasEnvios();
      if (estadisticasResult.success) {
        setEstadisticas(estadisticasResult.data);
      }
    } catch (error) {}
  }; // Función para copiar número de guí a
  const copiarNumeroGuia = async (numeroGuia) => {
    try {
      await navigator.clipboard.writeText(numeroGuia);
      setCopiedGuia(numeroGuia);
      toast.success(`Número de guía ${numeroGuia} copiado al portapapeles`); // Resetear el estado después de 2 segundo s
      setTimeout(() => {
        setCopiedGuia(null);
      }, 2000);
    } catch (error) {
      toast.error("Error al copiar el número de guía");
    }
  };
  const cargarDatosIniciales = async () => {
    try {
      const [sucursalesResult, clientesResult, usuariosResult] =
        await Promise.all([getSucursales(), getClientes(), getUsuarios()]);
      if (sucursalesResult.success) setSucursales(sucursalesResult.data);
      if (clientesResult.success) setClientes(clientesResult.data);
      if (usuariosResult.success) setUsuarios(usuariosResult.data);
    } catch (error) {}
  };
  const cargarEnvios = async () => {
    try {
      setLoading(true);
      const result = await getEnvios(filtros);
      if (result.success) {
        setEnvios(result.data.envios);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al cargar envíos");
    } finally {
      setLoading(false);
    }
  };
  const calcularCotizacionPrevia = async () => {
    if (
      !formData.sucursalOrigenId ||
      !formData.sucursalDestinoId ||
      !formData.peso
    ) {
      return;
    }

    try {
      setCalculandoCotizacion(true);
      const result = await calcularCotizacionSucursal({
        sucursalOrigenId: formData.sucursalOrigenId,
        sucursalDestinoId: formData.sucursalDestinoId,
        peso: parseFloat(formData.peso),
        tipoServicio: formData.tipoServicio,
        modalidad: formData.modalidad,
        valorDeclarado: formData.valorDeclarado,
        largo: formData.largo,
        ancho: formData.ancho,
        alto: formData.alto,
      });
      if (result.success) {
        setCotizacionPrevia(result.data);
      } else {
        setCotizacionPrevia(null);
        toast.error(result.error);
      }
    } catch (error) {
      setCotizacionPrevia(null);
    } finally {
      setCalculandoCotizacion(false);
    }
  };
  const handleCreateEnvio = async (payloadFromForm) => {
    // Validar usando datos combinados y contemplando paquete del formulari o
    const combinado = { ...formData, ...payloadFromForm };
    const pesoFinal = combinado?.paquete?.peso ?? combinado?.peso;
    const descripcionFinal =
      combinado?.paquete?.descripcion ?? combinado?.descripcion; // Construir errores de campos faltantes para mostrarlos en el formulari o
    const fieldErrors = {};
    if (!combinado?.sucursalOrigenId)
      fieldErrors.sucursalOrigenId = "Seleccione sucursal de origen";
    if (!combinado?.sucursalDestinoId)
      fieldErrors.sucursalDestinoId = "Seleccione sucursal de destino";
    if (!pesoFinal) fieldErrors["paquete.peso"] = "Ingrese el peso del paquete";
    if (!descripcionFinal)
      fieldErrors["paquete.descripcion"] = "Ingrese la descripción del paquete";
    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        error: "Complete los campos requeridos",
        fieldErrors,
      };
    }

    try {
      setSaving(true);
      const extraObservaciones = [
        combinado?.quienPaga ? `Pago: ${combinado.quienPaga}` : null,
        combinado?.facturarA ? `Facturar a: ${combinado.facturarA}` : null,
      ]
        .filter(Boolean)
        .join(" | ");
      const observacionesCombinadas = [
        combinado?.observaciones?.trim(),
        extraObservaciones,
      ]
        .filter(Boolean)
        .join(" | ");
      const finalData = {
        ...combinado,
        observaciones: observacionesCombinadas,
      };
      const result = await createEnvio(finalData);
      if (result.success) {
        toast.success("Envío creado correctamente");
        setShowCreateModal(false);
        resetForm();
        await cargarEnvios();
        await cargarDatos();
        return result;
      } else {
        return result;
      }
    } catch (error) {
      return { success: false, error: "Error al crear envío" };
    } finally {
      setSaving(false);
    }
  };
  const handleUpdateStatus = async () => {
    if (!selectedEnvio || !nuevoEstado) {
      toast.error("Seleccione un estado válido");
      return;
    }

    try {
      setSaving(true);
      const result = await actualizarEstadoEnvio(
        selectedEnvio.id,
        nuevoEstado,
        descripcionEvento,
        ubicacionEvento
      );
      if (result.success) {
        toast.success("Estado actualizado correctamente");
        setShowStatusModal(false);
        resetStatusForm();
        await cargarEnvios();
        await cargarDatos();
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
        await cargarEnvios();
        await cargarDatos();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al asignar envío");
    } finally {
      setSaving(false);
    }
  };
  const resetForm = () => {
    setFormData({
      clienteId: "",
      sucursalOrigenId: "",
      sucursalDestinoId: "",
      peso: "",
      descripcion: "",
      valorDeclarado: "",
      tipoServicio: "NORMAL",
      modalidad: "SUCURSAL_SUCURSAL",
      largo: "",
      ancho: "",
      alto: "",
      observaciones: "", // ✅ Datos del remitent e
      remitenteNombre: "",
      remitenteTelefono: "",
      remitenteEmail: "",
      remitenteDireccion: "", // ✅ Datos del destinatari o
      destinatarioNombre: "",
      destinatarioTelefono: "",
      destinatarioEmail: "",
      destinatarioDireccion: "",
    });
    setCotizacionPrevia(null);
  };
  const resetStatusForm = () => {
    setNuevoEstado("");
    setDescripcionEvento("");
    setUbicacionEvento("");
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
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount);
  };
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }; // Efecto para calcular cotización cuando cambian los datos relevante s
  useEffect(() => {
    const timer = setTimeout(() => {
      calcularCotizacionPrevia();
    }, 500);
    return () => clearTimeout(timer);
  }, [
    formData.sucursalOrigenId,
    formData.sucursalDestinoId,
    formData.peso,
    formData.tipoServicio,
    formData.modalidad,
    formData.valorDeclarado,
    formData.largo,
    formData.ancho,
    formData.alto,
  ]);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión de Envíos
          </h1>
          <p className="text-muted-foreground">
            Administra todos los envíos y su seguimiento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Envío
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.assign("/dashboard/envios/v2")}
          >
            Probar Formulario v2
          </Button>
        </div>
      </div>
      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Envíos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {estadisticas.totalEnvios}
              </div>
              <p className="text-xs text-muted-foreground">
                Todos los envíos registrados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Envíos Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.enviosHoy}</div>
              <p className="text-xs text-muted-foreground">
                Nuevos envíos de hoy
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Tránsito</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {estadisticas.enviosPorEstado.EN_TRANSITO || 0}
              </div>
              <p className="text-xs text-muted-foreground">Envíos en camino</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ingresos Mes
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(estadisticas.ingresosMes)}
              </div>
              <p className="text-xs text-muted-foreground">
                Facturación mensual
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" /> Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="numeroGuia">Número de Guía</Label>
              <Input
                id="numeroGuia"
                placeholder="CC241002001"
                value={filtros.numeroGuia}
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    numeroGuia: e.target.value,
                    page: 1,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={filtros.estado}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, estado: value, page: 1 })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-states">Todos los estados</SelectItem>
                  {estadosEnvio.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sucursalOrigen">Sucursal Origen</Label>
              <Select
                value={filtros.sucursalOrigenId}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, sucursalOrigenId: value, page: 1 })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las sucursales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-branches">
                    Todas las sucursales
                  </SelectItem>
                  {sucursales.map((sucursal) => (
                    <SelectItem key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre} - {sucursal.provincia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Select
                value={filtros.clienteId}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, clienteId: value, page: 1 })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-clients">
                    Todos los clientes
                  </SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Rango de Fechas</Label>
              <DatePickerWithRange
                date={filtros.fechaRango}
                setDate={(dateRange) =>
                  setFiltros({
                    ...filtros,
                    fechaRango: dateRange,
                    fechaDesde: dateRange?.from
                      ? dateRange.from.toISOString().split("T")[0]
                      : "",
                    fechaHasta: dateRange?.to
                      ? dateRange.to.toISOString().split("T")[0]
                      : "",
                    page: 1,
                  })
                }
                placeholder="Seleccionar rango de fechas"
                className="w-full"
              />
            </div>
            <div className="flex items-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFiltros({
                    estado: "all-states",
                    sucursalOrigenId: "all-branches",
                    sucursalDestinoId: "all-branches",
                    clienteId: "all-clients",
                    numeroGuia: "",
                    fechaRango: { from: null, to: null },
                    page: 1,
                  });
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Tabla de Envíos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Lista de Envíos
            {pagination && (
              <span className="text-sm font-normal text-muted-foreground">
                ({pagination.total} envíos)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Cargando envíos...</span>
            </div>
          ) : envios.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay envíos
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron envíos con los filtros aplicados.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guía</TableHead>
                      <TableHead>Remitente</TableHead>
                      <TableHead>Destinatario</TableHead>
                      <TableHead>Ruta</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {envios.map((envio) => (
                      <TableRow key={envio.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span>{envio.numeroGuia}</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-gray-100"
                                    onClick={() =>
                                      copiarNumeroGuia(envio.numeroGuia)
                                    }
                                  >
                                    {copiedGuia === envio.numeroGuia ? (
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
                        {/* ✅ Columna del Remitente */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">
                              {envio?.cliente?.tipoDocumento === "RUC"
                                ? envio?.cliente?.razonSocial ||
                                  envio.remitenteNombre ||
                                  "No especificado"
                                : envio.remitenteNombre ||
                                  envio?.cliente?.nombre ||
                                  "No especificado"}
                            </div>
                            {/* Mostrar documento del remitente directo o del cliente */}
                            {envio.remitenteTipoDocumento &&
                            envio.remitenteNumeroDocumento ? (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {envio.remitenteTipoDocumento === "RUC"
                                  ? `RUC: ${envio.remitenteNumeroDocumento}`
                                  : `${envio.remitenteTipoDocumento}: ${envio.remitenteNumeroDocumento}`}
                              </div>
                            ) : (
                              envio?.cliente?.tipoDocumento &&
                              (envio?.cliente?.numeroDocumento ||
                                envio?.cliente?.ruc) && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {envio?.cliente?.tipoDocumento === "RUC"
                                    ? `RUC: ${
                                        envio?.cliente?.ruc ||
                                        envio?.cliente?.numeroDocumento
                                      }`
                                    : `${envio?.cliente?.tipoDocumento}: ${envio?.cliente?.numeroDocumento}`}
                                </div>
                              )
                            )}
                            {(envio.remitenteTelefono ||
                              envio?.cliente?.telefono) && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {envio.remitenteTelefono ||
                                  envio?.cliente?.telefono}
                              </div>
                            )}
                            {(envio.remitenteEmail ||
                              envio?.cliente?.email) && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {envio.remitenteEmail || envio?.cliente?.email}
                              </div>
                            )}
                            {(envio.modalidad === "DOMICILIO_SUCURSAL" ||
                              envio.modalidad === "DOMICILIO_DOMICILIO") &&
                              (envio.remitenteDireccion ||
                                envio?.cliente?.direccion) && (
                                <div className="text-xs text-muted-foreground">
                                  {envio.remitenteDireccion ||
                                    envio?.cliente?.direccion}
                                </div>
                              )}
                          </div>
                        </TableCell>
                        {/* ✅ Columna del Destinatario */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">
                              {envio.destinatarioNombre || "No especificado"}
                            </div>
                            {envio?.destinatarioTipoDocumento &&
                              envio?.destinatarioNumeroDocumento && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {envio?.destinatarioTipoDocumento === "RUC"
                                    ? `RUC: ${envio?.destinatarioNumeroDocumento}`
                                    : `${envio?.destinatarioTipoDocumento}: ${envio?.destinatarioNumeroDocumento}`}
                                </div>
                              )}
                            {envio.destinatarioTelefono && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {envio.destinatarioTelefono}
                              </div>
                            )}
                            {envio.destinatarioEmail && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {envio.destinatarioEmail}
                              </div>
                            )}
                            {(envio.modalidad === "SUCURSAL_DOMICILIO" ||
                              envio.modalidad === "DOMICILIO_DOMICILIO") &&
                              envio.destinatarioDireccion && (
                                <div className="text-xs text-muted-foreground">
                                  {envio.destinatarioDireccion}
                                </div>
                              )}
                          </div>
                        </TableCell>
                        {/* Ruta */}
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <div className="text-center">
                              <Building2 className="h-3 w-3 mx-auto mb-1" />
                              <div className="truncate max-w-20">
                                {envio.sucursal_origen?.nombre || "N/A"}
                              </div>
                            </div>
                            <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />
                            <div className="text-center">
                              <Building2 className="h-3 w-3 mx-auto mb-1" />
                              <div className="truncate max-w-20">
                                {envio.sucursal_destino?.nombre || "N/A"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getEstadoBadge(envio.estado)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Weight className="h-4 w-4 text-muted-foreground" />
                            {envio.peso} kg
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(envio.precio)}
                        </TableCell>
                        <TableCell>{formatDate(envio.createdAt)}</TableCell>
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
                                  setUsuarioAsignado(envio.usuarioId || "");
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
              {/* Paginación */}
              {pagination && (
                <div className="mt-4">
                  <Paginator
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={(p) => setFiltros({ ...filtros, page: p })}
                    limit={pagination.limit}
                    total={pagination.total}
                    entityLabel="envíos"
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      {/* Modal Crear Envío (v2) */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Nuevo Envío
            </DialogTitle>
            <DialogDescription>
              Completa los pasos para registrar el envío.
            </DialogDescription>
          </DialogHeader>
          <FormularioEnvioV2
            cotizacion={cotizacionPrevia}
            onSubmit={handleCreateEnvio}
          />
        </DialogContent>
      </Dialog>
      {/* Modal Detalle de Envío */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" /> Detalle del Envío
            </DialogTitle>
            <DialogDescription>
              Información completa del envío {selectedEnvio?.numeroGuia}
            </DialogDescription>
          </DialogHeader>
          {selectedEnvio && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Información General */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Información General
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Número de Guía:
                      </span>
                      <span className="font-medium">
                        {selectedEnvio.numeroGuia}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estado:</span>
                      {getEstadoBadge(selectedEnvio.estado)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Tipo de Servicio:
                      </span>
                      <span className="font-medium">
                        {selectedEnvio.tipoServicio}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modalidad:</span>
                      <span className="font-medium">
                        {
                          modalidades.find(
                            (m) => m.value === selectedEnvio.modalidad
                          )?.label
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Fecha de Creación:
                      </span>
                      <span className="font-medium">
                        {formatDate(selectedEnvio.createdAt)}
                      </span>
                    </div>
                    {selectedEnvio.fechaEntrega && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Fecha de Entrega:
                        </span>
                        <span className="font-medium">
                          {formatDate(selectedEnvio.fechaEntrega)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {/* ✅ Remitente */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" /> Remitente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre:</span>
                      <span className="font-medium">
                        {selectedEnvio?.cliente?.tipoDocumento === "RUC"
                          ? selectedEnvio?.cliente?.razonSocial ||
                            "No especificado"
                          : selectedEnvio.remitenteNombre ||
                            selectedEnvio?.cliente?.nombre ||
                            "No especificado"}
                      </span>
                    </div>
                    {/* Mostrar documento del remitente directo o del cliente */}
                    {selectedEnvio.remitenteTipoDocumento &&
                    selectedEnvio.remitenteNumeroDocumento ? (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Documento:
                        </span>
                        <span className="font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {selectedEnvio.remitenteTipoDocumento === "RUC"
                            ? `RUC: ${selectedEnvio.remitenteNumeroDocumento}`
                            : `${selectedEnvio.remitenteTipoDocumento}: ${selectedEnvio.remitenteNumeroDocumento}`}
                        </span>
                      </div>
                    ) : (
                      selectedEnvio?.cliente?.tipoDocumento &&
                      (selectedEnvio?.cliente?.ruc ||
                        selectedEnvio?.cliente?.numeroDocumento) && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Documento:
                          </span>
                          <span className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {selectedEnvio?.cliente?.tipoDocumento === "RUC"
                              ? `RUC: ${
                                  selectedEnvio?.cliente?.ruc ||
                                  selectedEnvio?.cliente?.numeroDocumento
                                }`
                              : `${selectedEnvio?.cliente?.tipoDocumento}: ${selectedEnvio?.cliente?.numeroDocumento}`}
                          </span>
                        </div>
                      )
                    )}
                    {selectedEnvio.remitenteTelefono && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Teléfono:</span>
                        <span className="font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {selectedEnvio.remitenteTelefono}
                        </span>
                      </div>
                    )}
                    {selectedEnvio.remitenteEmail && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {selectedEnvio.remitenteEmail}
                        </span>
                      </div>
                    )}
                    {(selectedEnvio.modalidad === "DOMICILIO_SUCURSAL" ||
                      selectedEnvio.modalidad === "DOMICILIO_DOMICILIO") &&
                      selectedEnvio.remitenteDireccion && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Dirección:
                          </span>
                          <span className="font-medium">
                            {selectedEnvio.remitenteDireccion}
                          </span>
                        </div>
                      )}
                  </CardContent>
                </Card>
                {/* ✅ Destinatario */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" /> Destinatario
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre:</span>
                      <span className="font-medium">
                        {selectedEnvio.destinatarioNombre || "No especificado"}
                      </span>
                    </div>
                    {selectedEnvio?.destinatarioTipoDocumento &&
                      selectedEnvio?.destinatarioNumeroDocumento && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Documento:
                          </span>
                          <span className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {selectedEnvio?.destinatarioTipoDocumento === "RUC"
                              ? `RUC: ${selectedEnvio?.destinatarioNumeroDocumento}`
                              : `${selectedEnvio?.destinatarioTipoDocumento}: ${selectedEnvio?.destinatarioNumeroDocumento}`}
                          </span>
                        </div>
                      )}
                    {selectedEnvio.destinatarioTelefono && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Teléfono:</span>
                        <span className="font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {selectedEnvio.destinatarioTelefono}
                        </span>
                      </div>
                    )}
                    {selectedEnvio.destinatarioEmail && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {selectedEnvio.destinatarioEmail}
                        </span>
                      </div>
                    )}
                    {(selectedEnvio.modalidad === "SUCURSAL_DOMICILIO" ||
                      selectedEnvio.modalidad === "DOMICILIO_DOMICILIO") &&
                      selectedEnvio.destinatarioDireccion && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Dirección:
                          </span>
                          <span className="font-medium">
                            {selectedEnvio.destinatarioDireccion}
                          </span>
                        </div>
                      )}
                  </CardContent>
                </Card>
                {/* Origen */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" /> Origen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sucursal:</span>
                      <span className="font-medium">
                        {selectedEnvio.sucursal_origen.nombre}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Provincia:</span>
                      <span className="font-medium">
                        {selectedEnvio.sucursal_origen.provincia}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dirección:</span>
                      <span className="font-medium">
                        {selectedEnvio.sucursal_origen.direccion}
                      </span>
                    </div>
                    {selectedEnvio.direccionOrigen && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Dir. Recojo:
                          </span>
                          <span className="font-medium">
                            {selectedEnvio.direccionOrigen}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Contacto:
                          </span>
                          <span className="font-medium">
                            {selectedEnvio.contactoOrigen}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Teléfono:
                          </span>
                          <span className="font-medium">
                            {selectedEnvio.telefonoOrigen}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                {/* Destino */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" /> Destino
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sucursal:</span>
                      <span className="font-medium">
                        {selectedEnvio.sucursal_destino.nombre}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Provincia:</span>
                      <span className="font-medium">
                        {selectedEnvio.sucursal_destino.provincia}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dirección:</span>
                      <span className="font-medium">
                        {selectedEnvio.sucursal_destino.direccion}
                      </span>
                    </div>
                    {selectedEnvio.direccionDestino && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Dir. Entrega:
                          </span>
                          <span className="font-medium">
                            {selectedEnvio.direccionDestino}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Contacto:
                          </span>
                          <span className="font-medium">
                            {selectedEnvio.contactoDestino}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Teléfono:
                          </span>
                          <span className="font-medium">
                            {selectedEnvio.telefonoDestino}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                {/* Cliente de Facturación */}
                {(selectedEnvio?.clienteFacturacion ||
                  selectedEnvio?.clienteFacturacionNombre ||
                  selectedEnvio?.clienteFacturacionRazonSocial) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5" /> Cliente de Facturación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nombre:</span>
                        <span className="font-medium">
                          {(() => {
                            const cf = selectedEnvio?.clienteFacturacion;
                            const tipo =
                              cf?.tipoDocumento ||
                              selectedEnvio?.clienteFacturacionTipoDocumento;
                            if (tipo === "RUC") {
                              return (
                                cf?.razonSocial ||
                                selectedEnvio?.clienteFacturacionRazonSocial ||
                                "No especificado"
                              );
                            }
                            return (
                              cf?.nombre ||
                              selectedEnvio?.clienteFacturacionNombre ||
                              "No especificado"
                            );
                          })()}
                        </span>
                      </div>
                      {(() => {
                        const cf = selectedEnvio?.clienteFacturacion;
                        const tipo =
                          cf?.tipoDocumento ||
                          selectedEnvio?.clienteFacturacionTipoDocumento;
                        const numero =
                          tipo === "RUC"
                            ? cf?.ruc ||
                              selectedEnvio?.clienteFacturacionRuc ||
                              selectedEnvio?.clienteFacturacionNumeroDocumento
                            : cf?.numeroDocumento ||
                              selectedEnvio?.clienteFacturacionNumeroDocumento;
                        return tipo && numero ? (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Documento:
                            </span>
                            <span className="font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              {tipo === "RUC"
                                ? `RUC: ${numero}`
                                : `${tipo}: ${numero}`}
                            </span>
                          </div>
                        ) : null;
                      })()}
                      {(() => {
                        const cf = selectedEnvio?.clienteFacturacion;
                        const telefono =
                          cf?.telefono ||
                          selectedEnvio?.clienteFacturacionTelefono;
                        return telefono ? (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Teléfono:
                            </span>
                            <span className="font-medium flex items-center gap-2">
                              <Phone className="h-4 w-4" /> {telefono}
                            </span>
                          </div>
                        ) : null;
                      })()}
                      {(() => {
                        const cf = selectedEnvio?.clienteFacturacion;
                        const email =
                          cf?.email || selectedEnvio?.clienteFacturacionEmail;
                        return email ? (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Email:
                            </span>
                            <span className="font-medium flex items-center gap-2">
                              <Mail className="h-4 w-4" /> {email}
                            </span>
                          </div>
                        ) : null;
                      })()}
                      {(() => {
                        const cf = selectedEnvio?.clienteFacturacion;
                        const direccion =
                          cf?.direccion ||
                          selectedEnvio?.clienteFacturacionDireccion;
                        return direccion ? (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Dirección:
                            </span>
                            <span className="font-medium">{direccion}</span>
                          </div>
                        ) : null;
                      })()}
                    </CardContent>
                  </Card>
                )}
                {/* Responsable de Recojo */}
                {(selectedEnvio?.responsableRecojoNombre ||
                  selectedEnvio?.responsableRecojoTelefono ||
                  selectedEnvio?.responsableRecojoEmail ||
                  selectedEnvio?.responsableRecojoDireccion ||
                  selectedEnvio?.responsableRecojoEmpresa) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" /> Responsable de Recojo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nombre:</span>
                        <span className="font-medium">
                          {`${
                            selectedEnvio?.responsableRecojoNombre ||
                            "No especificado"
                          }${
                            selectedEnvio?.responsableRecojoApellidos
                              ? ` ${selectedEnvio.responsableRecojoApellidos}`
                              : ""
                          }`}
                        </span>
                      </div>
                      {selectedEnvio?.responsableRecojoTipoDocumento &&
                        selectedEnvio?.responsableRecojoNumeroDocumento && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Documento:
                            </span>
                            <span className="font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              {`${selectedEnvio.responsableRecojoTipoDocumento}: ${selectedEnvio.responsableRecojoNumeroDocumento}`}
                            </span>
                          </div>
                        )}
                      {selectedEnvio?.responsableRecojoTelefono && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Teléfono:
                          </span>
                          <span className="font-medium flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {selectedEnvio.responsableRecojoTelefono}
                          </span>
                        </div>
                      )}
                      {selectedEnvio?.responsableRecojoEmail && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {selectedEnvio.responsableRecojoEmail}
                          </span>
                        </div>
                      )}
                      {selectedEnvio?.responsableRecojoDireccion && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Dirección:
                          </span>
                          <span className="font-medium">
                            {selectedEnvio.responsableRecojoDireccion}
                          </span>
                        </div>
                      )}
                      {(selectedEnvio?.responsableRecojoEmpresa ||
                        selectedEnvio?.responsableRecojoCargo) && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Empresa / Cargo:
                          </span>
                          <span className="font-medium">
                            {`${selectedEnvio?.responsableRecojoEmpresa || ""}${
                              selectedEnvio?.responsableRecojoCargo
                                ? ` - ${selectedEnvio.responsableRecojoCargo}`
                                : ""
                            }`}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                {/* Detalles del Paquete */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" /> Detalles del Paquete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peso:</span>
                      <span className="font-medium">
                        {selectedEnvio.peso} kg
                      </span>
                    </div>
                    {selectedEnvio.pesoVolumetrico > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Peso Volumétrico:
                        </span>
                        <span className="font-medium">
                          {selectedEnvio.pesoVolumetrico} kg
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Peso Facturado:
                      </span>
                      <span className="font-medium">
                        {selectedEnvio.pesoFacturado} kg
                      </span>
                    </div>
                    {(selectedEnvio.largo ||
                      selectedEnvio.ancho ||
                      selectedEnvio.alto) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Dimensiones:
                        </span>
                        <span className="font-medium">
                          {selectedEnvio.largo} x {selectedEnvio.ancho} x
                          {selectedEnvio.alto} cm
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Descripción:
                      </span>
                      <span className="font-medium">
                        {selectedEnvio.descripcion}
                      </span>
                    </div>
                    {selectedEnvio.valorDeclarado && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Valor Declarado:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(selectedEnvio.valorDeclarado)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {/* Costos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" /> Costos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">
                        {formatCurrency(selectedEnvio.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IGV:</span>
                      <span className="font-medium">
                        {formatCurrency(selectedEnvio.igv)}
                      </span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedEnvio.precio)}</span>
                    </div>
                    {selectedEnvio.tiempoEstimado && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Tiempo Estimado:
                        </span>
                        <span className="font-medium">
                          {selectedEnvio.tiempoEstimado}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              {/* Seguimiento */}
              {selectedEnvio.eventos && selectedEnvio.eventos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" /> Seguimiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedEnvio.eventos.map((evento, index) => (
                        <div key={evento.id} className="flex items-start gap-4">
                          <div className="shrink-0">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                            {index < selectedEnvio.eventos.length - 1 && (
                              <div className="w-0.5 h-8 bg-gray-200 ml-1 mt-1"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{evento.evento}</h4>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(evento.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {evento.descripcion}
                            </p>
                            {evento.ubicacion && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {evento.ubicacion}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {selectedEnvio.observaciones && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" /> Observaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedEnvio.observaciones}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal Actualizar Estado */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" /> Actualizar Estado del Envío
            </DialogTitle>
            <DialogDescription>
              Cambiar el estado del envío {selectedEnvio?.numeroGuia}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nuevoEstado">Nuevo Estado *</Label>
              <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {estadosEnvio.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      <div className="flex items-center gap-2">
                        <estado.icon className="h-4 w-4" /> {estado.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcionEvento">Descripción</Label>
              <Textarea
                id="descripcionEvento"
                placeholder="Descripción del evento (opcional)"
                value={descripcionEvento}
                onChange={(e) => setDescripcionEvento(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ubicacionEvento">Ubicación</Label>
              <Input
                id="ubicacionEvento"
                placeholder="Ubicación actual (opcional)"
                value={ubicacionEvento}
                onChange={(e) => setUbicacionEvento(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={saving || !nuevoEstado}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" /> Actualizar Estado
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal Asignar Usuario */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Asignar Envío
            </DialogTitle>
            <DialogDescription>
              Asignar el envío {selectedEnvio?.numeroGuia} a un
              usuario/conductor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usuarioAsignado">Usuario/Conductor *</Label>
              <Select
                value={usuarioAsignado}
                onValueChange={setUsuarioAsignado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.name} - {usuario.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssignUser}
              disabled={saving || !usuarioAsignado}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Asignando...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" /> Asignar Envío
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
