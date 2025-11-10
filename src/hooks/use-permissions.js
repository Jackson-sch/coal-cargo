"use client";

import { useSession } from "next-auth/react";
import { tienePermiso } from "@/lib/permissions";

/**
 * Hook para verificar permisos del usuario actual
 * @returns {Object} Objeto con funciones para verificar permisos
 */
export function usePermissions() {
  const { data: session } = useSession();

  /**
   * Verificar si el usuario tiene un permiso específico
   * @param {string} permiso - Código del permiso (ej: "vehiculos.delete")
   * @returns {boolean}
   */
  const hasPermission = (permiso) => {
    if (!session?.user) return false;
    return tienePermiso(session.user, permiso);
  };

  /**
   * Verificar si el usuario tiene uno de los roles especificados
   * @param {string|string[]} roles - Rol o array de roles permitidos
   * @returns {boolean}
   */
  const hasRole = (roles) => {
    if (!session?.user) return false;
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes(session.user.role);
  };

  /**
   * Verificar si el usuario es SUPER_ADMIN
   * @returns {boolean}
   */
  const isSuperAdmin = () => {
    return hasRole("SUPER_ADMIN");
  };

  /**
   * Verificar si el usuario es ADMIN_SUCURSAL
   * @returns {boolean}
   */
  const isAdminSucursal = () => {
    return hasRole("ADMIN_SUCURSAL");
  };

  /**
   * Verificar si el usuario puede gestionar una sucursal específica
   * @param {string} sucursalId - ID de la sucursal
   * @returns {boolean}
   */
  const canManageSucursal = (sucursalId) => {
    if (!session?.user) return false;
    if (isSuperAdmin()) return true;
    if (isAdminSucursal() && session.user.sucursalId === sucursalId) return true;
    return false;
  };

  /**
   * Verificar si el usuario puede eliminar un registro
   * @param {string} modulo - Módulo (ej: "vehiculos", "rutas", "sucursales")
   * @returns {boolean}
   */
  const canDelete = (modulo) => {
    if (!session?.user) return false;
    if (isSuperAdmin()) return true;
    
    // ADMIN_SUCURSAL no puede eliminar permanentemente (solo soft delete/desactivar)
    if (isAdminSucursal()) {
      // Puede "eliminar" (desactivar) vehículos y rutas de su sucursal
      if (modulo === "vehiculos" || modulo === "rutas") {
        return true; // Soft delete permitido
      }
      // No puede eliminar sucursales ni configuraciones
      return false;
    }
    
    return false;
  };

  /**
   * Verificar si el usuario puede editar un registro
   * @param {string} modulo - Módulo (ej: "vehiculos", "rutas", "sucursales")
   * @param {Object} registro - Registro a editar (debe tener sucursalId si aplica)
   * @returns {boolean}
   */
  const canEdit = (modulo, registro = null) => {
    if (!session?.user) return false;
    if (isSuperAdmin()) return true;
    
    if (isAdminSucursal()) {
      // Verificar si el registro pertenece a su sucursal
      if (registro?.sucursalId) {
        return session.user.sucursalId === registro.sucursalId;
      }
      
      // Para rutas, verificar si involucra su sucursal
      if (modulo === "rutas" && registro) {
        return (
          registro.sucursalOrigenId === session.user.sucursalId ||
          registro.sucursalDestinoId === session.user.sucursalId
        );
      }
      
      // Por defecto, permitir edición si es ADMIN_SUCURSAL
      return true;
    }
    
    return false;
  };

  /**
   * Verificar si el usuario puede crear registros en un módulo
   * @param {string} modulo - Módulo (ej: "vehiculos", "rutas", "sucursales")
   * @returns {boolean}
   */
  const canCreate = (modulo) => {
    if (!session?.user) return false;
    if (isSuperAdmin()) return true;
    
    if (isAdminSucursal()) {
      // ADMIN_SUCURSAL puede crear vehículos y rutas
      if (modulo === "vehiculos" || modulo === "rutas") {
        return true;
      }
      // No puede crear sucursales
      if (modulo === "sucursales") {
        return false;
      }
      // Por defecto, permitir creación
      return true;
    }
    
    return false;
  };

  return {
    hasPermission,
    hasRole,
    isSuperAdmin,
    isAdminSucursal,
    canManageSucursal,
    canDelete,
    canEdit,
    canCreate,
    user: session?.user,
    isLoading: !session,
  };
}

