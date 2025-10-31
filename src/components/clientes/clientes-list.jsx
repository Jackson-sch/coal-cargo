"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getClientes,
  deleteCliente,
  toggleClienteEstado,
} from "@/lib/actions/clientes";

export function ClientesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    tipoDocumento: searchParams.get("tipoDocumento") || "",
    estado: searchParams.get("estado") || "",
    page: parseInt(searchParams.get("page")) || 1,
    limit: parseInt(searchParams.get("limit")) || 10,
  });

  // Cargar clientes
  const loadClientes = async (searchFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const result = await getClientes(searchFilters);
      if (result.success) {
        setClientes(result.data);
        setPagination({
          total: result.total,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          limit: result.limit,
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  // Cargar clientes al montar el componente
  useEffect(() => {
    loadClientes();
  }, []);

  // Manejar búsqueda
  const handleSearch = (e) => {
    e.preventDefault();
    const newFilters = { ...filters, page: 1 };
    setFilters(newFilters);
    loadClientes(newFilters);

    // Actualizar URL
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.push(`?${params.toString()}`);
  };

  // Cambiar página
  const handlePageChange = (newPage) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    loadClientes(newFilters);
  };

  // Eliminar cliente
  const handleDelete = async (clienteId, clienteNombre) => {
    if (!confirm(`¿Está seguro de eliminar al cliente "${clienteNombre}"?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteCliente(clienteId);
        if (result.success) {
          await loadClientes(); // Recargar lista
          alert("Cliente eliminado correctamente");
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (err) {
        alert("Error al eliminar cliente");
      }
    });
  };

  // Cambiar estado del cliente
  const handleToggleEstado = async (clienteId, clienteNombre, estadoActual) => {
    const accion = estadoActual ? "desactivar" : "activar";
    if (!confirm(`¿Está seguro de ${accion} al cliente "${clienteNombre}"?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await toggleClienteEstado(clienteId);
        if (result.success) {
          await loadClientes(); // Recargar lista
          alert(result.message);
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (err) {
        alert("Error al cambiar estado del cliente");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={() => router.push("/dashboard/clientes/nuevo")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Nuevo Cliente
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder="Nombre, documento, email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Documento
            </label>
            <select
              value={filters.tipoDocumento || "todos"}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  tipoDocumento:
                    e.target.value === "todos" ? "" : e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="DNI">DNI</option>
              <option value="RUC">RUC</option>
              <option value="PASAPORTE">Pasaporte</option>
              <option value="CARNET_EXTRANJERIA">Carnet Extranjería</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.estado || "todos"}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  estado: e.target.value === "todos" ? "" : e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabla de clientes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Cargando clientes...
                  </td>
                </tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {cliente.esEmpresa
                            ? cliente.razonSocial
                            : `${cliente.nombre} ${
                                cliente.apellidos || ""
                              }`.trim()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {cliente.esEmpresa ? "Empresa" : "Persona Natural"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {cliente.tipoDocumento}: {cliente.numeroDocumento}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {cliente.telefono}
                      </div>
                      {cliente.email && (
                        <div className="text-sm text-gray-500">
                          {cliente.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          cliente.estado
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cliente.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/clientes/${cliente.id}`)
                        }
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/clientes/${cliente.id}/editar`
                          )
                        }
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() =>
                          handleToggleEstado(
                            cliente.id,
                            cliente.esEmpresa
                              ? cliente.razonSocial
                              : `${cliente.nombre} ${
                                  cliente.apellidos || ""
                                }`.trim(),
                            cliente.estado
                          )
                        }
                        disabled={isPending}
                        className={`${
                          cliente.estado
                            ? "text-orange-600 hover:text-orange-900"
                            : "text-green-600 hover:text-green-900"
                        } disabled:opacity-50`}
                      >
                        {cliente.estado ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(
                            cliente.id,
                            cliente.esEmpresa
                              ? cliente.razonSocial
                              : `${cliente.nombre} ${
                                  cliente.apellidos || ""
                                }`.trim()
                          )
                        }
                        disabled={isPending}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando
                  <span className="font-medium">
                    {(pagination.currentPage - 1) * pagination.limit + 1}
                  </span>
                  a
                  <span className="font-medium">
                    {Math.min(
                      pagination.currentPage * pagination.limit,
                      pagination.total
                    )}
                  </span>
                  de <span className="font-medium">{pagination.total}</span>
                  resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>

                  {/* Números de página */}
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  )
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === pagination.totalPages ||
                        Math.abs(page - pagination.currentPage) <= 2
                    )
                    .map((page, index, array) => (
                      <div key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pagination.currentPage
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    ))}

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
