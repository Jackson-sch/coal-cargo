import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function HeaderDashboard({
  session,
  sucursales,
  sucursalId,
  setSucursalId,
  filtroTipo = "ambos",
  setFiltroTipo,
  onRefresh,
  refreshing = false,
  ultimaActualizacion,
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={refreshing}
            title="Actualizar datos"
            className="h-8 w-8"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
        <div className="flex flex-col gap-1 mt-1">
          <p className="text-muted-foreground">
            Bienvenido, {session?.user?.name}
          </p>
          {ultimaActualizacion && (
            <p className="text-xs text-muted-foreground">
              Última actualización:{" "}
              {formatDistanceToNow(ultimaActualizacion, {
                addSuffix: true,
                locale: es,
              })}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-start gap-2 md:items-end">
        <div className="text-right w-full">
          <p className="text-sm text-muted-foreground">
            Rol: <Badge variant="outline">{session?.user?.role}</Badge>
          </p>
          {session?.user?.sucursal && session?.user?.role !== "SUPER_ADMIN" && (
            <p className="text-sm text-muted-foreground">
              Sucursal: {session.user.sucursal.nombre}
            </p>
          )}
        </div>
        {session?.user?.role === "SUPER_ADMIN" && (
          <div className="flex flex-col gap-2 w-full md:items-end">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sucursal</span>
                <Select
                  value={sucursalId}
                  onValueChange={(val) => {
                    setSucursalId(val); // El useEffect en page.jsx se encargará de recargar los datos
                  }}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Todas las sucursales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas</SelectItem>
                    {sucursales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {sucursalId && sucursalId !== "ALL" && (
                <Select
                  value={filtroTipo}
                  onValueChange={(val) => {
                    setFiltroTipo(val);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambos">Desde y hacia</SelectItem>
                    <SelectItem value="origen">Solo origen</SelectItem>
                    <SelectItem value="destino">Solo destino</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            {sucursalId && sucursalId !== "ALL" && (
              <p className="text-xs text-muted-foreground text-right">
                {filtroTipo === "origen" && "Mostrando: envíos registrados en esta sucursal"}
                {filtroTipo === "destino" && "Mostrando: envíos que van a esta sucursal"}
                {filtroTipo === "ambos" && "Mostrando: envíos desde y hacia esta sucursal"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
