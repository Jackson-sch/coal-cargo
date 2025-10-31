import TarifasSucursalesClient from "@/components/configuracion/tarifas-sucursales-client";
import { getTarifasSucursales } from "@/lib/actions/tarifas-sucursales";
import { getSucursales } from "@/lib/actions/sucursales";
import { Route } from "lucide-react";

export default async function ConfiguracionTarifasPage() {
  // Obtener datos del servidor
  const [tarifasSucursalesResult, sucursalesResult] = await Promise.all([
    getTarifasSucursales(),
    getSucursales(),
  ]);

  const tarifasSucursales = tarifasSucursalesResult.success
    ? tarifasSucursalesResult.data
    : [];
  const sucursales = sucursalesResult.success ? sucursalesResult.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Route className="h-8 w-8 text-primary" />
          Configuración de Tarifas
        </h1>
        <p className="text-muted-foreground">
          Gestiona las tarifas de envío del sistema
        </p>
      </div>
      <div className="space-y-4">
        <TarifasSucursalesClient
          initialTarifas={tarifasSucursales}
          sucursales={sucursales}
        />
      </div>
    </div>
  );
}
