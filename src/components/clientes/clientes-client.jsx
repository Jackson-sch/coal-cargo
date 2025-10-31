"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  toggleClienteEstado,
  reactivateCliente,
  getClientes,
} from "@/lib/actions/clientes";
import { useRouter } from "next/navigation";
import {
  exportClientesToExcel,
  prepareForPrint,
  copyToClipboard,
} from "@/lib/utils/export-utils";

export default function ClientesClient({
  initialClientes,
  totalPages,
  totalClientes,
  currentPage,
  searchParams = {},
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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
            10
          );
        } catch {
          return parseInt(searchParams?.limit) || 10;
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
        toast.error("Error al aplicar filtros: " + result.error);
      }
    } catch (error) {
      toast.error("Error al aplicar filtros");
    }
  }, []);

  // Debounce para la búsqueda de texto
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFiltersRealTime(searchQuery, tipoDocumentoFilter, estadoFilter);
    }, 500); // 500ms de delay para búsqueda de texto

    return () => clearTimeout(timer);
  }, [searchQuery, applyFiltersRealTime, tipoDocumentoFilter, estadoFilter]);

  // Para filtros de select (sin delay)
  const handleSelectFilterChange = useCallback(
    (filterType, value) => {
      if (filterType === "tipoDocumento") {
        setTipoDocumentoFilter(value);
      } else if (filterType === "estado") {
        setEstadoFilter(value);
      }

      // Aplicar filtros inmediatamente para selects
      const newTipoDoc =
        filterType === "tipoDocumento" ? value : tipoDocumentoFilter;
      const newEstado = filterType === "estado" ? value : estadoFilter;
      applyFiltersRealTime(searchQuery, newTipoDoc, newEstado);
    },
    [searchQuery, tipoDocumentoFilter, estadoFilter, applyFiltersRealTime]
  );

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

  // Función para activar/desactivar cliente
  const handleToggleEstado = async (cliente) => {
    try {
      const result = await toggleClienteEstado(cliente.id);
      if (result.success) {
        const accion = result.data.estado ? "activado" : "desactivado";
        toast.success(`Cliente ${accion} correctamente`);
        // Actualizar el estado local inmediatamente
        setClientes((prevClientes) =>
          prevClientes.map((c) =>
            c.id === cliente.id ? { ...c, estado: result.data.estado } : c
          )
        );
        // Refrescar desde el servidor después de un pequeño delay
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        toast.error(result.error || "Error al cambiar estado del cliente");
      }
    } catch (error) {
      toast.error("Error al cambiar estado del cliente");
    }
  };

  // Función para reactivar cliente inactivo
  const handleReactivate = async (cliente) => {
    try {
      const result = await reactivateCliente(cliente.id);
      if (result.success) {
        toast.success("Cliente reactivado correctamente");
        // Actualizar el estado local inmediatamente
        setClientes((prevClientes) =>
          prevClientes.map((c) =>
            c.id === cliente.id ? { ...c, estado: true } : c
          )
        );
        // Refrescar desde el servidor después de un pequeño delay
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        toast.error(result.error || "Error al reactivar cliente");
      }
    } catch (error) {
      toast.error("Error al reactivar cliente");
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
    // if (cliente.deletedAt) {
    //   return "outline"; // Cliente eliminado (soft delete)
    // }
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
    // if (cliente.deletedAt) {
    //   return "Eliminado";
    // }
    return cliente.estado ? "Activo" : "Inactivo";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stats-cards">
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClientes}</div>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientes.filter((c) => c.estado === true).length}
            </div>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientes.filter((c) => c.estado === false).length}
            </div>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Página</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre, documento, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo Documento</label>
              <Select
                value={tipoDocumentoFilter}
                onValueChange={(value) =>
                  handleSelectFilterChange("tipoDocumento", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="RUC">RUC</SelectItem>
                  <SelectItem value="CARNET_EXTRANJERIA">
                    Carnet de Extranjería
                  </SelectItem>
                  <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select
                value={estadoFilter}
                onValueChange={(value) =>
                  handleSelectFilterChange("estado", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Solo activos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE_ONLY">Solo activos</SelectItem>
                  <SelectItem value="ALL">
                    Todos (activos e inactivos)
                  </SelectItem>
                  <SelectItem value="false">Solo inactivos</SelectItem>
                  <SelectItem value="deleted">Solo eliminados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="w-full p-3 rounded-lg bg-muted/50 border border-dashed">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  {isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Filtrando en tiempo real...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Filtros en tiempo real activos
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            <ResultsCounter
              count={clientes.length}
              total={totalClientes}
              entityLabel="clientes"
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
          <div className="relative">
            {/* Loading overlay */}
            {isPending && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-md">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  <p className="text-sm text-muted-foreground">
                    Cargando clientes...
                  </p>
                </div>
              </div>
            )}
            <div
              className="rounded-md border"
              role="region"
              aria-label="Tabla de clientes"
              tabIndex={0}
            >
              <Table aria-label="Lista de clientes registrados">
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right no-print">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente, index) => (
                    <TableRow
                      key={cliente.id}
                      className="animate-in fade-in slide-in-from-bottom-2 hover:bg-muted/50 transition-colors duration-200"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: "backwards",
                      }}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium capitalize">
                            {cliente.tipoDocumento === "DNI"
                              ? `${cliente.nombre} ${cliente.apellidos}`
                              : cliente.razonSocial}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {cliente.tipoDocumento === "DNI"
                              ? "PERSONA NATURAL"
                              : "PERSONA JURIDICA"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {cliente.numeroDocumento}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {cliente.tipoDocumento}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {cliente.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {cliente.email}
                            </div>
                          )}
                          {cliente.telefono && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {cliente.telefono}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">
                            {formatearDireccion(cliente)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(cliente)}>
                          {getEstadoText(cliente)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right no-print">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCliente(cliente);
                                setShowDetailModal(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCliente(cliente);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {/* Mostrar opciones según el estado del cliente */}
                            {false ? ( // Comentado: cliente.deletedAt
                              // Cliente eliminado (soft delete) - Solo restaurar
                              <DropdownMenuItem
                                onClick={() => handleReactivate(cliente)}
                                className="text-green-600"
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Restaurar
                              </DropdownMenuItem>
                            ) : (
                              // Cliente no eliminado - Opciones normales
                              <>
                                {!cliente.estado && (
                                  <DropdownMenuItem
                                    onClick={() => handleReactivate(cliente)}
                                    className="text-green-600"
                                  >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Reactivar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleToggleEstado(cliente)}
                                  className={
                                    cliente.estado
                                      ? "text-orange-600"
                                      : "text-green-600"
                                  }
                                >
                                  {cliente.estado ? (
                                    <>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Desactivar
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Activar
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </>
                            )}
                            {cliente.estado && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCliente(cliente);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Desactivar permanentemente
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination (componente reutilizable) */}
          <Paginator
            currentPage={currentPage}
            totalPages={totalPagesNum}
            onPageChange={handlePageChange}
            itemsPerPage={Number(searchParams.limit) || 10}
            onItemsPerPageChange={(newLimit) => {
              const params = new URLSearchParams(window.location.search);
              params.set("limit", String(newLimit));
              params.set("page", "1");
              router.push(`/dashboard/clientes?${params.toString()}`);
            }}
            itemsPerPageOptions={[10, 20, 50, 100]}
            showItemsPerPage
            showNumbers
            showAlways
          />
        </CardContent>
      </Card>

      {/* Modales */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Completa la información del nuevo cliente
            </DialogDescription>
          </DialogHeader>
          <ClienteForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifica la información del cliente
            </DialogDescription>
          </DialogHeader>
          {selectedCliente && (
            <ClienteForm cliente={selectedCliente} onSuccess={handleSuccess} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Cliente</DialogTitle>
          </DialogHeader>
          {selectedCliente && <ClienteDetalle cliente={selectedCliente} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará permanentemente el cliente. El cliente no
              aparecerá en las listas activas pero se mantendrá en la base de
              datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
