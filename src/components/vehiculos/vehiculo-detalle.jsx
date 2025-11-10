"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Car,
  Calendar,
  Building2,
  User,
  Package,
  AlertCircle,
  CheckCircle,
  Wrench,
  XCircle,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ESTADO_COLORS = {
  DISPONIBLE: "bg-green-100 text-green-800 border-green-200",
  EN_RUTA: "bg-blue-100 text-blue-800 border-blue-200",
  MANTENIMIENTO: "bg-yellow-100 text-yellow-800 border-yellow-200",
  INACTIVO: "bg-gray-100 text-gray-800 border-gray-200",
};

const ESTADO_ICONS = {
  DISPONIBLE: CheckCircle,
  EN_RUTA: Car,
  MANTENIMIENTO: Wrench,
  INACTIVO: XCircle,
};

const ESTADO_LABELS = {
  DISPONIBLE: "Disponible",
  EN_RUTA: "En Ruta",
  MANTENIMIENTO: "Mantenimiento",
  INACTIVO: "Inactivo",
};

const TIPO_VEHICULO_LABELS = {
  CAMION_PEQUENO: "Camión Pequeño",
  CAMION_MEDIANO: "Camión Mediano",
  CAMION_GRANDE: "Camión Grande",
  TRAILER: "Trailer",
  FURGONETA: "Furgoneta",
  MOTOCICLETA: "Motocicleta",
};

export default function VehiculoDetalle({ vehiculo }) {
  if (!vehiculo) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Vehículo no encontrado</p>
      </div>
    );
  }

  const EstadoIcon = ESTADO_ICONS[vehiculo.estado] || AlertCircle;

  const formatearFecha = (fecha) => {
    if (!fecha) return "No especificada";
    return format(new Date(fecha), "dd 'de' MMMM 'de' yyyy", { locale: es });
  };

  const formatearPeso = (peso) => {
    if (!peso) return "N/A";
    return `${new Intl.NumberFormat("es-PE").format(peso)} kg`;
  };

  const formatearVolumen = (volumen) => {
    if (!volumen) return "N/A";
    return `${volumen} m³`;
  };

  const esSOATVencido = vehiculo.soat
    ? new Date(vehiculo.soat) < new Date()
    : false;

  const esRevisionVencida = vehiculo.revision
    ? new Date(vehiculo.revision) < new Date()
    : false;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Car className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold font-mono">{vehiculo.placa}</h2>
            <Badge
              className={`${ESTADO_COLORS[vehiculo.estado]} flex items-center gap-1`}
            >
              <EstadoIcon className="h-3 w-3" />
              {ESTADO_LABELS[vehiculo.estado]}
            </Badge>
          </div>
          {vehiculo.marca && vehiculo.modelo && (
            <p className="text-lg text-muted-foreground">
              {vehiculo.marca} {vehiculo.modelo}
              {vehiculo.año && ` ${vehiculo.año}`}
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo de Vehículo</p>
              <p className="text-base">
                {vehiculo.tipoVehiculo
                  ? TIPO_VEHICULO_LABELS[vehiculo.tipoVehiculo] ||
                    vehiculo.tipoVehiculo
                  : "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <Badge
                className={`${ESTADO_COLORS[vehiculo.estado]} flex items-center gap-1 w-fit mt-1`}
              >
                <EstadoIcon className="h-3 w-3" />
                {ESTADO_LABELS[vehiculo.estado]}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacidades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Capacidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Peso Máximo
              </p>
              <p className="text-2xl font-bold">
                {formatearPeso(vehiculo.pesoMaximo || vehiculo.capacidad)}
              </p>
            </div>
            {vehiculo.volumenMaximo && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Volumen Máximo
                </p>
                <p className="text-2xl font-bold">
                  {formatearVolumen(vehiculo.volumenMaximo)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Asignación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Asignación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Sucursal
              </p>
              {vehiculo.sucursal ? (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{vehiculo.sucursal.nombre}</p>
                    {vehiculo.sucursal.provincia && (
                      <p className="text-sm text-muted-foreground">
                        {vehiculo.sucursal.provincia}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Sin asignar</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Conductor
              </p>
              {vehiculo.usuarios ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{vehiculo.usuarios.name}</p>
                    {vehiculo.usuarios.email && (
                      <p className="text-sm text-muted-foreground">
                        {vehiculo.usuarios.email}
                      </p>
                    )}
                    {vehiculo.usuarios.phone && (
                      <p className="text-sm text-muted-foreground">
                        {vehiculo.usuarios.phone}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Sin asignar</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentos y Fechas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Documentos y Fechas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Vencimiento SOAT
              </p>
              {vehiculo.soat ? (
                <div>
                  <p className={`font-medium ${esSOATVencido ? "text-destructive" : ""}`}>
                    {formatearFecha(vehiculo.soat)}
                  </p>
                  {esSOATVencido && (
                    <Badge variant="destructive" className="mt-1">
                      Vencido
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No especificada</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Próxima Revisión Técnica
              </p>
              {vehiculo.revision ? (
                <div>
                  <p className={`font-medium ${esRevisionVencida ? "text-destructive" : ""}`}>
                    {formatearFecha(vehiculo.revision)}
                  </p>
                  {esRevisionVencida && (
                    <Badge variant="destructive" className="mt-1">
                      Vencida
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No especificada</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observaciones */}
      {vehiculo.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {vehiculo.observaciones}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Envíos Recientes */}
      {vehiculo.envios && vehiculo.envios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Envíos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vehiculo.envios.slice(0, 5).map((envio) => (
                <div
                  key={envio.id}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <div>
                    <p className="font-medium">{envio.guia || envio.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(envio.createdAt), "dd/MM/yyyy", {
                        locale: es,
                      })}
                    </p>
                  </div>
                  {envio.cliente && (
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {envio.cliente.razonSocial ||
                          `${envio.cliente.nombre} ${envio.cliente.apellidos}`}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

