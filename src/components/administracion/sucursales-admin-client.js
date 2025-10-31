"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  MapPin,
  Phone,
  UserPlus,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  crearSucursal,
  actualizarSucursal,
  eliminarSucursal,
  asignarAdministradorSucursal,
} from "@/lib/actions/sucursales-admin";

export default function SucursalesAdminClient({ initialSucursales }) {
  const [sucursales, setSucursales] = useState(initialSucursales);
  const [filtro, setFiltro] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState(null);
  const [deletingSucursal, setDeletingSucursal] = useState(null);
  const [assigningSucursal, setAssigningSucursal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    provincia: "",
    telefono: "",
  });

  // Filtrar sucursales
  const sucursalesFiltradas = sucursales.filter(
    (sucursal) =>
      sucursal.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      sucursal.direccion.toLowerCase().includes(filtro.toLowerCase()) ||
      sucursal.provincia.toLowerCase().includes(filtro.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      nombre: "",
      direccion: "",
      provincia: "",
      telefono: "",
    });
    setEditingSucursal(null);
  };

  const handleOpenDialog = (sucursal = null) => {
    if (sucursal) {
      setEditingSucursal(sucursal);
      setFormData({
        nombre: sucursal.nombre,
        direccion: sucursal.direccion,
        provincia: sucursal.provincia,
        telefono: sucursal.telefono || "",
      });
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (editingSucursal) {
        result = await actualizarSucursal(editingSucursal.id, formData);
      } else {
        result = await crearSucursal(formData);
      }

      if (result.success) {
        toast.success(result.message);
        if (editingSucursal) {
          setSucursales((prev) =>
            prev.map((s) => (s.id === editingSucursal.id ? result.data : s))
          );
        } else {
          setSucursales((prev) => [...prev, result.data]);
        }

        handleCloseDialog();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSucursal) return;
    setLoading(true);

    try {
      const result = await eliminarSucursal(deletingSucursal.id);
      if (result.success) {
        toast.success(result.message);
        setSucursales((prev) =>
          prev.filter((s) => s.id !== deletingSucursal.id)
        );
        setShowDeleteDialog(false);
        setDeletingSucursal(null);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al eliminar la sucursal");
    } finally {
      setLoading(false);
    }
  };

  const getAdministrador = (sucursal) => {
    return sucursal.usuarios.find((u) => u.role === "ADMIN_SUCURSAL");
  };

  return (
    <div className="space-y-6">
      {/* Filtros y Acciones */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Sucursales</CardTitle>
          <CardDescription>
            Administra las sucursales y sus responsables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar sucursales..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Sucursal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Sucursales */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sucursal</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Administrador</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead>Envíos (Mes)</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sucursalesFiltradas.map((sucursal) => {
                const administrador = getAdministrador(sucursal);
                return (
                  <TableRow key={sucursal.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium">{sucursal.nombre}</div>
                          {sucursal.telefono && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {sucursal.telefono}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <div className="text-sm">{sucursal.direccion}</div>
                          <div className="text-xs text-muted-foreground">
                            {sucursal.provincia}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {administrador ? (
                        <div>
                          <div className="font-medium">
                            {administrador.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {administrador.email}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-orange-600">
                          Sin asignar
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{sucursal._count.usuarios}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Origen: {sucursal._count.enviosOrigen}</div>
                        <div className="text-muted-foreground">
                          Destino: {sucursal._count.enviosDestino}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!administrador && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAssigningSucursal(sucursal);
                              setShowAssignDialog(true);
                            }}
                          >
                            <UserPlus className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(sucursal)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeletingSucursal(sucursal);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Dialog Crear/Editar Sucursal */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSucursal ? "Editar Sucursal" : "Nueva Sucursal"}
            </DialogTitle>
            <DialogDescription>
              {editingSucursal
                ? "Modifica los datos de la sucursal"
                : "Completa los datos para crear una nueva sucursal"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Sucursal *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                placeholder="Ej: Sucursal Lima Centro"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección *</Label>
              <Textarea
                id="direccion"
                value={formData.direccion}
                onChange={(e) =>
                  setFormData({ ...formData, direccion: e.target.value })
                }
                placeholder="Dirección completa de la sucursal"
                rows={2}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia *</Label>
              <Input
                id="provincia"
                value={formData.provincia}
                onChange={(e) =>
                  setFormData({ ...formData, provincia: e.target.value })
                }
                placeholder="Ej: Lima"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
                placeholder="Ej: 01-234-5678"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingSucursal ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar Sucursal */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Sucursal</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la sucursal
              <strong>{deletingSucursal?.nombre}</strong>?
              <br />
              <br />
              Esta acción no se puede deshacer. La sucursal no debe tener
              usuarios ni envíos activos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingSucursal(null);
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Asignar Administrador */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Administrador</DialogTitle>
            <DialogDescription>
              Selecciona un usuario para ser administrador de
              <strong>{assigningSucursal?.nombre}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Esta funcionalidad se implementará en la siguiente fase. Por
              ahora, puedes asignar administradores desde el módulo de usuarios.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignDialog(false);
                setAssigningSucursal(null);
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
