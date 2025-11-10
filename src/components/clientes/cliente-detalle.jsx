"use client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  Package,
  CheckCircle2,
  Clock,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ClienteDetalle({ cliente }) {
  if (!cliente) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Selecciona un cliente para ver sus detalles
          </p>
        </div>
      </div>
    );
  }
  const formatDate = (date) => {
    if (!date) return "No disponible";
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: es });
  };

  const getTipoDocumentoLabel = (tipo) => {
    const tipos = {
      DNI: "DNI",
      RUC: "RUC",
      PASAPORTE: "Pasaporte",
      CARNET_EXTRANJERIA: "Carnet de Extranjería",
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="space-y-4 -mx-4 -mt-4">
      {/* Header del cliente - Optimizado para modal */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 p-4 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md">
              {cliente.esEmpresa ? (
                <Building2 className="h-6 w-6 text-primary-foreground" />
              ) : (
                <User className="h-6 w-6 text-primary-foreground" />
              )}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <h2 className="text-xl font-bold tracking-tight truncate">
                {cliente.esEmpresa
                  ? cliente.razonSocial
                  : `${cliente.nombre} ${cliente.apellidos || ""}`.trim()}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">
                  {getTipoDocumentoLabel(cliente.tipoDocumento)}:
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {cliente.numeroDocumento}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Badge
              variant={cliente.estado ? "default" : "secondary"}
              className="px-2 py-0.5 text-xs font-medium"
            >
              {cliente.estado ? "Activo" : "Inactivo"}
            </Badge>
            <Badge
              variant="outline"
              className="px-2 py-0.5 text-xs font-medium border-primary/20"
            >
              {cliente.esEmpresa ? "Empresa" : "Persona Natural"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Contenido con scroll */}
      <div className="space-y-4 px-4 pb-4">
        {/* Estadísticas destacadas - Compactas para modal */}
        {cliente.estadisticas && (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">
                      Total Envíos
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {cliente.estadisticas.totalEnvios || 0}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0 ml-2">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">
                      Entregados
                    </p>
                    <p className="text-xl font-bold text-green-600">
                      {cliente.estadisticas.enviosEntregados || 0}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20 shrink-0 ml-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">
                      En Tránsito
                    </p>
                    <p className="text-xl font-bold text-blue-600">
                      {cliente.estadisticas.enviosEnTransito || 0}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20 shrink-0 ml-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">
                      Monto Total
                    </p>
                    <p className="text-lg font-bold text-accent truncate">
                      S/ {(cliente.estadisticas.montoTotal || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 shrink-0 ml-2">
                    <DollarSign className="h-4 w-4 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Información detallada - Grid compacto para modal */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Información Personal/Empresarial */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Información {cliente.esEmpresa ? "Empresarial" : "Personal"}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {cliente.esEmpresa ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Razón Social
                    </label>
                    <p className="text-sm font-medium text-foreground">
                      {cliente.razonSocial || "No especificado"}
                    </p>
                  </div>
                  {cliente.nombre && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Representante Legal
                      </label>
                      <p className="text-sm font-medium text-foreground">
                        {`${cliente.nombre} ${cliente.apellidos || ""}`.trim()}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Nombres
                    </label>
                    <p className="text-sm font-medium text-foreground">
                      {cliente.nombre}
                    </p>
                  </div>
                  {cliente.apellidos && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Apellidos
                      </label>
                      <p className="text-sm font-medium text-foreground">
                        {cliente.apellidos}
                      </p>
                    </div>
                  )}
                </>
              )}
              <Separator className="my-2" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Tipo de Documento
                  </label>
                  <p className="text-sm font-medium text-foreground">
                    {getTipoDocumentoLabel(cliente.tipoDocumento)}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Número
                  </label>
                  <p className="font-mono text-sm font-semibold text-primary">
                    {cliente.numeroDocumento}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Información de Contacto */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <Phone className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Información de Contacto
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background">
                  <Phone className="h-4 w-4 text-accent" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Teléfono
                  </label>
                  <p className="text-sm font-semibold text-foreground">
                    {cliente.telefono}
                  </p>
                </div>
              </div>
              {cliente.email && (
                <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background">
                    <Mail className="h-4 w-4 text-accent" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Correo Electrónico
                    </label>
                    <p className="text-sm font-semibold text-foreground break-all">
                      {cliente.email}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Información de Ubicación */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Ubicación</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {cliente.distrito && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Ubicación Geográfica
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {cliente.distrito.nombre}
                    </Badge>
                    <span className="text-muted-foreground text-xs">•</span>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {cliente.distrito.provincia.nombre}
                    </Badge>
                    <span className="text-muted-foreground text-xs">•</span>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {cliente.distrito.provincia.departamento.nombre}
                    </Badge>
                  </div>
                </div>
              )}
              {cliente.direccion && (
                <>
                  <Separator className="my-2" />
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Dirección Completa
                    </label>
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {cliente.direccion}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          {/* Información del Sistema */}
          <Card className="border-border/50 lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Información del Sistema
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Fecha de Registro
                  </label>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(cliente.createdAt || cliente.fechaCreacion)}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Última Actualización
                  </label>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(
                      cliente.updatedAt || cliente.fechaActualizacion
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Estado de la Cuenta
                  </label>
                  <div>
                    <Badge
                      variant={cliente.estado ? "default" : "secondary"}
                      className="px-2 py-0.5 text-xs font-medium"
                    >
                      {cliente.estado ? "✓ Activo" : "○ Inactivo"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
