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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Calculator,
  Route,
  Clock,
  Loader2,
  Search,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  getTarifasSucursales,
  createTarifaSucursal,
  updateTarifaSucursal,
  deleteTarifaSucursal,
  calcularTarifaSucursal,
  toggleTarifaSucursal,
} from "@/lib/actions/tarifas-sucursales";
export default function TarifasSucursalesClient({
  initialTarifas,
  sucursales,
}) {
  const [tarifas, setTarifas] = useState(initialTarifas);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrigen, setFilterOrigen] = useState("todas");
  const [filterDestino, setFilterDestino] = useState("todas");
  const [filterEstado, setFilterEstado] = useState("todas"); // Modal state s
  const [showModal, setShowModal] = useState(false);
  const [showCalculadora, setShowCalculadora] = useState(false);
  const [editingId, setEditingId] = useState(null); // Form stat e
  const [formData, setFormData] = useState({
    sucursalOrigenId: "",
    sucursalDestinoId: "",
    precioBase: "",
    precioKg: "",
    tiempoEstimado: "",
    observaciones: "",
    activo: true,
  });

  // Calculadora state
  const [calculadora, setCalculadora] = useState({
    sucursalOrigenId: "",
    sucursalDestinoId: "",
    peso: "",
    resultado: null,
  });
  const cargarTarifas = async () => {
    try {
      setLoading(true);
      const result = await getTarifasSucursales();
      if (result.success) {
        setTarifas(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al cargar las tarifas");
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.sucursalOrigenId ||
      !formData.sucursalDestinoId ||
      !formData.precioBase ||
      !formData.precioKg
    ) {
      toast.error("Por favor complete los campos obligatorios");
      return;
    }

    try {
      setSaving(true);
      let result;
      if (editingId) {
        result = await updateTarifaSucursal(editingId, formData);
      } else {
        result = await createTarifaSucursal(formData);
      }

      if (result.success) {
        toast.success(
          editingId
            ? "Tarifa actualizada correctamente"
            : "Tarifa creada correctamente"
        );
        handleCloseModal();
        await cargarTarifas();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al guardar la tarifa");
    } finally {
      setSaving(false);
    }
  };
  const handleEdit = (tarifa) => {
    setFormData({
      sucursalOrigenId: tarifa.sucursalOrigenId,
      sucursalDestinoId: tarifa.sucursalDestinoId,
      precioBase: tarifa.precioBase.toString(),
      precioKg: tarifa.precioKg.toString(),
      tiempoEstimado: tarifa.tiempoEstimado?.toString() || "",
      observaciones: tarifa.observaciones || "",
      activo: tarifa.activo,
    });
    setEditingId(tarifa.id);
    setShowModal(true);
  };
  const handleDelete = async (tarifa) => {
    if (
      !confirm(
        `¿Está seguro de eliminar la tarifa ${tarifa.sucursalOrigen.nombre} → ${tarifa.sucursalDestino.nombre}?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const result = await deleteTarifaSucursal(tarifa.id);
      if (result.success) {
        toast.success("Tarifa eliminada correctamente");
        await cargarTarifas();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al eliminar la tarifa");
    } finally {
      setLoading(false);
    }
  };
  const handleToggleActivo = async (tarifa) => {
    try {
      const result = await toggleTarifaSucursal(tarifa.id, !tarifa.activo);
      if (result.success) {
        toast.success(result.message);
        await cargarTarifas();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al cambiar el estado de la tarifa");
    }
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      sucursalOrigenId: "",
      sucursalDestinoId: "",
      precioBase: "",
      precioKg: "",
      tiempoEstimado: "",
      observaciones: "",
      activo: true,
    });
  };
  const handleCalcular = async () => {
    if (
      !calculadora.sucursalOrigenId ||
      !calculadora.sucursalDestinoId ||
      !calculadora.peso
    ) {
      toast.error("Complete todos los campos para calcular");
      return;
    }

    try {
      const result = await calcularTarifaSucursal(
        calculadora.sucursalOrigenId,
        calculadora.sucursalDestinoId,
        parseFloat(calculadora.peso)
      );
      if (result.success) {
        setCalculadora((prev) => ({ ...prev, resultado: result.data }));
      } else {
        toast.error(result.error);
        setCalculadora((prev) => ({ ...prev, resultado: null }));
      }
    } catch (error) {
      toast.error("Error al calcular la tarifa");
    }
  }; // Filtro s
  const filteredTarifas = tarifas.filter((tarifa) => {
    const matchesSearch =
      tarifa.sucursalOrigen.nombre
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      tarifa.sucursalDestino.nombre
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      tarifa.sucursalOrigen.provincia
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      tarifa.sucursalDestino.provincia
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesOrigen =
      filterOrigen === "todas" || tarifa.sucursalOrigenId === filterOrigen;
    const matchesDestino =
      filterDestino === "todas" || tarifa.sucursalDestinoId === filterDestino;
    const matchesEstado =
      filterEstado === "todas" ||
      (filterEstado === "activo" && tarifa.activo) ||
      (filterEstado === "inactivo" && !tarifa.activo);
    return matchesSearch && matchesOrigen && matchesDestino && matchesEstado;
  });
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCalculadora(true)}>
            <Calculator className="h-4 w-4 mr-2" /> Calculadora
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nueva Tarifa
          </Button>
        </div>
      </div>
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" /> Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Buscar</Label>
              <Input
                placeholder="Buscar por sucursal o provincia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Sucursal Origen</Label>
              <Select value={filterOrigen} onValueChange={setFilterOrigen}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las sucursales</SelectItem>
                  {sucursales.map((sucursal) => (
                    <SelectItem key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sucursal Destino</Label>
              <Select value={filterDestino} onValueChange={setFilterDestino}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las sucursales</SelectItem>
                  {sucursales.map((sucursal) => (
                    <SelectItem key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="activo">Activas</SelectItem>
                  <SelectItem value="inactivo">Inactivas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Tabla de Tarifas */}
      <Card>
        <CardHeader>
          <CardTitle>Tarifas Configuradas</CardTitle>
          <CardDescription>
            {filteredTarifas.length} tarifa(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Cargando tarifas...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ruta</TableHead>
                    <TableHead>Precio Base</TableHead>
                    <TableHead>Precio/Kg</TableHead>
                    <TableHead>Tiempo Est.</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTarifas.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {searchTerm ||
                        filterOrigen !== "todas" ||
                        filterDestino !== "todas" ||
                        filterEstado !== "todas"
                          ? "No se encontraron tarifas con los filtros aplicados"
                          : "No hay tarifas configuradas"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTarifas.map((tarifa) => (
                      <TableRow key={tarifa.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {tarifa.sucursalOrigen.nombre}
                                <ArrowRight className="h-3 w-3" />
                                {tarifa.sucursalDestino.nombre}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {tarifa.sucursalOrigen.provincia} →
                                {tarifa.sucursalDestino.provincia}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            S/ {tarifa.precioBase.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            S/ {tarifa.precioKg.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tarifa.tiempoEstimado ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {tarifa.tiempoEstimado} días
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={tarifa.activo}
                              onCheckedChange={() => handleToggleActivo(tarifa)}
                            />
                            <Badge
                              variant={tarifa.activo ? "default" : "secondary"}
                            >
                              {tarifa.activo ? "Activa" : "Inactiva"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(tarifa)}
                              title="Editar tarifa"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(tarifa)}
                              title="Eliminar tarifa"
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
          )}
        </CardContent>
      </Card>
      {/* Modal de Tarifa */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              {editingId ? "Editar Tarifa" : "Nueva Tarifa"}
            </DialogTitle>
            <DialogDescription>
              Configure la tarifa entre sucursales
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sucursal Origen *</Label>
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
                    <SelectValue placeholder="Seleccionar" />
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
              <div className="space-y-2">
                <Label>Sucursal Destino *</Label>
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
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales
                      .filter((s) => s.id !== formData.sucursalOrigenId)
                      .map((sucursal) => (
                        <SelectItem key={sucursal.id} value={sucursal.id}>
                          {sucursal.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio Base (S/) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precioBase}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      precioBase: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Precio por Kg (S/) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precioKg}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      precioKg: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tiempo Estimado (días)</Label>
              <Input
                type="number"
                min="1"
                value={formData.tiempoEstimado}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tiempoEstimado: e.target.value,
                  }))
                }
                placeholder="Ej: 3"
              />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    observaciones: e.target.value,
                  }))
                }
                placeholder="Notas adicionales sobre esta tarifa..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.activo}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, activo: checked }))
                }
              />
              <Label>Tarifa activa</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Route className="h-4 w-4 mr-2" />
                    {editingId ? "Actualizar" : "Crear"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Modal Calculadora */}
      <Dialog open={showCalculadora} onOpenChange={setShowCalculadora}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" /> Calculadora de Tarifas
            </DialogTitle>
            <DialogDescription>
              Calcule el costo de envío entre sucursales
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sucursal Origen</Label>
              <Select
                value={calculadora.sucursalOrigenId}
                onValueChange={(value) =>
                  setCalculadora((prev) => ({
                    ...prev,
                    sucursalOrigenId: value,
                    resultado: null,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar origen" />
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
            <div className="space-y-2">
              <Label>Sucursal Destino</Label>
              <Select
                value={calculadora.sucursalDestinoId}
                onValueChange={(value) =>
                  setCalculadora((prev) => ({
                    ...prev,
                    sucursalDestinoId: value,
                    resultado: null,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar destino" />
                </SelectTrigger>
                <SelectContent>
                  {sucursales
                    .filter((s) => s.id !== calculadora.sucursalOrigenId)
                    .map((sucursal) => (
                      <SelectItem key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                value={calculadora.peso}
                onChange={(e) =>
                  setCalculadora((prev) => ({
                    ...prev,
                    peso: e.target.value,
                    resultado: null,
                  }))
                }
                placeholder="Ej: 5.5"
              />
            </div>
            <Button onClick={handleCalcular} className="w-full">
              <Calculator className="h-4 w-4 mr-2" /> Calcular Tarifa
            </Button>
            {calculadora.resultado && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Resultado del Cálculo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Ruta:</span>
                    <span className="font-medium">
                      {calculadora.resultado.ruta.origen} →
                      {calculadora.resultado.ruta.destino}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peso:</span>
                    <span>{calculadora.resultado.peso} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precio base:</span>
                    <span>
                      S/ {calculadora.resultado.precioBase.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peso adicional:</span>
                    <span>{calculadora.resultado.pesoAdicional} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precio adicional:</span>
                    <span>
                      S/ {calculadora.resultado.precioAdicional.toFixed(2)}
                    </span>
                  </div>
                  {calculadora.resultado.tiempoEstimado && (
                    <div className="flex justify-between">
                      <span>Tiempo estimado:</span>
                      <span>{calculadora.resultado.tiempoEstimado} días</span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>
                      S/ {calculadora.resultado.precioTotal.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCalculadora(false);
                setCalculadora({
                  sucursalOrigenId: "",
                  sucursalDestinoId: "",
                  peso: "",
                  resultado: null,
                });
              }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
