"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Plus, Filter, Car, RefreshCw, X, Trash2 } from "lucide-react";
import Paginator from "@/components/ui/paginator";
import ResultsCounter from "@/components/ui/results-counter";
import { toast } from "sonner";
import VehiculoForm from "@/components/vehiculos/vehiculo-form";
import VehiculoDetalle from "@/components/vehiculos/vehiculo-detalle";
import VehiculoTabla from "@/components/vehiculos/vehiculo-tabla";
import {
  deleteVehiculo,
  getVehiculos,
  updateEstadoVehiculo,
  getEstadisticasVehiculos,
} from "@/lib/actions/vehiculos";
import { getSucursalesList } from "@/lib/actions/sucursales";
import Modal from "@/components/ui/modal";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermissions } from "@/hooks/use-permissions";

const ESTADOS = [
  { value: "all", label: "Todos" },
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "EN_RUTA", label: "En Ruta" },
  { value: "MANTENIMIENTO", label: "Mantenimiento" },
  { value: "INACTIVO", label: "Inactivo" },
];

const TIPOS_VEHICULO = [
  { value: "all", label: "Todos" },
  { value: "CAMION_PEQUENO", label: "Camión Pequeño" },
  { value: "CAMION_MEDIANO", label: "Camión Mediano" },
  { value: "CAMION_GRANDE", label: "Camión Grande" },
  { value: "TRAILER", label: "Trailer" },
  { value: "FURGONETA", label: "Furgoneta" },
  { value: "MOTOCICLETA", label: "Motocicleta" },
];

