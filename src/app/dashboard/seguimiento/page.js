"use client";
import { useState } from "react";
import { formatDateTime } from "@/lib/utils/formatters";
import { getSeguimientoPublicoMejorado } from "@/lib/actions/seguimiento-mejorado";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Package,
  MapPin,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  Calendar,
  Weight,
  FileText,
  Navigation,
  Building,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
const estadosConfig = {
  REGISTRADO: {
    label: "Registrado",
    color: "bg-blue-500",
    icon: FileText,
    description: "El envío ha sido registrado en el sistema",
  },
  RECOLECTADO: {
    label: "Recolectado",
    color: "bg-orange-500",
    icon: Package,
    description: "El paquete ha sido recolectado",
  },
  EN_AGENCIA_ORIGEN: {
    label: "En Agencia Origen",
    color: "bg-yellow-500",
    icon: Building,
    description: "El paquete está en la agencia de origen",
  },
  EN_TRANSITO: {
    label: "En Tránsito",
    color: "bg-purple-500",
    icon: Truck,
    description: "El paquete está en camino al destino",
  },
  EN_AGENCIA_DESTINO: {
    label: "En Agencia Destino",
    color: "bg-indigo-500",
    icon: Building,
    description: "El paquete ha llegado a la agencia de destino",
  },
  EN_REPARTO: {
    label: "En Reparto",
    color: "bg-cyan-500",
    icon: Navigation,
    description: "El paquete está siendo entregado",
  },
  ENTREGADO: {
    label: "Entregado",
    color: "bg-green-500",
    icon: CheckCircle,
    description: "El paquete ha sido entregado exitosamente",
  },
  DEVUELTO: {
    label: "Devuelto",
    color: "bg-red-500",
    icon: AlertCircle,
    description: "El paquete ha sido devuelto",
  },
  CANCELADO: {
    label: "Cancelado",
    color: "bg-gray-500",
    icon: AlertCircle,
    description: "El envío ha sido cancelado",
  },
};
const tiposServicioLabels = {
  NORMAL: "Normal",
  EXPRESS: "Express",
  OVERNIGHT: "Overnight",
  ECONOMICO: "Económico",
};
const modalidadLabels = {
  SUCURSAL_SUCURSAL: "Sucursal a Sucursal",
  SUCURSAL_DOMICILIO: "Sucursal a Domicilio",
  DOMICILIO_SUCURSAL: "Domicilio a Sucursal",
  DOMICILIO_DOMICILIO: "Domicilio a Domicilio",
};
export default function SeguimientoPage() {
  const [guia, setGuia] = useState("");
  const [loading, setLoading] = useState(false);
  const [envio, setEnvio] = useState(null);
  const [error, setError] = useState("");
  const buscarEnvio = async () => {
    if (!guia.trim()) {
      toast.error("Ingresa un número de guía");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setEnvio(null);
      const result = await getSeguimientoPublicoMejorado(
        guia.trim().toUpperCase()
      );
      if (result.success) {
        setEnvio(result.data);
        toast.success("Envío encontrado");
      } else {
        setError(result.error || "Envío no encontrado");
        toast.error(result.error || "Envío no encontrado");
      }
    } catch (error) {
      setError("Error al buscar el envío");
      toast.error("Error al buscar el envío");
    } finally {
      setLoading(false);
    }
  };
  const limpiarBusqueda = () => {
    setGuia("");
    setEnvio(null);
    setError("");
  };
  const getEstadoBadgeVariant = (estado) => {
    const config = estadosConfig[estado];
    if (!config) return "secondary";
    if (estado === "ENTREGADO") return "default";
    if (estado === "CANCELADO" || estado === "DEVUELTO") return "destructive";
    return "secondary";
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Seguimiento de Envíos
          </h1>
          <p className="text-muted-foreground">
            Rastrea el estado de tus envíos en tiempo real
          </p>
        </div>
      </div>
      {/* Buscador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> Buscar Envío
          </CardTitle>
          <CardDescription>
            Ingresa el número de guía para rastrear tu envío
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="guia">Número de Guía</Label>
              <Input
                id="guia"
                placeholder="Ej: CG2025000001"
                value={guia}
                onChange={(e) => setGuia(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && buscarEnvio()}
                className="mt-1"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={buscarEnvio} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Buscar
              </Button>
              <Button variant="outline" onClick={limpiarBusqueda}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Resultado del Seguimiento */}
      {envio && (
        <div className="space-y-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" /> Guía: {envio.guia}
                </CardTitle>
                <Badge variant={getEstadoBadgeVariant(envio.estado)}>
                  {estadosConfig[envio.estado]?.label || envio.estado}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progreso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso del envío</span> <span>{envio.progreso}%</span>
                </div>
                <Progress value={envio.progreso} className="h-2" />
              </div>
              {/* Información del Envío */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Fechas
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Registrado:</strong>
                      {formatDateTime(envio.fechaRegistro)}
                    </p>
                    {envio.fechaEntrega && (
                      <p>
                        <strong>Entregado:</strong>
                        {formatDateTime(envio.fechaEntrega)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Truck className="h-4 w-4" /> Servicio
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Tipo:</strong>
                      {tiposServicioLabels[envio.tipoServicio] ||
                        envio.tipoServicio}
                    </p>
                    <p>
                      <strong>Modalidad:</strong>
                      {modalidadLabels[envio.modalidad] || envio.modalidad}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Weight className="h-4 w-4" /> Paquete
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Peso:</strong> {envio.peso} kg
                    </p>
                    {envio.descripcion && (
                      <p>
                        <strong>Descripción:</strong> {envio.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Remitente y Destinatario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Remitente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">
                    {envio.remitente.nombre || "No especificado"}
                  </p>
                </div>
                {envio.remitente.tipoDocumento &&
                  envio.remitente.numeroDocumento && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {envio.remitente.tipoDocumento}:
                        {envio.remitente.numeroDocumento}
                      </span>
                    </div>
                  )}
                {envio.remitente.telefono &&
                  envio.remitente.telefono !== "No especificado" && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{envio.remitente.telefono}</span>
                    </div>
                  )}
                {envio.remitente.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">✉️</span>
                    <span className="text-sm">{envio.remitente.email}</span>
                  </div>
                )}
                {envio.remitente.direccion && (
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="text-sm">{envio.remitente.direccion}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Destinatario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">
                    {envio.destinatario.nombre || "No especificado"}
                  </p>
                </div>
                {envio.destinatario.telefono &&
                  envio.destinatario.telefono !== "No especificado" && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{envio.destinatario.telefono}</span>
                    </div>
                  )}
                {envio.destinatario.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">✉️</span>
                    <span className="text-sm">{envio.destinatario.email}</span>
                  </div>
                )}
                {envio.destinatario.direccion && (
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="text-sm">{envio.destinatario.direccion}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Ruta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Ruta del Envío
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className="w-3 h-3 bg-primary rounded-full mx-auto mb-2"></div>
                  <h4 className="font-semibold">Origen</h4>
                  <p className="text-sm text-muted-foreground">
                    {envio.sucursalOrigen?.nombre || "No especificado"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {envio.sucursalOrigen?.provincia || "N/A"}
                  </p>
                </div>
                <div className="flex-1 flex justify-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center flex-1">
                  <div className="w-3 h-3 bg-primary rounded-full mx-auto mb-2"></div>
                  <h4 className="font-semibold">Destino</h4>
                  <p className="text-sm text-muted-foreground">
                    {envio.sucursalDestino?.nombre || "No especificado"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {envio.sucursalDestino?.provincia || "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Historial de Eventos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Historial de Eventos
              </CardTitle>
              <CardDescription>Seguimiento detallado del envío</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {envio.eventos.map((evento, index) => {
                  const config = estadosConfig[evento.estado];
                  const IconComponent = config?.icon || AlertCircle;
                  return (
                    <div key={evento.id || index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            config?.color || "bg-gray-500"
                          }`}
                        >
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        {index < envio.eventos.length - 1 && (
                          <div className="w-px h-8 bg-border mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold">
                            {config?.label || evento.estado}
                          </h4>
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(
                              evento.fechaEvento || evento.createdAt
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {evento.descripcion}
                        </p>
                        {evento.comentario && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <strong>Comentario:</strong> {evento.comentario}
                          </p>
                        )}
                        {evento.ubicacion && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                            <MapPin className="h-3 w-3" /> {evento.ubicacion}
                          </p>
                        )}
                        {evento.direccion && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                            <Navigation className="h-3 w-3" />
                            {evento.direccion}
                          </p>
                        )}
                        {evento.responsable &&
                          evento.responsable !== "Sistema" && (
                            <p className="text-sm text-muted-foreground">
                              <strong>Responsable:</strong> {evento.responsable}
                            </p>
                          )}
                        {/* Mostrar archivos adjuntos si existen */}
                        <div className="flex gap-2 mt-2">
                          {evento.fotoUrl && (
                            <a
                              href={evento.fotoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                            >
                              📷 Ver foto
                            </a>
                          )}
                          {evento.firmaUrl && (
                            <a
                              href={evento.firmaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                            >
                              ✍️ Ver firma
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Información de ayuda cuando no hay búsqueda */}
      {!envio && !error && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Rastrea tu envío</h3>
              <p className="text-muted-foreground mb-4">
                Ingresa el número de guía en el campo de búsqueda para ver el
                estado actual y el historial completo de tu envío.
              </p>
              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>Ejemplo de guía:</strong> CG2025000001
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
