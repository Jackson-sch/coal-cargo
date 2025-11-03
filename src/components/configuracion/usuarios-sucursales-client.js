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
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Building2,
  UserPlus,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from "@/lib/actions/usuarios";
import { getSucursales } from "@/lib/actions/sucursales";

const ROLES = [
  {
    value: "SUPER_ADMIN",
    label: "Super Administrador",
    description: "Acceso total al sistema",
  },
  {
    value: "ADMIN_SUCURSAL",
    label: "Administrador de Sucursal",
    description: "Gestiona una sucursal específica",
  },
  { value: "OPERADOR", label: "Operador", description: "Operaciones básicas" },
  {
    value: "CONDUCTOR",
    label: "Conductor",
    description: "Gestión de envíos asignados",
  },
  {
    value: "CONTADOR",
    label: "Contador",
    description: "Reportes y facturación",
  },
  { value: "CLIENTE", label: "Cliente", description: "Acceso limitado" },
];

export default function UsuariosSucursalesClient() {
  const { data: session } = useSession();
  const [usuarios, setUsuarios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [filtroRol, setFiltroRol] = useState("TODOS");
  const [filtroSucursal, setFiltroSucursal] = useState("TODAS");
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [deletingUsuario, setDeletingUsuario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    telefono: "",
    sucursalId: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setInitialLoading(true);
      const [usuariosResult, sucursalesResult] = await Promise.all([
        getUsuarios(),
        getSucursales(),
      ]);

      if (usuariosResult.success) {
        setUsuarios(usuariosResult.data);
      }

      if (sucursalesResult.success) {
        setSucursales(sucursalesResult.data);
      }
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleOpenDialog = (usuario = null) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setFormData({
        name: usuario.name || "",
        email: usuario.email || "",
        password: "",
        role: usuario.role || "",
        telefono: usuario.phone || "",
        sucursalId: usuario.sucursalId || "",
      });
    } else {
      setEditingUsuario(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
        telefono: "",
        sucursalId: "",
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingUsuario(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "",
      telefono: "",
      sucursalId: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (editingUsuario) {
        result = await updateUsuario(editingUsuario.id, formData);
      } else {
        result = await createUsuario(formData);
      }

      if (result.success) {
        toast.success(
          editingUsuario
            ? "Usuario actualizado correctamente"
            : "Usuario creado correctamente"
        );
        handleCloseDialog();
        loadData();
      } else {
        toast.error(result.error || "Error al procesar usuario");
      }
    } catch (error) {
      toast.error("Error al procesar usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUsuario) return;

    setLoading(true);
    try {
      const result = await deleteUsuario(deletingUsuario.id);
      if (result.success) {
        toast.success("Usuario eliminado correctamente");
        setShowDeleteDialog(false);
        setDeletingUsuario(null);
        loadData();
      } else {
        toast.error(result.error || "Error al eliminar usuario");
      }
    } catch (error) {
      toast.error("Error al eliminar usuario");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesFiltro =
      usuario.name?.toLowerCase().includes(filtro.toLowerCase()) ||
      usuario.email?.toLowerCase().includes(filtro.toLowerCase());
    const matchesRol = filtroRol === "TODOS" || usuario.role === filtroRol;
    const matchesSucursal =
      filtroSucursal === "TODAS" || usuario.sucursalId === filtroSucursal;

    return matchesFiltro && matchesRol && matchesSucursal;
  });

  const getRoleLabel = (role) => {
    const roleObj = ROLES.find((r) => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "destructive";
      case "ADMIN_SUCURSAL":
        return "default";
      case "OPERADOR":
        return "secondary";
      case "CONDUCTOR":
        return "outline";
      case "CONTADOR":
        return "secondary";
      case "CLIENTE":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros y Acciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestión de Usuarios
          </CardTitle>
          <CardDescription>
            {session?.user?.role === "SUPER_ADMIN"
              ? "Administra todos los usuarios del sistema"
              : "Administra los usuarios de tu sucursal"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filtroRol} onValueChange={setFiltroRol}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos los roles</SelectItem>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {session?.user?.role === "SUPER_ADMIN" && (
                <Select
                  value={filtroSucursal}
                  onValueChange={setFiltroSucursal}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">Todas las sucursales</SelectItem>
                    {sucursales.map((sucursal) => (
                      <SelectItem key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Usuarios */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{usuario.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {usuario.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(usuario.role)}>
                      {getRoleLabel(usuario.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {usuario.sucursales ? (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{usuario.sucursales.nombre}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {usuario.phone || (
                      <span className="text-muted-foreground">
                        No registrado
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(usuario)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingUsuario(usuario);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para Crear/Editar Usuario */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingUsuario ? "Editar Usuario" : "Crear Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              {editingUsuario
                ? "Modifica los datos del usuario"
                : "Completa los datos para crear un nuevo usuario"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              {!editingUsuario && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Rol
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {role.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sucursal" className="text-right">
                  Sucursal
                </Label>
                <Select
                  value={formData.sucursalId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sucursalId: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar sucursal" />
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingUsuario ? "Actualizando..." : "Creando..."}
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {editingUsuario ? "Actualizar" : "Crear"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmación para Eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar al usuario
              <strong>{deletingUsuario?.name}</strong>? Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingUsuario(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
