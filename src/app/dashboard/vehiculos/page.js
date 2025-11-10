import { getVehiculos, getEstadisticasVehiculos } from "@/lib/actions/vehiculos";
import VehiculosClient from "@/components/vehiculos/vehiculos-client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Gestión de Vehículos | Coal Cargo",
  description: "Administra los vehículos de la flota",
};

export default async function VehiculosPage({ searchParams }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Verificar permisos
  const rolesPermitidos = ["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"];
  if (!rolesPermitidos.includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Obtener parámetros de búsqueda
  const page = parseInt(searchParams.page) || 1;
  const limit = parseInt(searchParams.limit) || 10;
  const q = searchParams.q || "";
  const estado = searchParams.estado || "all";
  const sucursalId = searchParams.sucursalId || "all";
  const tipoVehiculo = searchParams.tipoVehiculo || "all";

  // Preparar filtros
  const filters = {
    page,
    limit,
    q: q || undefined,
    estado: estado !== "all" ? estado : undefined,
    sucursalId: sucursalId !== "all" ? sucursalId : undefined,
    tipoVehiculo: tipoVehiculo !== "all" ? tipoVehiculo : undefined,
  };

  // Obtener datos
  const [vehiculosResult, estadisticasResult] = await Promise.all([
    getVehiculos(filters),
    getEstadisticasVehiculos(),
  ]);

  const vehiculos = vehiculosResult.success ? vehiculosResult.data : [];
  const totalVehiculos = vehiculosResult.success ? vehiculosResult.total : 0;
  const totalPages = vehiculosResult.success
    ? vehiculosResult.totalPages
    : 1;
  const estadisticas = estadisticasResult.success
    ? estadisticasResult.data
    : null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Vehículos</h1>
        <p className="text-muted-foreground">
          Administra la flota de vehículos de la empresa
        </p>
      </div>

      <VehiculosClient
        initialVehiculos={vehiculos}
        totalPages={totalPages}
        totalVehiculos={totalVehiculos}
        currentPage={page}
        searchParams={searchParams}
        estadisticas={estadisticas}
      />
    </div>
  );
}

