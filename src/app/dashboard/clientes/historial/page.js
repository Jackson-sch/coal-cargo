import { getClienteHistorial } from "@/lib/actions/clientes";
import ClienteHistorialClient from "@/components/clientes/cliente-historial-client";
import ClienteSelector from "@/components/clientes/cliente-selector";

export default async function ClienteHistorialPage({ searchParams }) {
  // Await searchParams antes de usar sus propiedades (Next.js 15)
  const resolvedSearchParams = await searchParams;

  const {
    clienteId,
    tipo = "todos",
    estado,
    fechaDesde,
    fechaHasta,
    busqueda,
    page = 1,
  } = resolvedSearchParams;

  // Si no hay clienteId, mostrar selector de cliente
  if (!clienteId) {
    return (
      <ClienteSelector
        title="Historial de Clientes"
        description="Selecciona un cliente para ver su historial completo de actividades"
      />
    );
  }

  const result = await getClienteHistorial({
    clienteId,
    tipo,
    estado,
    fechaDesde,
    fechaHasta,
    busqueda,
    page: parseInt(page),
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <ClienteHistorialClient
      initialData={result.data}
      cliente={result.cliente}
      totalPages={result.totalPages}
      currentPage={result.currentPage}
      totalItems={result.total}
      total={result.total}
      estadisticas={result.estadisticas}
      initialFiltros={{
        tipo,
        estado,
        fechaDesde,
        fechaHasta,
        busqueda,
      }}
      searchParams={resolvedSearchParams}
    />
  );
}
