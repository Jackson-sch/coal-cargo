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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Save,
  RefreshCw,
  AlertTriangle,
  Settings,
  RotateCcw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  obtenerConfiguracionNotificaciones,
  actualizarConfiguracionNotificaciones,
  getNotificaciones,
  getEstadisticasNotificaciones,
  reintentarNotificacion,
  cancelarNotificacion,
} from "@/lib/actions/notificaciones";
import Paginator from "@/components/ui/paginator";

const tipoNotificacionLabels = {
  REGISTRO_ENVIO: "Registro de Envío",
  CAMBIO_ESTADO: "Cambio de Estado",
  ENTREGA_EXITOSA: "Entrega Exitosa",
  INTENTO_ENTREGA: "Intento de Entrega",
  RETRASO: "Retraso",
  PROBLEMA: "Problema",
  RECORDATORIO: "Recordatorio",
  CONFIRMACION_RECOLECCION: "Confirmación de Recolección",
};

const canalNotificacionIcons = {
  EMAIL: Mail,
  SMS: MessageSquare,
  WHATSAPP: MessageSquare,
  PUSH: Bell,
  LLAMADA: Phone,
};

const estadoNotificacionConfig = {
  PENDIENTE: { label: "Pendiente", variant: "secondary", icon: Clock },
  ENVIADA: { label: "Enviada", variant: "default", icon: Send },
  ENTREGADA: { label: "Entregada", variant: "default", icon: CheckCircle },
  FALLIDA: { label: "Fallida", variant: "destructive", icon: XCircle },
  CANCELADA: { label: "Cancelada", variant: "outline", icon: X },
};

export default function ConfiguracionNotificacionesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configuracion, setConfiguracion] = useState({
    email: false,
    sms: false,
    whatsapp: false,
    push: false,
    llamada: false,
    autoRegistro: false,
    autoCambioEstado: false,
    autoEntrega: false,
    autoIntento: false,
    autoRetraso: false,
    autoProblema: false,
    autoRecordatorio: false,
    maxIntentos: 3,
    reintentoIntervalo: 60,
    plantillaEmail: "",
    plantillaSMS: "",
    plantillaWhatsApp: "",
  });

  // Estado para notificaciones
  const [notificaciones, setNotificaciones] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });
  const [estadisticas, setEstadisticas] = useState(null);
  const [loadingNotificaciones, setLoadingNotificaciones] = useState(false);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [filtroCanal, setFiltroCanal] = useState("TODOS");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");

  // Cargar configuración inicial
  useEffect(() => {
    cargarConfiguracion();
    cargarEstadisticas();
  }, []);

  // Cargar notificaciones cuando cambien los filtros
  useEffect(() => {
    cargarNotificaciones();
  }, [filtroEstado, filtroCanal, filtroTipo, pagination.page]);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      const result = await obtenerConfiguracionNotificaciones();
      if (result.success) {
        setConfiguracion(result.data);
      } else {
        toast.error(result.error || "Error al cargar configuración");
      }
    } catch (error) {
      toast.error("Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const result = await getEstadisticasNotificaciones();
      if (result.success) {
        setEstadisticas(result.data);
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  const cargarNotificaciones = async () => {
    try {
      setLoadingNotificaciones(true);
      const result = await getNotificaciones({
        estado: filtroEstado,
        canal: filtroCanal,
        tipo: filtroTipo,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (result.success) {
        setNotificaciones(result.data.notificaciones);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.error || "Error al cargar notificaciones");
      }
    } catch (error) {
      toast.error("Error al cargar notificaciones");
    } finally {
      setLoadingNotificaciones(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await actualizarConfiguracionNotificaciones(configuracion);
      if (result.success) {
        toast.success(result.message || "Configuración guardada correctamente");
        await cargarEstadisticas();
      } else {
        toast.error(result.error || "Error al guardar configuración");
      }
    } catch (error) {
      toast.error("Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleReintentar = async (notificacionId) => {
    try {
      const result = await reintentarNotificacion(notificacionId);
      if (result.success) {
        toast.success(result.message || "Notificación marcada para reintento");
        await cargarNotificaciones();
        await cargarEstadisticas();
      } else {
        toast.error(result.error || "Error al reintentar notificación");
      }
    } catch (error) {
      toast.error("Error al reintentar notificación");
    }
  };

  const handleCancelar = async (notificacionId) => {
    try {
      const result = await cancelarNotificacion(notificacionId);
      if (result.success) {
        toast.success(result.message || "Notificación cancelada");
        await cargarNotificaciones();
        await cargarEstadisticas();
      } else {
        toast.error(result.error || "Error al cancelar notificación");
      }
    } catch (error) {
      toast.error("Error al cancelar notificación");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Configuración de Notificaciones
          </h1>
          <p className="text-muted-foreground">
            Gestiona los canales y configuraciones de notificaciones del sistema
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Cambios
        </Button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {estadisticas.pendientes}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
              <Send className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {estadisticas.enviadas}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {estadisticas.entregadas}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fallidas</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {estadisticas.fallidas}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuración de Canales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Canales de Notificación
            </CardTitle>
            <CardDescription>
              Activa o desactiva los canales de notificación disponibles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Notificaciones por Email
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enviar notificaciones por correo electrónico
                </p>
              </div>
              <Switch
                checked={configuracion.email}
                onCheckedChange={(checked) =>
                  setConfiguracion({ ...configuracion, email: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notificaciones por SMS
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enviar notificaciones por mensaje de texto
                </p>
              </div>
              <Switch
                checked={configuracion.sms}
                onCheckedChange={(checked) =>
                  setConfiguracion({ ...configuracion, sms: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notificaciones por WhatsApp
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enviar notificaciones por WhatsApp
                </p>
              </div>
              <Switch
                checked={configuracion.whatsapp}
                onCheckedChange={(checked) =>
                  setConfiguracion({ ...configuracion, whatsapp: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificaciones Push
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enviar notificaciones push (aplicación móvil)
                </p>
              </div>
              <Switch
                checked={configuracion.push}
                onCheckedChange={(checked) =>
                  setConfiguracion({ ...configuracion, push: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Notificaciones por Llamada
                </Label>
                <p className="text-sm text-muted-foreground">
                  Realizar llamadas automáticas para notificaciones importantes
                </p>
              </div>
              <Switch
                checked={configuracion.llamada}
                onCheckedChange={(checked) =>
                  setConfiguracion({ ...configuracion, llamada: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Notificaciones Automáticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones Automáticas
            </CardTitle>
            <CardDescription>
              Configura qué eventos generan notificaciones automáticas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Registro de Envío</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar cuando se registra un nuevo envío
                </p>
              </div>
              <Switch
                checked={configuracion.autoRegistro}
                onCheckedChange={(checked) =>
                  setConfiguracion({ ...configuracion, autoRegistro: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cambio de Estado</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar cuando cambia el estado de un envío
                </p>
              </div>
              <Switch
                checked={configuracion.autoCambioEstado}
                onCheckedChange={(checked) =>
                  setConfiguracion({
                    ...configuracion,
                    autoCambioEstado: checked,
                  })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Entrega Exitosa</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar cuando un envío es entregado exitosamente
                </p>
              </div>
              <Switch
                checked={configuracion.autoEntrega}
                onCheckedChange={(checked) =>
                  setConfiguracion({ ...configuracion, autoEntrega: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Intento de Entrega</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar cuando hay un intento de entrega
                </p>
              </div>
              <Switch
                checked={configuracion.autoIntento}
                onCheckedChange={(checked) =>
                  setConfiguracion({ ...configuracion, autoIntento: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Retraso</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar cuando hay un retraso en la entrega
                </p>
              </div>
              <Switch
                checked={configuracion.autoRetraso}
                onCheckedChange={(checked) =>
                  setConfiguracion({ ...configuracion, autoRetraso: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Problema</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar cuando hay un problema con el envío
                </p>
              </div>
              <Switch
                checked={configuracion.autoProblema}
                onCheckedChange={(checked) =>
                  setConfiguracion({ ...configuracion, autoProblema: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Recordatorio</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar recordatorios automáticos
                </p>
              </div>
              <Switch
                checked={configuracion.autoRecordatorio}
                onCheckedChange={(checked) =>
                  setConfiguracion({
                    ...configuracion,
                    autoRecordatorio: checked,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuración Avanzada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración Avanzada
          </CardTitle>
          <CardDescription>
            Configura los parámetros de reintentos y plantillas de mensajes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Máximo de Intentos</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={configuracion.maxIntentos}
                onChange={(e) =>
                  setConfiguracion({
                    ...configuracion,
                    maxIntentos: parseInt(e.target.value) || 3,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Número máximo de intentos antes de marcar como fallida
              </p>
            </div>
            <div className="space-y-2">
              <Label>Intervalo de Reintento (minutos)</Label>
              <Input
                type="number"
                min="1"
                value={configuracion.reintentoIntervalo}
                onChange={(e) =>
                  setConfiguracion({
                    ...configuracion,
                    reintentoIntervalo: parseInt(e.target.value) || 60,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Tiempo de espera entre reintentos
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plantilla de Email</Label>
              <Textarea
                placeholder="Plantilla para notificaciones por email..."
                value={configuracion.plantillaEmail}
                onChange={(e) =>
                  setConfiguracion({
                    ...configuracion,
                    plantillaEmail: e.target.value,
                  })
                }
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Usa variables como {`{guia}`}, {`{cliente}`}, {`{estado}`}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Plantilla de SMS</Label>
              <Textarea
                placeholder="Plantilla para notificaciones por SMS..."
                value={configuracion.plantillaSMS}
                onChange={(e) =>
                  setConfiguracion({
                    ...configuracion,
                    plantillaSMS: e.target.value,
                  })
                }
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Máximo 160 caracteres recomendado
              </p>
            </div>
            <div className="space-y-2">
              <Label>Plantilla de WhatsApp</Label>
              <Textarea
                placeholder="Plantilla para notificaciones por WhatsApp..."
                value={configuracion.plantillaWhatsApp}
                onChange={(e) =>
                  setConfiguracion({
                    ...configuracion,
                    plantillaWhatsApp: e.target.value,
                  })
                }
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Plantilla para mensajes de WhatsApp
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Notificaciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historial de Notificaciones</CardTitle>
              <CardDescription>
                Lista de todas las notificaciones enviadas por el sistema
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarNotificaciones}
              disabled={loadingNotificaciones}
            >
              {loadingNotificaciones ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-4 flex-wrap">
            <div className="space-y-2">
              <Label className="text-sm">Estado</Label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                  <SelectItem value="ENVIADA">Enviadas</SelectItem>
                  <SelectItem value="ENTREGADA">Entregadas</SelectItem>
                  <SelectItem value="FALLIDA">Fallidas</SelectItem>
                  <SelectItem value="CANCELADA">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Canal</Label>
              <Select value={filtroCanal} onValueChange={setFiltroCanal}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="PUSH">Push</SelectItem>
                  <SelectItem value="LLAMADA">Llamada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="REGISTRO_ENVIO">Registro de Envío</SelectItem>
                  <SelectItem value="CAMBIO_ESTADO">Cambio de Estado</SelectItem>
                  <SelectItem value="ENTREGA_EXITOSA">Entrega Exitosa</SelectItem>
                  <SelectItem value="INTENTO_ENTREGA">Intento de Entrega</SelectItem>
                  <SelectItem value="RETRASO">Retraso</SelectItem>
                  <SelectItem value="PROBLEMA">Problema</SelectItem>
                  <SelectItem value="RECORDATORIO">Recordatorio</SelectItem>
                  <SelectItem value="CONFIRMACION_RECOLECCION">
                    Confirmación de Recolección
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabla */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guía</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Intentos</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead>Enviada</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingNotificaciones ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : notificaciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Bell className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          No hay notificaciones que coincidan con los filtros
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  notificaciones.map((notificacion) => {
                    const estadoConfig =
                      estadoNotificacionConfig[notificacion.estado];
                    const CanalIcon =
                      canalNotificacionIcons[notificacion.canal] || Bell;
                    const EstadoIcon = estadoConfig?.icon || AlertTriangle;

                    return (
                      <TableRow key={notificacion.id}>
                        <TableCell className="font-medium">
                          {notificacion.envio?.guia || "N/A"}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {tipoNotificacionLabels[notificacion.tipo] ||
                              notificacion.tipo}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CanalIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{notificacion.canal}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {notificacion.destinatario}
                        </TableCell>
                        <TableCell>
                          <Badge variant={estadoConfig?.variant || "secondary"}>
                            <EstadoIcon className="h-3 w-3 mr-1" />
                            {estadoConfig?.label || notificacion.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{notificacion.intentos}</span>
                            <span className="text-muted-foreground">
                              / {notificacion.maxIntentos}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(notificacion.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(notificacion.enviadaEn)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {notificacion.estado === "FALLIDA" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleReintentar(notificacion.id)
                                }
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            )}
                            {notificacion.estado === "PENDIENTE" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelar(notificacion.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <Paginator
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) =>
                  setPagination({ ...pagination, page })
                }
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

