"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Route,
  Plus,
  Navigation,
  Search,
  Filter,
  X,
  RefreshCw,
  Loader2,
  Calculator,
  MapPin,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import RutaForm from "@/components/rutas/ruta-form";
import RutaTabla from "@/components/rutas/ruta-tabla";
import {
  deleteRuta,
  getRutas,
  getEstadisticasRutas,
  optimizarRutas,
} from "@/lib/actions/rutas";
import Modal from "@/components/ui/modal";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermissions } from "@/hooks/use-permissions";

const TIPOS_RUTA = [
  { value: "todos", label: "Todos los tipos" },
  { value: "URBANA", label: "Urbana" },
  { value: "INTERURBANA", label: "Interurbana" },
  { value: "INTERPROVINCIAL", label: "Interprovincial" },
  { value: "INTERDEPARTAMENTAL", label: "Interdepartamental" },
];

export default function RutasClient({
  initialRutas,
  totalPages,
  totalRutas,
  currentPage,
  searchParams = {},
  estadisticas = null,
}) {
  const [isPending, startTransition] = useTransition();
  const [rutas, setRutas] = useState(initialRutas || []);
  const [estadisticasData, setEstadisticasData] = useState(estadisticas);
  const { canCreate, isSuperAdmin } = usePermissions();

  // Filtros
  const [searchQuery, setSearchQuery] = useState(searchParams.q || "");
  const [tipoFilter, setTipoFilter] = useState(searchParams.tipo || "todos");
  const [estadoFilter, setEstadoFilter] = useState(
    searchParams.estado || "todos"
  );

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptimizarModal, setShowOptimizarModal] = useState(false);
  const [selectedRuta, setSelectedRuta] = useState(null);

  // Cargar estadísticas
  useEffect(() => {
    const loadEstadisticas = async () => {
      try {
        const result = await getEstadisticasRutas();
        if (result.success) {
          setEstadisticasData(result.data);
        }
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
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
            search: debouncedSearch || undefined,
            tipo: tipoFilter !== "todos" ? tipoFilter : undefined,
            activo:
              estadoFilter === "activo"
                ? "activo"
                : estadoFilter === "inactivo"
                ? "inactivo"
                : undefined,
          };

          const result = await getRutas(filters);
          if (result.success) {
            setRutas(result.data.rutas || []);
          } else {
            toast.error(result.error || "Error al cargar rutas");
          }
        } catch (error) {
          console.error("Error al cargar rutas:", error);
          toast.error("Error al cargar rutas");
        }
      });
    },
    [debouncedSearch, tipoFilter, estadoFilter]
  );

  // Aplicar filtros cuando cambian
  useEffect(() => {
    applyFilters(1);
  }, [debouncedSearch, tipoFilter, estadoFilter]);

  // Handlers
  const handleCreateSuccess = (ruta) => {
    setShowCreateModal(false);
    applyFilters(1);
    if (estadisticasData) {
      getEstadisticasRutas().then((result) => {
        if (result.success) {
          setEstadisticasData(result.data);
        }
      });
    }
  };

  const handleEditSuccess = (ruta) => {
    setShowEditModal(false);
    setSelectedRuta(null);
    applyFilters(currentPage);
    if (estadisticasData) {
      getEstadisticasRutas().then((result) => {
        if (result.success) {
          setEstadisticasData(result.data);
        }
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedRuta) return;

    try {
      const result = await deleteRuta(selectedRuta.id);
      if (result.success) {
        toast.success("Ruta eliminada correctamente");
        setShowDeleteModal(false);
        setSelectedRuta(null);
        applyFilters(currentPage);
        if (estadisticasData) {
          getEstadisticasRutas().then((result) => {
            if (result.success) {
              setEstadisticasData(result.data);
            }
          });
        }
      } else {
        toast.error(result.error || "Error al eliminar la ruta");
      }
    } catch (error) {
      console.error("Error al eliminar ruta:", error);
      toast.error("Error al eliminar la ruta");
    }
  };

  const handleOptimizar = async () => {
    try {
      const result = await optimizarRutas();
      if (result.success) {
        toast.success(result.message || "Optimización completada");
        setShowOptimizarModal(false);
        applyFilters(currentPage);
      } else {
        toast.error(result.error || "Error al optimizar rutas");
      }
    } catch (error) {
      console.error("Error al optimizar rutas:", error);
      toast.error("Error al optimizar rutas");
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setTipoFilter("todos");
    setEstadoFilter("todos");
  };

  const hasActiveFilters =
    searchQuery || tipoFilter !== "todos" || estadoFilter !== "todos";

  const handlePageChange = (page) => {
    applyFilters(page);
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {estadisticasData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rutas</CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {estadisticasData.totalRutas || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Rutas Activas
              </CardTitle>
              <MapPin className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {estadisticasData.rutasActivas || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Distancia Total
              </CardTitle>
              <Truck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {estadisticasData.distanciaTotal?.toLocaleString() || 0} km
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Costo Promedio
              </CardTitle>
              <Calculator className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                S/ {estadisticasData.costoPromedio?.toFixed(2) || "0.00"}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Ruta</label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_RUTA.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="inactivo">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones y Tabla */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Rutas</CardTitle>
              <CardDescription>
                {rutas.length} ruta(s) encontrada(s)
                {isPending && (
                  <span className="ml-2 text-blue-600">
                    <RefreshCw className="inline h-3 w-3 animate-spin mr-1" />
                    Actualizando...
                  </span>
                )}
                {hasActiveFilters && (
                  <span className="ml-2 text-green-600">
                    • Filtros aplicados
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {isSuperAdmin() && (
                <Button
                  variant="outline"
                  onClick={() => setShowOptimizarModal(true)}
                  className="gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  Optimizar Rutas
                </Button>
              )}
              {canCreate("rutas") && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Ruta
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RutaTabla
            rutas={rutas}
            isPending={isPending}
            onEdit={(ruta) => {
              setSelectedRuta(ruta);
              setShowEditModal(true);
            }}
            onDelete={(ruta) => {
              setSelectedRuta(ruta);
              setShowDeleteModal(true);
            }}
          />
        </CardContent>
      </Card>

      {/* Modales */}
      <Modal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Nueva Ruta"
        description="Complete la información de la ruta de transporte"
        size="lg"
        icon={<Route className="h-5 w-5" />}
      >
        <RutaForm onSuccess={handleCreateSuccess} />
      </Modal>

      <Modal
        open={showEditModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditModal(false);
            setSelectedRuta(null);
          }
        }}
        title="Editar Ruta"
        description="Modifique la información de la ruta"
        size="xl"
        icon={<Route className="h-5 w-5" />}
      >
        {selectedRuta && (
          <RutaForm ruta={selectedRuta} onSuccess={handleEditSuccess} />
        )}
      </Modal>

      <Modal
        open={showDeleteModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteModal(false);
            setSelectedRuta(null);
          }
        }}
        title="Confirmar Eliminación"
        description={
          selectedRuta
            ? `¿Está seguro de que desea eliminar la ruta "${selectedRuta.nombre}"? Esta acción no se puede deshacer.`
            : "¿Está seguro de que desea eliminar esta ruta?"
        }
        size="sm"
        icon={<Route className="h-5 w-5 text-destructive" />}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedRuta(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        }
      />

      <Modal
        open={showOptimizarModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowOptimizarModal(false);
          }
        }}
        title="Optimizar Rutas"
        description="¿Desea iniciar el proceso de optimización de rutas? Esto puede tomar algunos minutos."
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowOptimizarModal(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleOptimizar}>Iniciar Optimización</Button>
          </div>
        }
      />
    </div>
  );
}
