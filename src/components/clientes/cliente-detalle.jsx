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
      <div className="flex items-center justify-center h-[600px]">
        
        <div className="text-center space-y-3">
          
          <div className="flex justify-center">
            
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <p className="text-lg font-medium text-muted-foreground">
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
    <div className="space-y-8 pb-8">
      
      {/* Header del cliente - Mejorado */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary/5 via-accent/5 to-primary/10 p-8 border border-border/50">
        
        <div className="relative z-10">
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            
            <div className="flex items-start gap-5">
              
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                
                {cliente.esEmpresa ? (
                  <Building2 className="h-8 w-8 text-primary-foreground" />
                ) : (
                  <User className="h-8 w-8 text-primary-foreground" />
                )}
              </div>
              <div className="space-y-2">
                
                <h1 className="text-3xl font-bold tracking-tight text-balance">
                  
                  {cliente.esEmpresa
                    ? cliente.razonSocial
                    : `${cliente.nombre} ${
                        cliente.apellidos || ""
                      }`.trim()}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                  
                  <span className="text-sm font-medium">
                    {getTipoDocumentoLabel(cliente.tipoDocumento)}:
                  </span>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {cliente.numeroDocumento}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              
              <Badge
                variant={cliente.estado ? "default" : "secondary"}
                className="px-3 py-1 text-sm font-medium"
              >
                
                {cliente.estado ? "Activo" : "Inactivo"}
              </Badge>
              <Badge
                variant="outline"
                className="px-3 py-1 text-sm font-medium border-primary/20"
              >
                
                {cliente.esEmpresa ? "Empresa" : "Persona Natural"}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      {/* Estadísticas destacadas - Nuevo diseño */}
      {cliente.estadisticas && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            
            <CardContent className="p-6">
              
              <div className="flex items-center justify-between">
                
                <div className="space-y-1">
                  
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Envíos
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {cliente.estadisticas.totalEnvios || 0}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            
            <CardContent className="p-6">
              
              <div className="flex items-center justify-between">
                
                <div className="space-y-1">
                  
                  <p className="text-sm font-medium text-muted-foreground">
                    Entregados
                  </p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: "hsl(var(--color-success))" }}
                  >
                    
                    {cliente.estadisticas.enviosEntregados || 0}
                  </p>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "hsl(var(--color-success) / 0.1)" }}
                >
                  <CheckCircle2
                    className="h-6 w-6"
                    style={{ color: "hsl(var(--color-success))" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            
            <CardContent className="p-6">
              
              <div className="flex items-center justify-between">
                
                <div className="space-y-1">
                  
                  <p className="text-sm font-medium text-muted-foreground">
                    En Tránsito
                  </p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: "hsl(var(--color-info))" }}
                  >
                    
                    {cliente.estadisticas.enviosEnTransito || 0}
                  </p>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "hsl(var(--color-info) / 0.1)" }}
                >
                  <Clock
                    className="h-6 w-6"
                    style={{ color: "hsl(var(--color-info))" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            
            <CardContent className="p-6">
              
              <div className="flex items-center justify-between">
                
                <div className="space-y-1">
                  
                  <p className="text-sm font-medium text-muted-foreground">
                    Monto Total
                  </p>
                  <p className="text-3xl font-bold text-accent">
                    
                    S/ {(cliente.estadisticas.montoTotal || 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Información detallada - Grid mejorado */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Información Personal/Empresarial */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          
          <CardHeader className="pb-4">
            
            <div className="flex items-center gap-3">
              
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                
                <CardTitle className="text-lg">
                  Información {cliente.esEmpresa ? "Empresarial" : "Personal"}
                </CardTitle>
                <CardDescription className="text-xs">
                  Datos de identificación del cliente
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            
            {cliente.esEmpresa ? (
              <>
                
                <div className="space-y-1.5">
                  
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    
                    Razón Social
                  </label>
                  <p className="text-base font-medium text-foreground">
                    {cliente.razonSocial || "No especificado"}
                  </p>
                </div>
                {cliente.nombre && (
                  <div className="space-y-1.5">
                    
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      
                      Representante Legal
                    </label>
                    <p className="text-base font-medium text-foreground">
                      
                      {`${cliente.nombre} ${
                        cliente.apellidos || ""
                      }`.trim()}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                
                <div className="space-y-1.5">
                  
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    
                    Nombres
                  </label>
                  <p className="text-base font-medium text-foreground">
                    {cliente.nombre}
                  </p>
                </div>
                {cliente.apellidos && (
                  <div className="space-y-1.5">
                    
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      
                      Apellidos
                    </label>
                    <p className="text-base font-medium text-foreground">
                      {cliente.apellidos}
                    </p>
                  </div>
                )}
              </>
            )}
            <Separator className="my-4" />
            <div className="grid gap-5 sm:grid-cols-2">
              
              <div className="space-y-1.5">
                
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  
                  Tipo de Documento
                </label>
                <p className="text-base font-medium text-foreground">
                  {getTipoDocumentoLabel(cliente.tipoDocumento)}
                </p>
              </div>
              <div className="space-y-1.5">
                
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Número
                </label>
                <p className="font-mono text-base font-semibold text-primary">
                  {cliente.numeroDocumento}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Información de Contacto */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          
          <CardHeader className="pb-4">
            
            <div className="flex items-center gap-3">
              
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                
                <Phone className="h-5 w-5 text-accent" />
              </div>
              <div>
                
                <CardTitle className="text-lg">
                  Información de Contacto
                </CardTitle>
                <CardDescription className="text-xs">
                  Medios de comunicación con el cliente
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            
            <div className="flex items-start gap-4 rounded-lg bg-muted/50 p-4">
              
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background">
                
                <Phone className="h-5 w-5 text-accent" />
              </div>
              <div className="space-y-1">
                
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Teléfono
                </label>
                <p className="text-base font-semibold text-foreground">
                  {cliente.telefono}
                </p>
              </div>
            </div>
            {cliente.email && (
              <div className="flex items-start gap-4 rounded-lg bg-muted/50 p-4">
                
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background">
                  
                  <Mail className="h-5 w-5 text-accent" />
                </div>
                <div className="space-y-1 min-w-0">
                  
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    
                    Correo Electrónico
                  </label>
                  <p className="text-base font-semibold text-foreground break-all">
                    {cliente.email}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Información de Ubicación */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          
          <CardHeader className="pb-4">
            
            <div className="flex items-center gap-3">
              
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: "hsl(var(--color-info) / 0.1)" }}
              >
                <MapPin
                  className="h-5 w-5"
                  style={{ color: "hsl(var(--color-info))" }}
                />
              </div>
              <div>
                
                <CardTitle className="text-lg">Ubicación</CardTitle>
                <CardDescription className="text-xs">
                  Dirección y localización del cliente
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            
            {cliente.distrito && (
              <div className="space-y-1.5">
                
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  
                  Ubicación Geográfica
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  
                  <Badge variant="secondary" className="font-medium">
                    
                    {cliente.distrito.nombre}
                  </Badge>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="secondary" className="font-medium">
                    
                    {cliente.distrito.provincia.nombre}
                  </Badge>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="secondary" className="font-medium">
                    
                    {cliente.distrito.provincia.departamento.nombre}
                  </Badge>
                </div>
              </div>
            )}
            {cliente.direccion && (
              <>
                
                <Separator />
                <div className="space-y-1.5">
                  
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    
                    Dirección Completa
                  </label>
                  <p className="text-base font-medium text-foreground leading-relaxed">
                    {cliente.direccion}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        {/* Información del Sistema */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          
          <CardHeader className="pb-4">
            
            <div className="flex items-center gap-3">
              
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                
                <CardTitle className="text-lg">
                  Información del Sistema
                </CardTitle>
                <CardDescription className="text-xs">
                  Registro y actividad en la plataforma
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            
            <div className="space-y-1.5">
              
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                
                Fecha de Registro
              </label>
              <p className="text-base font-medium text-foreground">
                {formatDate(cliente.fechaCreacion)}
              </p>
            </div>
            <div className="space-y-1.5">
              
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                
                Última Actualización
              </label>
              <p className="text-base font-medium text-foreground">
                {formatDate(cliente.fechaActualizacion)}
              </p>
            </div>
            <Separator />
            <div className="space-y-1.5">
              
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                
                Estado de la Cuenta
              </label>
              <div className="flex items-center gap-2">
                
                <Badge
                  variant={cliente.activo ? "default" : "secondary"}
                  className="px-3 py-1.5 text-sm font-semibold"
                >
                  
                  {cliente.estado ? "✓ Activo" : "○ Inactivo"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
