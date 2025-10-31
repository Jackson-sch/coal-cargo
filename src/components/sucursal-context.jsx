"use client";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, User } from "lucide-react";
import { useEmpresaSucursalConfig } from "@/hooks/use-empresa-sucursal-config";

export function SucursalContext({ className = "" }) {
  const { data: session } = useSession();
  const { config, loading, getNombreCompleto, getPlan } =
    useEmpresaSucursalConfig();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const { usuario, sucursal, empresa } = config;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{empresa.nombre}</span>
          {sucursal.nombre && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {sucursal.nombre}
              </span>
            </div>
          )}
        </div>
      </div>
      <Badge variant="outline" className="text-xs">
        {getPlan()}
      </Badge>
    </div>
  );
}

export function SucursalContextCompact({ className = "" }) {
  const { data: session } = useSession();
  const { config, loading, getNombreCompleto } = useEmpresaSucursalConfig();
  if (loading || !session?.user) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}
    >
      <Building2 className="h-4 w-4" /> <span>{getNombreCompleto()}</span>
    </div>
  );
}
