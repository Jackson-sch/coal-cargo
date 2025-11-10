import { getClientes, getEstadisticasClientes } from "@/lib/actions/clientes";
import ClientesClient from "@/components/clientes/clientes-client";

export default async function ClientesPage({ searchParams }) {
  // In Next.js 15, searchParams might be a Promise
  const resolvedSearchParams = await searchParams;

  const params = {
    page: parseInt(resolvedSearchParams?.page) || 1,
    limit: parseInt(resolvedSearchParams?.limit) || 10,
    ...(resolvedSearchParams?.q && { q: resolvedSearchParams.q }),
    ...(resolvedSearchParams?.tipoDocumento && {
      tipoDocumento: resolvedSearchParams.tipoDocumento,
    }),
  };

  if (resolvedSearchParams?.estado) {
    const estadoValue = resolvedSearchParams.estado;
    if (estadoValue === "ALL") {
      // Mostrar todos los clientes (activos e inactivos)
      params.estado = "all";
    } else if (estadoValue === "false") {
      // Solo clientes inactivos
      params.estado = "inactive";
    } else if (estadoValue === "ACTIVE_ONLY") {
      // Solo clientes activos
      params.estado = "active";
    } else if (estadoValue === "deleted") {
      // Solo clientes eliminados (soft delete)
      params.estado = "deleted";
    }
  }

  // Si no hay parámetro de estado, getClientes mostrará solo activos por defecto

  // Obtener datos del servidor y estadísticas en paralelo
  const [result, estadisticasResult] = await Promise.all([
    getClientes(params),
    getEstadisticasClientes(),
  ]);

  if (!result.success) {
    throw new Error(result.error || "Error al cargar clientes");
  }

  const estadisticas = estadisticasResult.success
    ? estadisticasResult.data
    : null;

  return (
    <ClientesClient
      initialClientes={result.data}
      totalPages={result.totalPages}
      totalClientes={result.total}
      currentPage={params.page}
      searchParams={resolvedSearchParams}
      estadisticas={estadisticas}
    />
  );
}
