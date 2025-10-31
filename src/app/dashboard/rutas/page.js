"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Route,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Clock,
  Truck,
  Calculator,
  Navigation,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getRutas,
  createRuta,
  updateRuta,
  deleteRuta,
  getEstadisticasRutas,
  optimizarRutas,
} from "@/lib/actions/rutas";
import { getSucursales } from "@/lib/actions/sucursales";

const tiposRuta = [
  { value: "urbana", label: "Urbana" },
  { value: "interurbana", label: "Interurbana" },
  { value: "interprovincial", label: "Interprovincial" },
  { value: "interdepartamental", label: "Interdepartamental" },
];

export default function RutasPage() {
  const [rutas, setRutas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showOptimizarDialog, setShowOptimizarDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [estadisticas, setEstadisticas] = useState({
    totalRutas: 0,
    rutasActivas: 0,
    distanciaTotal: 0,
    costoPromedio: 0,
  });
  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    tipo: "urbana",
    sucursalOrigenId: "",
    sucursalDestinoId: "",
    distancia: "",
    tiempoEstimado: "",
    costoBase: "",
    costoPeajes: "",
    costoCombustible: "",
    tipoVehiculo: "",
    capacidadMaxima: "",
    descripcion: "",
    activo: true,
    observaciones: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [rutasResult, sucursalesResult, estadisticasResult] =
        await Promise.all([
          getRutas({
            search: searchTerm,
            tipo: filterTipo,
            activo: filterEstado,
          }),
          getSucursales(),
          getEstadisticasRutas(),
        ]);

      if (rutasResult.success) {
        setRutas(rutasResult.data.rutas);
      } else {
        toast.error(rutasResult.error || "Error al cargar rutas");
      }

      if (sucursalesResult.success) {
        setSucursales(sucursalesResult.data);
      } else {
        toast.error("Error al cargar sucursales");
      }

      if (estadisticasResult.success) {
        setEstadisticas(estadisticasResult.data);
      } else {
        toast.error("Error al cargar estadísticas");
      }
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (editingId) {
        result = await updateRuta(editingId, formData);
      } else {
        result = await createRuta(formData);
      }

      if (result.success) {
        toast.success(
          result.message ||
            (editingId
              ? "Ruta actualizada correctamente"
              : "Ruta creada correctamente")
        );
        handleCloseModal();
        loadData();
      } else {
        toast.error(result.error || "Error al procesar ruta");
      }
    } catch (error) {
      toast.error("Error al procesar ruta");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ruta) => {
    setEditingId(ruta.id);
    setFormData({
      nombre: ruta.nombre || "",
      codigo: ruta.codigo || "",
      tipo: ruta.tipo?.toLowerCase() || "urbana",
      sucursalOrigenId: ruta.sucursalOrigenId || "",
      sucursalDestinoId: ruta.sucursalDestinoId || "",
      distancia:
        ruta.distancia !== null && ruta.distancia !== undefined
          ? ruta.distancia.toString()
          : "",
      tiempoEstimado:
        ruta.tiempoEstimado !== null && ruta.tiempoEstimado !== undefined
          ? ruta.tiempoEstimado.toString()
          : "",
      costoBase:
        ruta.costoBase !== null && ruta.costoBase !== undefined
          ? ruta.costoBase.toString()
          : "",
      costoPeajes:
        ruta.costoPeajes !== null && ruta.costoPeajes !== undefined
          ? ruta.costoPeajes.toString()
          : "",
      costoCombustible:
        ruta.costoCombustible !== null && ruta.costoCombustible !== undefined
          ? ruta.costoCombustible.toString()
          : "",
      tipoVehiculo: ruta.tipoVehiculo?.toLowerCase() || "",
      capacidadMaxima:
        ruta.capacidadMaxima !== null && ruta.capacidadMaxima !== undefined
          ? ruta.capacidadMaxima.toString()
          : "",
      descripcion: ruta.descripcion || "",
      activo: ruta.activo !== undefined ? ruta.activo : true,
      observaciones: ruta.observaciones || "",
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setLoading(true);
    try {
      const result = await deleteRuta(deleteId);
      if (result.success) {
        toast.success(result.message || "Ruta eliminada correctamente");
        setShowDeleteDialog(false);
        setDeleteId(null);
        loadData();
      } else {
        toast.error(result.error || "Error al eliminar ruta");
      }
    } catch (error) {
      toast.error("Error al eliminar ruta");
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizar = async () => {
    try {
      setLoading(true);
      const resultado = await optimizarRutas();
      if (resultado.success) {
        toast.success(resultado.message || "Optimización completada");
      } else {
        toast.error(resultado.error || "Error al optimizar rutas");
      }
      setShowOptimizarDialog(false);
    } catch (error) {
      toast.error("Error al optimizar rutas");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      nombre: "",
      codigo: "",
      tipo: "urbana",
      sucursalOrigenId: "",
      sucursalDestinoId: "",
      distancia: "",
      tiempoEstimado: "",
      costoBase: "",
      costoPeajes: "",
      costoCombustible: "",
      tipoVehiculo: "",
      capacidadMaxima: "",
      descripcion: "",
      activo: true,
      observaciones: "",
    });
  };

  const filteredRutas = rutas.filter((ruta) => {
    const matchesSearch =
      ruta.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ruta.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === "todos" || ruta.tipo === filterTipo;
    const matchesEstado =
      filterEstado === "todos" ||
      (filterEstado === "activo" && ruta.activo) ||
      (filterEstado === "inactivo" && !ruta.activo);

    return matchesSearch && matchesTipo && matchesEstado;
  });

  const getTipoLabel = (tipo) => {
    const tipoObj = tiposRuta.find((t) => t.value === tipo);
    return tipoObj ? tipoObj.label : tipo;
  };

  const getTipoBadgeColor = (tipo) => {
    const colors = {
      urbana: "bg-blue-100 text-blue-800",
      interurbana: "bg-green-100 text-green-800",
      interprovincial: "bg-purple-100 text-purple-800",
      interdepartamental: "bg-orange-100 text-orange-800",
    };
    return colors[tipo] || "bg-gray-100 text-gray-800";
  };

  const formatTiempo = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return horas > 0 ? `${horas}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rutas</h1>
          <p className="text-muted-foreground">
            Gestiona las rutas de transporte y optimiza los recorridos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowOptimizarDialog(true)}
            className="gap-2"
          >
            <Navigation className="h-4 w-4" />
            Optimizar Rutas
          </Button>
          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Ruta
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Nombre, código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filterTipo">Tipo de Ruta</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {tiposRuta.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterEstado">Estado</Label>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
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

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Route className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Rutas
                </p>
                <p className="text-2xl font-bold">{estadisticas.totalRutas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Rutas Activas
                </p>
                <p className="text-2xl font-bold">
                  {estadisticas.rutasActivas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Distancia Total
                </p>
                <p className="text-2xl font-bold">
                  {estadisticas.distanciaTotal.toLocaleString()} km
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Costo Promedio
                </p>
                <p className="text-2xl font-bold">
                  S/ {estadisticas.costoPromedio.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Rutas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Rutas</CardTitle>
          <CardDescription>
            {filteredRutas.length} ruta(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origen → Destino</TableHead>
                  <TableHead>Distancia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      Cargando rutas...
                    </TableCell>
                  </TableRow>
                ) : filteredRutas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No se encontraron rutas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRutas.map((ruta) => (
                    <TableRow key={ruta.id}>
                      <TableCell className="font-medium">
                        {ruta.codigo}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Route className="h-4 w-4 text-muted-foreground" />
                          {ruta.nombre}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTipoBadgeColor(ruta.tipo)}>
                          {getTipoLabel(ruta.tipo)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-green-600" />
                            {ruta.sucursalOrigen?.nombre || "N/A"}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-red-600" />
                            {ruta.sucursalDestino?.nombre || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ruta.distancia ? `${ruta.distancia} km` : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ruta.activo ? "default" : "secondary"}>
                          {ruta.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(ruta)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteId(ruta.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Ruta */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Ruta" : "Nueva Ruta"}
            </DialogTitle>
            <DialogDescription>
              Complete la información de la ruta de transporte
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre de la Ruta *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nombre: e.target.value,
                    }))
                  }
                  placeholder="Nombre descriptivo de la ruta"
                  required
                />
              </div>
              <div>
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      codigo: e.target.value,
                    }))
                  }
                  placeholder="Código único de la ruta"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo de Ruta</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, tipo: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposRuta.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, activo: checked }))
                  }
                />
                <Label htmlFor="activo">Ruta activa</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sucursalOrigen">Sucursal Origen *</Label>
                <Select
                  value={formData.sucursalOrigenId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      sucursalOrigenId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sucursal origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales.map((sucursal) => (
                      <SelectItem key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sucursalDestino">Sucursal Destino *</Label>
                <Select
                  value={formData.sucursalDestinoId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      sucursalDestinoId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sucursal destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales.map((sucursal) => (
                      <SelectItem key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="distancia">Distancia (km)</Label>
                <Input
                  id="distancia"
                  type="number"
                  step="0.1"
                  value={formData.distancia}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      distancia: e.target.value,
                    }))
                  }
                  placeholder="0.0"
                />
              </div>
              <div>
                <Label htmlFor="tiempoEstimado">Tiempo Estimado (min)</Label>
                <Input
                  id="tiempoEstimado"
                  type="number"
                  value={formData.tiempoEstimado}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tiempoEstimado: e.target.value,
                    }))
                  }
                  placeholder="60"
                />
              </div>
              <div>
                <Label htmlFor="costo">Costo Base (S/)</Label>
                <Input
                  id="costo"
                  type="number"
                  step="0.01"
                  value={formData.costoBase}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      costoBase: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    observaciones: e.target.value,
                  }))
                }
                placeholder="Observaciones adicionales"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingId ? "Actualizando..." : "Creando..."}
                  </>
                ) : (
                  <>{editingId ? "Actualizar" : "Crear"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Optimización */}
      <Dialog open={showOptimizarDialog} onOpenChange={setShowOptimizarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Optimizar Rutas</DialogTitle>
            <DialogDescription>
              ¿Desea iniciar el proceso de optimización de rutas? Esto puede
              tomar algunos minutos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOptimizarDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleOptimizar} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimizando...
                </>
              ) : (
                "Iniciar Optimización"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmación de Eliminación */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar esta ruta? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
