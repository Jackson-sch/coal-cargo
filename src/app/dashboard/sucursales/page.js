"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Users,
  Package,
  Loader2,
  Search,
  BarChart3,
  Download,
  Copy,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSucursales,
  createSucursal,
  updateSucursal,
  deleteSucursal,
  getEstadisticasSucursales,
} from "@/lib/actions/sucursales";
export default function SucursalesPage() {
  const [loading, setLoading] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [exportando, setExportando] = useState(false); // Modal state s
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // Form stat e
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    provincia: "",
    telefono: "",
  });
  useEffect(() => {
    cargarDatos();
  }, []);
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [sucursalesResult, estadisticasResult] = await Promise.all([
        getSucursales(),
        getEstadisticasSucursales(),
      ]);
      if (sucursalesResult.success) {
        setSucursales(sucursalesResult.data);
      } else {
        toast.error(sucursalesResult.error);
      }

      if (estadisticasResult.success) {
        setEstadisticas(estadisticasResult.data);
      }
    } catch (error) {
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.direccion || !formData.provincia) {
      toast.error("Por favor complete los campos obligatorios");
      return;
    }

    try {
      setSaving(true);
      let result;
      if (editingId) {
        result = await updateSucursal(editingId, formData);
      } else {
        result = await createSucursal(formData);
      }

      if (result.success) {
        toast.success(
          editingId
            ? "Sucursal actualizada correctamente"
            : "Sucursal creada correctamente"
        );
        handleCloseModal();
        await cargarDatos();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al guardar sucursal");
    } finally {
      setSaving(false);
    }
  };
  const handleEdit = (sucursal) => {
    setFormData({
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      provincia: sucursal.provincia,
      telefono: sucursal.telefono || "",
    });
    setEditingId(sucursal.id);
    setShowModal(true);
  };
  const handleDelete = async (sucursal) => {
    if (
      !confirm(`¿Está seguro de eliminar la sucursal "${sucursal.nombre}"?`)
    ) {
      return;
    }

    try {
      setLoading(true);
      const result = await deleteSucursal(sucursal.id);
      if (result.success) {
        toast.success("Sucursal eliminada correctamente");
        await cargarDatos();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al eliminar sucursal");
    } finally {
      setLoading(false);
    }
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ nombre: "", direccion: "", provincia: "", telefono: "" });
  }; // Exportar dato s
  const exportarDatos = async () => {
    try {
      setExportando(true);
      const headers = [
        "Nombre",
        "Dirección",
        "Provincia",
        "Teléfono",
        "Usuarios",
        "Envíos",
      ];
      const datos = filteredSucursales.map((sucursal) => [
        sucursal.nombre,
        sucursal.direccion,
        sucursal.provincia,
        sucursal.telefono || "",
        sucursal._count?.usuarios || 0,
        (sucursal._count?.enviosOrigen || 0) +
          (sucursal._count?.enviosDestino || 0),
      ]); // Crear CS V
      const csvContent = [
        headers.join(","),
        ...datos.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\\n"); // Descargar archiv o
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `sucursales_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Datos exportados correctamente");
    } catch (error) {
      toast.error("Error al exportar datos");
    } finally {
      setExportando(false);
    }
  }; // Copiar al portapapele s
  const copiarDatos = async () => {
    try {
      const texto = filteredSucursales
        .map(
          (sucursal) =>
            `${sucursal.nombre}\\t${sucursal.direccion}\\t${
              sucursal.provincia
            }\\t${sucursal.telefono || ""}\\t${
              sucursal._count?.usuarios || 0
            }\\t${
              (sucursal._count?.enviosOrigen || 0) +
              (sucursal._count?.enviosDestino || 0)
            }`
        )
        .join("\\n");
      await navigator.clipboard.writeText(texto);
      toast.success("Datos copiados al portapapeles");
    } catch (error) {
      toast.error("Error al copiar datos");
    }
  };
  const filteredSucursales = sucursales.filter((sucursal) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sucursal.nombre.toLowerCase().includes(searchLower) ||
      sucursal.direccion.toLowerCase().includes(searchLower) ||
      sucursal.provincia.toLowerCase().includes(searchLower) ||
      (sucursal.telefono &&
        sucursal.telefono.toLowerCase().includes(searchLower))
    );
  });
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8" /> Gestión de Sucursales
          </h1>
          <p className="text-muted-foreground">
            Administra las sucursales y centros de distribución de la empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copiarDatos}>
            <Copy className="h-4 w-4 mr-2" /> Copiar
          </Button>
          <Button
            variant="outline"
            onClick={exportarDatos}
            disabled={exportando}
          >
            {exportando ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exportar CSV
          </Button>
          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nueva Sucursal
          </Button>
        </div>
      </div>
      {/* Estadísticas */}
      {estadisticas && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sucursales
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estadisticas?.totalSucursales || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Usuarios Asignados
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estadisticas?.totalUsuarios || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Envíos
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estadisticas?.totalEnvios || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Promedio Usuarios
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estadisticas?.resumen?.promedioUsuariosPorSucursal || 0}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Sucursales con más actividad */}
          {estadisticas.sucursalesConActividad &&
            estadisticas.sucursalesConActividad.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" /> Sucursales con Más
                    Actividad
                  </CardTitle>
                  <CardDescription>
                    Top 5 sucursales por número de usuarios asignados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {estadisticas.sucursalesConActividad.map(
                      (sucursal, index) => (
                        <div
                          key={sucursal.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{sucursal.nombre}</p>
                              <p className="text-sm text-muted-foreground">
                                {sucursal.provincia}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {sucursal._count?.usuarios || 0} usuarios
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {(sucursal._count
                                ?.enviosOrigen || 0) +
                                (sucursal._count
                                  ?.enviosDestino || 0)}
                              envíos
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
        </>
      )}
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" /> Búsqueda y Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar sucursal</Label>
              <Input
                id="search"
                placeholder="Nombre, dirección, provincia o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Tabla de Sucursales */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Sucursales</CardTitle>
          <CardDescription>
            {filteredSucursales.length} sucursal(es) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Cargando sucursales...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Provincia</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Usuarios</TableHead>
                    <TableHead>Envíos</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSucursales.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {searchTerm
                          ? "No se encontraron sucursales"
                          : "No hay sucursales registradas"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSucursales.map((sucursal) => (
                      <TableRow key={sucursal.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {sucursal.nombre}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[200px]">
                              {sucursal.direccion}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{sucursal.provincia}</Badge>
                        </TableCell>
                        <TableCell>
                          {sucursal.telefono ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {sucursal.telefono}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {sucursal._count?.usuarios || 0} usuarios
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {(sucursal._count
                              ?.enviosOrigen || 0) +
                              (sucursal._count
                                ?.enviosDestino || 0)}
                            envíos
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(sucursal)}
                              title="Editar sucursal"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(sucursal)}
                              title="Eliminar sucursal"
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
      {/* Modal de Sucursal */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {editingId ? "Editar Sucursal" : "Nueva Sucursal"}
            </DialogTitle>
            <DialogDescription>
              Complete la información de la sucursal
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Nombre de la sucursal"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección *</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    direccion: e.target.value,
                  }))
                }
                placeholder="Dirección completa"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia *</Label>
              <Input
                id="provincia"
                value={formData.provincia}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    provincia: e.target.value,
                  }))
                }
                placeholder="Provincia donde se ubica"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, telefono: e.target.value }))
                }
                placeholder="Número de teléfono"
              />
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
                    <Building2 className="h-4 w-4 mr-2" />
                    {editingId ? "Actualizar" : "Crear"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
