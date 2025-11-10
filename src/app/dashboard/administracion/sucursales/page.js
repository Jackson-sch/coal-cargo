import { Building2, Users, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSucursalesConEstadisticas } from "@/lib/actions/sucursales-admin";
import SucursalesAdminClient from "@/components/administracion/sucursales-admin-client";
import RouteProtectionServer from "@/components/auth/route-protection-server";

export default async function AdministracionSucursalesPage() {
  // Obtener sucursales con estadísticas
  const sucursalesResult = await getSucursalesConEstadisticas();
  const sucursales = sucursalesResult.success ? sucursalesResult.data : [];
  
  return (
    <RouteProtectionServer allowedRoles="SUPER_ADMIN">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" /> Administración de
            Sucursales
          </h1>
          <p className="text-muted-foreground">
            Gestiona las sucursales y sus administradores
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nueva Sucursal
        </Button>
      </div>
      {/* Resumen General */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sucursales
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sucursales.length}</div>
            <p className="text-xs text-muted-foreground">Sucursales activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Usuarios
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sucursales.reduce(
                (acc, s) => acc + (s._count?.usuarios || 0),
                0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuarios en todas las sucursales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Envíos del Mes
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sucursales.reduce(
                (acc, s) => acc + (s._count?.enviosOrigen || 0),
                0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Envíos originados este mes
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Lista de Sucursales */}
      <SucursalesAdminClient initialSucursales={sucursales} />
      </div>
    </RouteProtectionServer>
  );
}
