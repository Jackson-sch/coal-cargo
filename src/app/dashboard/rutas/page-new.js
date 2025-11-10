import { getRutas, getEstadisticasRutas } from "@/lib/actions/rutas";
import RutasClient from "@/components/rutas/rutas-client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Gestión de Rutas | Coal Cargo",
  description: "Administra las rutas de transporte",
};

export default async function RutasPage({ searchParams }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Verificar permisos
  const rolesPermitidos = ["SUPER_ADMIN", "ADMIN_SUCURSAL"];
  if (!rolesPermitidos.includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Obtener parámetros de búsqueda
  const page = parseInt(searchParams.page) || 1;
  const limit = parseInt(searchParams.limit) || 10;
  const q = searchParams.q || "";
  const tipo = searchParams.tipo || "todos";
  const estado = searchParams.estado || "todos";

  // Preparar filtros
  const filters = {
    page,
    limit,
    search: q || undefined,
    tipo: tipo !== "todos" ? tipo : undefined,
    activo:
      estado === "activo"
        ? "activo"
        : estado === "inactivo"
        ? "inactivo"
        : undefined,
  };

  // Obtener datos
  const [rutasResult, estadisticasResult] = await Promise.all([
    getRutas(filters),
    getEstadisticasRutas(),
  ]);

  const rutas = rutasResult.success ? rutasResult.data.rutas : [];
  const totalRutas = rutasResult.success ? rutasResult.data.totalCount : 0;
  const totalPages = rutasResult.success
    ? rutasResult.data.totalPages
    : 1;
  const estadisticas = estadisticasResult.success
    ? estadisticasResult.data
    : null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Rutas</h1>
        <p className="text-muted-foreground">
          Administra las rutas de transporte y optimiza los recorridos
        </p>
      </div>

      <RutasClient
        initialRutas={rutas}
        totalPages={totalPages}
        totalRutas={totalRutas}
        currentPage={page}
        searchParams={searchParams}
        estadisticas={estadisticas}
      />
    </div>
  );
}

