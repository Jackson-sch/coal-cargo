"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar";
import { toast } from "sonner";
import { updatePerfil, cambiarPassword } from "@/lib/actions/perfil";
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Calendar,
  Edit3,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
  BarChart3,
} from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";
export default function PerfilPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  }); // Estados para edición de perfi l
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  }); // Estados para cambio de contraseñ a
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  }); // Cargar datos del usuari o
  useEffect(() => {
    if (session?.user) {
      setProfileData({
        name: session.user.name || "",
        email: session.user.email || "",
        phone: session.user.phone || "",
      });
    }
  }, [session]); // Función para actualizar perfi l
  const handleUpdateProfile = async () => {
    if (!profileData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (!profileData.email.trim()) {
      toast.error("El email es requerido");
      return;
    }

    setLoading(true);
    try {
      const result = await updatePerfil({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
      });
      if (!result.success) {
        throw new Error(result.error || "Error al actualizar perfil");
      }

      // Actualizar la sesió n
      await update({
        ...session,
        user: {
          ...session.user,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
        },
      });
      toast.success("Perfil actualizado correctamente");
      setEditingProfile(false);
    } catch (error) {
      toast.error(error.message || "Error al actualizar perfil");
    } finally {
      setLoading(false);
    }
  }; // Función para cambiar contraseñ a
  const handleChangePassword = async () => {
    if (!passwordData.currentPassword) {
      toast.error("Ingresa tu contraseña actual");
      return;
    }

    if (!passwordData.newPassword) {
      toast.error("Ingresa la nueva contraseña");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const result = await cambiarPassword({
        passwordActual: passwordData.currentPassword,
        passwordNuevo: passwordData.newPassword,
        confirmarPassword: passwordData.confirmPassword,
      });
      if (!result.success) {
        throw new Error(result.error || "Error al cambiar contraseña");
      }

      toast.success("Contraseña cambiada correctamente");
      setChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.message || "Error al cambiar contraseña");
    } finally {
      setLoading(false);
    }
  };
  const getRoleLabel = (role) => {
    const roles = {
      SUPER_ADMIN: "Super Administrador",
      ADMIN_SUCURSAL: "Administrador de Sucursal",
      OPERADOR: "Operador",
      CONDUCTOR: "Conductor",
      CLIENTE: "Cliente",
      CONTADOR: "Contador",
    };
    return roles[role] || role;
  };
  const getRoleColor = (role) => {
    const colors = {
      SUPER_ADMIN: "bg-red-100 text-red-800",
      ADMIN_SUCURSAL: "bg-blue-100 text-blue-800",
      OPERADOR: "bg-green-100 text-green-800",
      CONDUCTOR: "bg-yellow-100 text-yellow-800",
      CLIENTE: "bg-purple-100 text-purple-800",
      CONTADOR: "bg-orange-100 text-orange-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
          Mi Perfil
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Gestiona tu información personal, configuración de cuenta y
          preferencias del sistema
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Usuario */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                    {session.user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">{session.user.name}</CardTitle>
              <CardDescription>{session.user.email}</CardDescription>
              <div className="flex justify-center mt-3">
                <Badge className={getRoleColor(session.user.role)}>
                  {getRoleLabel(session.user.role)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" /> <span>{session.user.email}</span>
              </div>
              {session.user.phone && (
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{session.user.phone}</span>
                </div>
              )}
              {session.user.sucursalNombre && (
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{session.user.sucursalNombre}</span>
                </div>
              )}
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>{getRoleLabel(session.user.role)}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Miembro desde
                  {formatDate(session.user.createdAt || Date.now())}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Formularios de Edición */}
        <div className="lg:col-span-2 space-y-6">
          {/* Editar Información Personal */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Información Personal</span>
                  </CardTitle>
                  <CardDescription>
                    Actualiza tu información personal y de contacto
                  </CardDescription>
                </div>
                {!editingProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProfile(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" /> Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    disabled={!editingProfile}
                    placeholder="Ej: Juan Pérez García"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    disabled={!editingProfile}
                    placeholder="Ej: juan.perez@email.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  disabled={!editingProfile}
                  placeholder="Ej: +51 999 123 456"
                />
              </div>
              {editingProfile && (
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileData({
                        name: session.user.name || "",
                        email: session.user.email || "",
                        phone: session.user.phone || "",
                      });
                    }}
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" /> Cancelar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Cambiar Contraseña */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="h-5 w-5" /> <span>Seguridad</span>
                  </CardTitle>
                  <CardDescription>
                    Cambia tu contraseña para mantener tu cuenta segura
                  </CardDescription>
                </div>
                {!changingPassword && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setChangingPassword(true)}
                  >
                    <Lock className="h-4 w-4 mr-2" /> Cambiar Contraseña
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {changingPassword ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Contraseña actual</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            currentPassword: e.target.value,
                          }))
                        }
                        placeholder="Ingresa tu contraseña actual"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            current: !prev.current,
                          }))
                        }
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nueva contraseña</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData((prev) => ({
                              ...prev,
                              newPassword: e.target.value,
                            }))
                          }
                          placeholder="Mínimo 8 caracteres"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              new: !prev.new,
                            }))
                          }
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirmar contraseña
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                            }))
                          }
                          placeholder="Repite la nueva contraseña"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              confirm: !prev.confirm,
                            }))
                          }
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button
                      onClick={handleChangePassword}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? "Cambiando..." : "Cambiar Contraseña"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setChangingPassword(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                      disabled={loading}
                    >
                      <X className="h-4 w-4 mr-2" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    No hay estadísticas disponibles aún. Realiza algunas
                    cotizaciones para ver tus métricas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
