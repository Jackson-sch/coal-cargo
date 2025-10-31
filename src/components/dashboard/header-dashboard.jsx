import React from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function HeaderDashboard({
  session,
  sucursales,
  sucursalId,
  setSucursalId,
  fetchKpis,
  fetchTrend,
  fetchSucursales,
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido, {session?.user?.name}
        </p>
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
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-sm text-muted-foreground">Sucursal</span>
            <Select
              value={sucursalId}
              onValueChange={(val) => {
                setSucursalId(val); // Refrescar datos con nueva sucursa l
                setTimeout(() => {
                  fetchKpis();
                  fetchTrend();
                }, 0);
              }}
            >
              <SelectTrigger className="w-full">
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
        )}
      </div>
    </div>
  );
}
