import { Users } from "lucide-react";
import UsuariosSucursalesClient from "@/components/configuracion/usuarios-sucursales-client";

export default function ConfiguracionUsuarios() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          Gestión de Usuarios
        </h1>
        <p className="text-muted-foreground">
          Administra los usuarios del sistema y sus permisos
        </p>
      </div>
      <UsuariosSucursalesClient />
    </div>
  );
}