export default function VehiculosClient({
  initialVehiculos,
  totalPages,
  totalVehiculos,
  currentPage,
  searchParams = {},
  estadisticas = null,
}) {
  const [isPending, startTransition] = useTransition();
  const { handleError, handleAsyncError } = useErrorHandler();
  const { canCreate, isSuperAdmin } = usePermissions();
  const [vehiculos, setVehiculos] = useState(initialVehiculos);
  const [sucursales, setSucursales] = useState([]);
  const [estadisticasData, setEstadisticasData] = useState(estadisticas);

  // Filtros
  const [searchQuery, setSearchQuery] = useState(searchParams.q || "");
  const [estadoFilter, setEstadoFilter] = useState(
    searchParams.estado || "all"
  );
  const [sucursalFilter, setSucursalFilter] = useState(
    searchParams.sucursalId || "all"
  );
  const [tipoVehiculoFilter, setTipoVehiculoFilter] = useState(
    searchParams.tipoVehiculo || "all"
  );

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);

  // Cargar sucursales
  useEffect(() => {
    const loadSucursales = async () => {
      try {
        const result = await getSucursalesList();
        if (result.success) {
          setSucursales(result.data || []);
        }
      } catch (error) {
        handleError(error);
      }
    };
    loadSucursales();
  }, []);

  // Cargar estadísticas
  useEffect(() => {
    const loadEstadisticas = async () => {
      try {
        const result = await getEstadisticasVehiculos();
        if (result.success) {
          setEstadisticasData(result.data);
        }
      } catch (error) {
        handleError(error);
      }
    };
    loadEstadisticas();
  }, []);

  // Aplicar filtros
  const applyFilters = useCallback(
    async (page = 1) => {
      startTransition(async () => {
        try {
          const filters = {
            page,
            limit: 10,
            q: debouncedSearch || undefined,
            estado: estadoFilter !== "all" ? estadoFilter : undefined,
            sucursalId: sucursalFilter !== "all" ? sucursalFilter : undefined,
            tipoVehiculo:
              tipoVehiculoFilter !== "all" ? tipoVehiculoFilter : undefined,
          };

          const result = await getVehiculos(filters);
          if (result.success) {
            setVehiculos(result.data);
          } else {
            handleError(new Error(result.error || "Error al cargar vehículos"));
          }
        } catch (error) {
          handleError(error);
        }
      });
    },
    [debouncedSearch, estadoFilter, sucursalFilter, tipoVehiculoFilter]
  );

  // Aplicar filtros cuando cambian
  useEffect(() => {
    applyFilters(1);
  }, [debouncedSearch, estadoFilter, sucursalFilter, tipoVehiculoFilter]);

  // Handlers
  const handleCreateSuccess = (vehiculo) => {
    setShowCreateModal(false);
    applyFilters(1);
    if (estadisticasData) {
      getEstadisticasVehiculos().then((result) => {
        if (result.success) {
          setEstadisticasData(result.data);
        }
      });
    }
  };

  const handleEditSuccess = (vehiculo) => {
    setShowEditModal(false);
    setSelectedVehiculo(null);
    applyFilters(currentPage);
    if (estadisticasData) {
      getEstadisticasVehiculos().then((result) => {
        if (result.success) {
          setEstadisticasData(result.data);
        }
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedVehiculo) return;

    try {
      const result = await deleteVehiculo(selectedVehiculo.id);
      if (result.success) {
        toast.success("Vehículo eliminado correctamente");
        setShowDeleteDialog(false);
        setSelectedVehiculo(null);
        applyFilters(currentPage);
        if (estadisticasData) {
          getEstadisticasVehiculos().then((result) => {
            if (result.success) {
              setEstadisticasData(result.data);
            }
          });
        }
      } else {
        toast.error(result.error || "Error al eliminar el vehículo");
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleUpdateEstado = async (vehiculoId, nuevoEstado) => {
    try {
      const result = await updateEstadoVehiculo(vehiculoId, nuevoEstado);
      if (result.success) {
        toast.success("Estado del vehículo actualizado correctamente");
        applyFilters(currentPage);
        if (estadisticasData) {
          getEstadisticasVehiculos().then((result) => {
            if (result.success) {
              setEstadisticasData(result.data);
            }
          });
        }
      } else {
        toast.error(result.error || "Error al actualizar el estado");
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setEstadoFilter("all");
    setSucursalFilter("all");
    setTipoVehiculoFilter("all");
  };

  const hasActiveFilters =
    searchQuery ||
    estadoFilter !== "all" ||
    sucursalFilter !== "all" ||
    tipoVehiculoFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {estadisticasData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {estadisticasData.total || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
              <Car className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {estadisticasData.disponibles || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Ruta</CardTitle>
              <Car className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {estadisticasData.enRuta || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Mantenimiento
              </CardTitle>
              <Car className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {estadisticasData.enMantenimiento || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
              <Car className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {estadisticasData.inactivos || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 md:grid-cols-2 ${isSuperAdmin() ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por placa, marca, modelo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isSuperAdmin() && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Sucursal</label>
                <Select value={sucursalFilter} onValueChange={setSucursalFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {sucursales.map((sucursal) => (
                      <SelectItem key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Vehículo</label>
              <Select
                value={tipoVehiculoFilter}
                onValueChange={setTipoVehiculoFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_VEHICULO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex items-center justify-between">
        <ResultsCounter
          total={totalVehiculos || 0}
          current={vehiculos?.length || 0}
          label="vehículos"
        />
        {canCreate("vehiculos") && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Vehículo
          </Button>
        )}
      </div>

      {/* Tabla */}
      <VehiculoTabla
        vehiculos={vehiculos}
        isPending={isPending}
        onView={(vehiculo) => {
          setSelectedVehiculo(vehiculo);
          setShowDetailModal(true);
        }}
        onEdit={(vehiculo) => {
          setSelectedVehiculo(vehiculo);
          setShowEditModal(true);
        }}
        onDelete={(vehiculo) => {
          setSelectedVehiculo(vehiculo);
          setShowDeleteDialog(true);
        }}
        onUpdateEstado={handleUpdateEstado}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <Paginator
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => applyFilters(page)}
        />
      )}

      {/* Modal Crear */}
      <Modal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Nuevo Vehículo"
        description="Completa el formulario para registrar un nuevo vehículo en la flota"
        size="xl"
      >
        <VehiculoForm onSuccess={handleCreateSuccess} />
      </Modal>

      {/* Modal Editar */}
      <Modal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        title="Editar Vehículo"
        description="Modifica la información del vehículo"
        size="xl"
      >
        {selectedVehiculo && (
          <VehiculoForm
            vehiculo={selectedVehiculo}
            onSuccess={handleEditSuccess}
          />
        )}
      </Modal>

      {/* Modal Detalle */}
      <Modal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        title="Detalle del Vehículo"
        description="Información completa del vehículo"
        size="xl"
      >
        {selectedVehiculo && <VehiculoDetalle vehiculo={selectedVehiculo} />}
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="¿Eliminar vehículo?"
        description="Esta acción marcará el vehículo como eliminado. No podrás deshacer esta acción."
        size="default"
        icon={<Trash2 className="h-5 w-5 text-destructive" />}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedVehiculo(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        }
      >
        {selectedVehiculo && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Estás a punto de eliminar el siguiente vehículo:
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold">Placa: {selectedVehiculo.placa}</p>
              {selectedVehiculo.marca && selectedVehiculo.modelo && (
                <p className="text-sm text-muted-foreground">
                  {selectedVehiculo.marca} {selectedVehiculo.modelo}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
