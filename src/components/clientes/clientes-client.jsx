"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  MoreHorizontal,
  RefreshCw,
  Download,
  Printer,
  Copy,
  FileSpreadsheet,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Paginator from "@/components/ui/paginator";
import ResultsCounter from "@/components/ui/results-counter";
import { toast } from "sonner";
import ClienteForm from "@/components/clientes/cliente-form";
import ClienteDetalle from "@/components/clientes/cliente-detalle";
import {
  deleteCliente,
  reactivateCliente,
  getClientes,
} from "@/lib/actions/clientes";
import { useRouter } from "next/navigation";
import {
  exportClientesToExcel,
  prepareForPrint,
  copyToClipboard,
} from "@/lib/utils/export-utils";
import EstadisticasRapidasClientes from "./estadisticas-rapidas";
import ClientesFiltros from "./clientes-filtros";
import ClienteTabla from "./cliente-tabla";
import Modal from "../ui/modal";

export default function ClientesClient({
  initialClientes,
  totalPages,
  totalClientes,
  currentPage,
  searchParams = {},
  estadisticas = null,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { handleError, handleAsyncError } = useErrorHandler();
  const [clientes, setClientes] = useState(initialClientes);
  const totalPagesNum = Math.max(totalPages || 1, 1);

  // Inicializar filtros basados en los parámetros de la URL
  const [searchQuery, setSearchQuery] = useState(searchParams.q || "");
  const [tipoDocumentoFilter, setTipoDocumentoFilter] = useState(
    searchParams.tipoDocumento || "ALL"
  );
  const [estadoFilter, setEstadoFilter] = useState(() => {
    if (searchParams.estado === "ALL") return "ALL";
    if (searchParams.estado === "false") return "false";
    if (searchParams.estado === "deleted") return "deleted";
    if (searchParams.estado === "ACTIVE_ONLY") return "ACTIVE_ONLY";
    return "ACTIVE_ONLY"; // Por defecto
  });

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  // Función para aplicar filtros en tiempo real
  const applyFiltersRealTime = useCallback(async (query, tipoDoc, estado) => {
    // isPending se maneja automáticamente con startTransition
    try {
      // Preparar parámetros para la Server Action
      let estadoParam;
      if (estado === "ACTIVE_ONLY") {
        estadoParam = "active";
      } else if (estado === "ALL") {
        estadoParam = "all";
      } else if (estado === "false") {
        estadoParam = "inactive";
      } else if (estado === "deleted") {
        estadoParam = "deleted";
      }

      // Respetar el límite actual desde la URL (si existe)
      const currentLimit = (() => {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          return (
            parseInt(urlParams.get("limit")) ||
            parseInt(searchParams?.limit) ||
            8
          );
        } catch {
          return parseInt(searchParams?.limit) || 8;
        }
      })();

      const result = await getClientes({
        q: query || undefined,
        tipoDocumento: tipoDoc && tipoDoc !== "ALL" ? tipoDoc : undefined,
        estado: estadoParam,
        page: 1,
        limit: currentLimit,
      });

      if (result.success) {
        setClientes(result.data);
        // Actualizar URL sin recargar la página
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (tipoDoc && tipoDoc !== "ALL") params.set("tipoDocumento", tipoDoc);
        if (estado === "ACTIVE_ONLY") {
          params.set("estado", "ACTIVE_ONLY");
        } else if (estado === "ALL") {
          params.set("estado", "ALL");
        } else if (estado === "false") {
          params.set("estado", "false");
        } else if (estado === "deleted") {
          params.set("estado", "deleted");
        }

        params.set("page", "1");
        // Actualizar URL sin recargar
        const newUrl = `/dashboard/clientes?${params.toString()}`;
        window.history.replaceState({}, "", newUrl);
      } else {
        handleError(new Error(result.error), {
          context: { action: "applyFilters" },
          defaultMessage: "Error al aplicar filtros",
        });
      }
    } catch (error) {
      handleError(error, {
        context: { action: "applyFilters" },
        defaultMessage: "Error al aplicar filtros",
      });
    }
  }, []);

  // Debounce para la búsqueda de texto
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFiltersRealTime(searchQuery, tipoDocumentoFilter, estadoFilter);
    }, 500); // 500ms de delay para búsqueda de texto

    return () => clearTimeout(timer);
  }, [searchQuery, applyFiltersRealTime, tipoDocumentoFilter, estadoFilter]);

  // Función para cambiar página
  const handlePageChange = (page) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page.toString());
    router.push(`/dashboard/clientes?${params.toString()}`);
  };

  // Función para eliminar cliente (soft delete)
  const handleDelete = async () => {
    if (!selectedCliente) return;
    try {
      const result = await deleteCliente(selectedCliente.id);
      if (result.success) {
        toast.success("Cliente desactivado correctamente");
        setShowDeleteDialog(false);
        setSelectedCliente(null);
        // Necesitamos router.refresh() para actualizar los Server Components
        router.refresh();
      } else {
        toast.error(result.error || "Error al desactivar cliente");
      }
    } catch (error) {
      toast.error("Error al desactivar cliente");
    }
  };

  // Función para reactivar/restaurar cliente
  const handleReactivate = async (cliente) => {
    try {
      const result = await reactivateCliente(cliente.id);
      if (result.success) {
        const isDeleted = !!cliente.deletedAt;
        toast.success(
          isDeleted 
            ? "Cliente restaurado correctamente" 
            : "Cliente reactivado correctamente"
        );

        // Si el filtro actual es "deleted" o "Solo inactivos", remover el cliente de la lista
        if (estadoFilter === "deleted" || estadoFilter === "false") {
          setClientes((prevClientes) =>
            prevClientes.filter((c) => c.id !== cliente.id)
          );
        } else {
          // Si no es el filtro de eliminados/inactivos, actualizar el estado local
          setClientes((prevClientes) =>
            prevClientes.map((c) =>
              c.id === cliente.id ? { ...c, estado: true, deletedAt: null } : c
            )
          );
        }

        // Recargar la lista desde el servidor con los filtros actuales
        await applyFiltersRealTime(
          searchQuery,
          tipoDocumentoFilter,
          estadoFilter
        );
        
        // Si se restauró desde la vista de eliminados, cambiar a vista de activos
        if (isDeleted && estadoFilter === "deleted") {
          setEstadoFilter("ACTIVE_ONLY");
          router.push("/dashboard/clientes?estado=ACTIVE_ONLY");
        }
      } else {
        toast.error(result.error || "Error al restaurar cliente");
      }
    } catch (error) {
      toast.error("Error al restaurar cliente");
    }
  };

  // Función para manejar éxito en crear/editar
  const handleSuccess = (clienteData, isEdit) => {
    // Mostrar toast de éxito
    toast.success(
      isEdit
        ? "Cliente actualizado correctamente"
        : "Cliente creado correctamente"
    );

    // Actualizar el estado local inmediatamente
    setClientes((prevClientes) => {
      if (isEdit) {
        // Actualizar cliente existente
        return prevClientes.map((cliente) =>
          cliente.id === clienteData.id ? clienteData : cliente
        );
      } else {
        // Agregar nuevo cliente al inicio de la lista
        return [clienteData, ...prevClientes];
      }
    });

    // Cerrar modales
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedCliente(null);

    // Refrescar desde el servidor después de un pequeño delay para asegurar sincronización
    setTimeout(() => {
      router.refresh();
    }, 500);
  };

  const formatearDireccion = (cliente) => {
    const partes = [];
    if (cliente.direccion) partes.push(cliente.direccion);
    if (cliente.distrito?.nombre) partes.push(cliente.distrito.nombre);
    if (cliente.distrito?.provincia?.nombre)
      partes.push(cliente.distrito.provincia.nombre);
    if (cliente.distrito?.provincia?.departamento?.nombre)
      partes.push(cliente.distrito.provincia.departamento.nombre);
    return partes.join(", ");
  };

  const getBadgeVariant = (cliente) => {
    if (cliente.deletedAt) {
      return "outline"; // Cliente eliminado (soft delete)
    }
    switch (cliente.estado) {
      case true:
        return "default"; // Cliente activo
      case false:
        return "destructive"; // Cliente inactivo
      default:
        return "secondary";
    }
  };

  const getEstadoText = (cliente) => {
    if (cliente.deletedAt) {
      const fechaEliminacion = new Date(cliente.deletedAt);
      return `Eliminado el ${fechaEliminacion.toLocaleDateString("es-PE")}`;
    }
    return cliente.estado ? "Activo" : "Inactivo";
  };

  const isDeletedView = estadoFilter === "deleted";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona la información de tus clientes
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Botones de exportación */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Opciones de Exportación</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  exportClientesToExcel(clientes, "clientes");
                  toast.success("Archivo Excel descargado correctamente");
                }}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar a Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  const result = await copyToClipboard(clientes);
                  if (result.success) {
                    toast.success("Datos copiados al portapapeles");
                  } else {
                    toast.error("Error al copiar datos");
                  }
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar datos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  const subtitle = `Total: ${totalClientes} clientes | Mostrando: ${clientes.length} clientes`;
                  prepareForPrint({
                    title: "Lista de Clientes",
                    subtitle: subtitle,
                  });
                  toast.info("Preparando vista de impresión...");
                }}
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>
      {/* Stats Cards */}
      <EstadisticasRapidasClientes
        totalClientes={totalClientes}
        clientes={clientes}
        estadisticas={estadisticas}
      />

      {/* Filters */}
      <ClientesFiltros
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        tipoDocumentoFilter={tipoDocumentoFilter}
        setTipoDocumentoFilter={setTipoDocumentoFilter}
        estadoFilter={estadoFilter}
        setEstadoFilter={setEstadoFilter}
      />

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isDeletedView ? "Clientes Eliminados" : "Lista de Clientes"}
          </CardTitle>
          <CardDescription>
            {isDeletedView && (
              <span className="text-amber-600 font-medium mb-2 block">
                Estos clientes han sido eliminados. Puedes restaurarlos haciendo clic en "Restaurar".
              </span>
            )}
            <ResultsCounter
              count={clientes.length}
              total={totalClientes}
              entityLabel={isDeletedView ? "clientes eliminados" : "clientes"}
            />
            {isPending && (
              <span className="ml-2 text-blue-600">
                <RefreshCw className="inline h-3 w-3 animate-spin mr-1" />
                Actualizando...
              </span>
            )}
            {(searchQuery ||
              (tipoDocumentoFilter && tipoDocumentoFilter !== "ALL") ||
              estadoFilter !== "ACTIVE_ONLY") && (
              <span className="ml-2 text-green-600">• Filtros aplicados</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClienteTabla
            clientes={clientes}
            isPending={isPending}
            handleReactivate={handleReactivate}
            formatearDireccion={formatearDireccion}
            getBadgeVariant={getBadgeVariant}
            getEstadoText={getEstadoText}
            setSelectedCliente={setSelectedCliente}
            setShowDetailModal={setShowDetailModal}
            setShowEditModal={setShowEditModal}
            setShowDeleteDialog={setShowDeleteDialog}
            isDeletedView={isDeletedView}
          />

          {/* Pagination (componente reutilizable) */}
          <Paginator
            className="mt-4"
            currentPage={currentPage}
            totalPages={totalPagesNum}
            onPageChange={handlePageChange}
            limit={Number(searchParams.limit) || 8}
            total={totalClientes}
            entityLabel="clientes"
          />
        </CardContent>
      </Card>

      {/* Modales */}
      <Modal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Crear Nuevo Cliente"
        description="Completa la información del nuevo cliente"
        size="xl"
      >
        <ClienteForm onSuccess={handleSuccess} />
      </Modal>

      <Modal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        title="Editar Cliente"
        description="Modifica la información del cliente"
        size="xl"
      >
        {selectedCliente && (
          <ClienteForm cliente={selectedCliente} onSuccess={handleSuccess} />
        )}
      </Modal>

      <Modal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        title="Detalles del Cliente"
        description="Visualiza la información del cliente"
        size="xl"
      >
        {selectedCliente && <ClienteDetalle cliente={selectedCliente} />}
      </Modal>

      <Modal
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="¿Desactivar cliente?"
        description="Esta acción desactivará el cliente. El cliente no aparecerá en las listas activas pero se mantendrá en la base de datos y podrá ser reactivado posteriormente."
      >
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedCliente(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Desactivar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
