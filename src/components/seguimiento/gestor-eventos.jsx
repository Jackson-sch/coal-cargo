"use client";
import { useState, useEffect } from "react";
import { crearEventoSeguimiento } from "@/lib/actions/seguimiento-mejorado";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  MapPin,
  Camera,
  FileText,
  Thermometer,
  Droplets,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Package,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import {
  crearEvento,
  obtenerEventosEnvio,
} from "@/lib/actions/seguimiento-mejorado";
import { ESTADOS_ENVIO } from "@/lib/constants/estados";
import { formatDate } from "@/lib/utils/formatters";
const estadosDisponibles = [
  { value: "REGISTRADO", label: "Registrado", color: "bg-blue-500" },
  { value: "RECOLECTADO", label: "Recolectado", color: "bg-orange-500" },
  {
    value: "EN_AGENCIA_ORIGEN",
    label: "En Agencia Origen",
    color: "bg-yellow-500",
  },
  { value: "EN_TRANSITO", label: "En Tránsito", color: "bg-purple-500" },
  {
    value: "EN_AGENCIA_DESTINO",
    label: "En Agencia Destino",
    color: "bg-indigo-500",
  },
  { value: "EN_REPARTO", label: "En Reparto", color: "bg-cyan-500" },
  { value: "ENTREGADO", label: "Entregado", color: "bg-green-500" },
  { value: "DEVUELTO", label: "Devuelto", color: "bg-red-500" },
  { value: "CANCELADO", label: "Cancelado", color: "bg-gray-500" },
];
export default function GestorEventos({ envio, onEventoCreado }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    estado: "",
    descripcion: "",
    comentario: "",
    ubicacion: "",
    direccion: "",
    latitud: "",
    longitud: "",
    temperatura: "",
    humedad: "",
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.estado || !formData.descripcion) {
      toast.error("Estado y descripción son obligatorios");
      return;
    }

    try {
      setLoading(true);
      const eventoData = {
        ...formData,
        latitud: formData.latitud ? parseFloat(formData.latitud) : null,
        longitud: formData.longitud ? parseFloat(formData.longitud) : null,
        temperatura: formData.temperatura
          ? parseFloat(formData.temperatura)
          : null,
        humedad: formData.humedad ? parseFloat(formData.humedad) : null,
      };
      const result = await crearEventoSeguimiento(envio.id, eventoData);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setFormData({
          estado: "",
          descripcion: "",
          comentario: "",
          ubicacion: "",
          direccion: "",
          latitud: "",
          longitud: "",
          temperatura: "",
          humedad: "",
        });
        if (onEventoCreado) {
          onEventoCreado(result.data);
        }
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al crear el evento");
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const obtenerUbicacionActual = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitud: position.coords.latitude.toString(),
            longitud: position.coords.longitude.toString(),
          }));
          toast.success("Ubicación obtenida correctamente");
        },
        (error) => {
          toast.error("No se pudo obtener la ubicación");
        }
      );
    } else {
      toast.error("Geolocalización no soportada");
    }
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Gestión de Eventos
            </CardTitle>
            <CardDescription>
              Registra nuevos eventos para el envío {envio.guia}
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Nuevo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Evento</DialogTitle>
                <DialogDescription>
                  Registra un nuevo evento de seguimiento para el envío
                  {envio.guia}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Estado */}
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado *</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) =>
                        handleInputChange("estado", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosDisponibles.map((estado) => (
                          <SelectItem key={estado.value} value={estado.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full ${estado.color}`}
                              ></div>
                              {estado.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Ubicación */}
                  <div className="space-y-2">
                    <Label htmlFor="ubicacion">Ubicación</Label>
                    <Input
                      id="ubicacion"
                      placeholder="Ej: Agencia Lima Centro"
                      value={formData.ubicacion}
                      onChange={(e) =>
                        handleInputChange("ubicacion", e.target.value)
                      }
                    />
                  </div>
                </div>
                {/* Descripción */}
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción *</Label>
                  <Input
                    id="descripcion"
                    placeholder="Descripción del evento"
                    value={formData.descripcion}
                    onChange={(e) =>
                      handleInputChange("descripcion", e.target.value)
                    }
                    required
                  />
                </div>
                {/* Comentario */}
                <div className="space-y-2">
                  <Label htmlFor="comentario">Comentario Adicional</Label>
                  <Textarea
                    id="comentario"
                    placeholder="Información adicional sobre el evento"
                    value={formData.comentario}
                    onChange={(e) =>
                      handleInputChange("comentario", e.target.value)
                    }
                    rows={3}
                  />
                </div>
                {/* Dirección */}
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección Específica</Label>
                  <Input
                    id="direccion"
                    placeholder="Dirección exacta donde ocurrió el evento"
                    value={formData.direccion}
                    onChange={(e) =>
                      handleInputChange("direccion", e.target.value)
                    }
                  />
                </div>
                {/* Coordenadas GPS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitud">Latitud</Label>
                    <Input
                      id="latitud"
                      type="number"
                      step="any"
                      placeholder="-12.0464"
                      value={formData.latitud}
                      onChange={(e) =>
                        handleInputChange("latitud", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitud">Longitud</Label>
                    <Input
                      id="longitud"
                      type="number"
                      step="any"
                      placeholder="-77.0428"
                      value={formData.longitud}
                      onChange={(e) =>
                        handleInputChange("longitud", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={obtenerUbicacionActual}
                      className="w-full"
                    >
                      <MapPin className="h-4 w-4 mr-2" /> Obtener GPS
                    </Button>
                  </div>
                </div>
                {/* Condiciones ambientales (para envíos especiales) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="temperatura"
                      className="flex items-center gap-2"
                    >
                      <Thermometer className="h-4 w-4" /> Temperatura (°C)
                    </Label>
                    <Input
                      id="temperatura"
                      type="number"
                      step="0.1"
                      placeholder="25.5"
                      value={formData.temperatura}
                      onChange={(e) =>
                        handleInputChange("temperatura", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="humedad"
                      className="flex items-center gap-2"
                    >
                      <Droplets className="h-4 w-4" /> Humedad (%)
                    </Label>
                    <Input
                      id="humedad"
                      type="number"
                      step="0.1"
                      placeholder="65.0"
                      value={formData.humedad}
                      onChange={(e) =>
                        handleInputChange("humedad", e.target.value)
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Crear Evento
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Estado actual */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-semibold">Estado Actual</h4>
              <p className="text-sm text-muted-foreground">
                Último estado registrado del envío
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {envio.estado}
            </Badge>
          </div>
          {/* Progreso */}
          {envio.progreso !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso del envío</span> <span>{envio.progreso}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${envio.progreso}%` }}
                ></div>
              </div>
            </div>
          )}
          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Guía:</strong> {envio.guia}
            </div>
            <div>
              <strong>Fecha Registro:</strong>
              {formatDate(envio.fechaRegistro || envio.createdAt)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
