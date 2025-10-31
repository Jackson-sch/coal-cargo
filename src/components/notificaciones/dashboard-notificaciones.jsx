"use client";
import { useState, useEffect } from "react";
import { procesarNotificacionesPendientes } from "@/lib/actions/seguimiento-mejorado";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
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
  CANCELADA: { label: "Cancelada", variant: "outline", icon: XCircle },
};
export default function DashboardNotificaciones({
  notificaciones: initialNotificaciones = [],
}) {
  const [notificaciones, setNotificaciones] = useState(initialNotificaciones);
  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [filtroCanal, setFiltroCanal] = useState("TODOS"); // Filtrar notificacione s
  const notificacionesFiltradas = notificaciones.filter((notif) => {
    const cumpleFiltroEstado =
      filtroEstado === "TODOS" || notif.estado === filtroEstado;
    const cumpleFiltroCanal =
      filtroCanal === "TODOS" || notif.canal === filtroCanal;
    return cumpleFiltroEstado && cumpleFiltroCanal;
  }); // Estadística s
  const estadisticas = {
    total: notificaciones.length,
    pendientes: notificaciones.filter((n) => n.estado === "PENDIENTE").length,
    enviadas: notificaciones.filter((n) => n.estado === "ENVIADA").length,
    fallidas: notificaciones.filter((n) => n.estado === "FALLIDA").length,
    entregadas: notificaciones.filter((n) => n.estado === "ENTREGADA").length,
  };
  const procesarNotificaciones = async () => {
    try {
      setProcesando(true);
      const result = await procesarNotificacionesPendientes();
      if (result.success) {
        toast.success(
          `Procesadas ${result.data.procesadas} notificaciones. ` +
            `Exitosas: ${result.data.exitosas}, Fallidas: ${result.data.fallidas}`
        ); // Actualizar el estado local (en una implementación real, recargarías desde la AP I) // setNotificaciones(prev => ...); // Actualizar según los resultado s
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al procesar notificaciones");
    } finally {
      setProcesando(false);
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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Dashboard de Notificaciones
          </h2>
          <p className="text-muted-foreground">
            Gestiona y monitorea las notificaciones automáticas del sistema
          </p>
        </div>
        <Button
          onClick={procesarNotificaciones}
          disabled={procesando}
          className="flex items-center gap-2"
        >
          {procesando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Procesar Pendientes
        </Button>
      </div>
      {/* Estadísticas */}
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
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
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
              <label className="text-sm font-medium">Canal</label>
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
          </div>
        </CardContent>
      </Card>
      {/* Tabla de Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>
            Lista de todas las notificaciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Envío</TableHead> <TableHead>Tipo</TableHead>
                <TableHead>Canal</TableHead> <TableHead>Destinatario</TableHead>
                <TableHead>Estado</TableHead> <TableHead>Intentos</TableHead>
                <TableHead>Creada</TableHead> <TableHead>Enviada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notificacionesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Bell className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No hay notificaciones que coincidan con los filtros
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                notificacionesFiltradas.map((notificacion) => {
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
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {tipoNotificacionLabels[notificacion.tipo] ||
                              notificacion.tipo}
                          </span>
                        </div>
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
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
