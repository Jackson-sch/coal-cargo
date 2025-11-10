"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { AuditLogger } from "@/lib/utils/audit-logger";
import bcrypt from "bcryptjs";

// Función auxiliar para verificar permisos
async function checkPermissions(requiredRoles = []) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(session.user.role)) {
    throw new Error("Permisos insuficientes");
  }

  return session.user;
}

// Función auxiliar para manejar errores
function handleActionError(error) {
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: false,
    error: "Error interno del servidor",
  };
}

// Obtener todos los usuarios con filtros
export async function getUsuarios(searchParams = {}) {
  try {
    const session = await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    const { estado, role, sucursalId, q } = searchParams || {};

    const where = {};

    // Manejar el filtro de estado correctamente con soft delete
    if (estado !== undefined) {
      if (estado === "all") {
        // Mostrar todos los usuarios no eliminados
        where.deletedAt = null;
      } else if (estado === "active") {
        where.deletedAt = null;
      } else if (estado === "deleted") {
        where.deletedAt = { not: null }; // Solo eliminados
      }
    } else {
      // Por defecto, mostrar solo usuarios activos
      where.deletedAt = null;
    }

    // Filtro por rol
    if (role && role !== "TODOS") {
      where.role = role;
    }

    // Filtro por sucursal
    if (sucursalId && sucursalId !== "TODAS") {
      where.sucursalId = sucursalId;
    } else if (session.role === "ADMIN_SUCURSAL" && session.sucursalId) {
      // ADMIN_SUCURSAL solo ve usuarios de su sucursal
      where.sucursalId = session.sucursalId;
    }

    // Filtro de búsqueda
    if (q) {
      const searchConditions = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const usuarios = await prisma.usuarios.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        sucursalId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        sucursales: {
          select: {
            id: true,
            nombre: true,
            provincia: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: usuarios,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Crear nuevo usuario
export async function createUsuario(data) {
  try {
    const session = await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    const { name, email, password, role, telefono, sucursalId } = data;

    // Validaciones básicas
    if (!name || !email || !password || !role) {
      return {
        success: false,
        error: "Nombre, email, contraseña y rol son requeridos",
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: "La contraseña debe tener al menos 6 caracteres",
      };
    }

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar que el email no esté en uso (usuario activo)
    const existingUser = await prisma.usuarios.findFirst({
      where: {
        email: normalizedEmail,
        deletedAt: null,
      },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Ya existe un usuario activo con este email",
      };
    }

    // Verificar si existe un usuario eliminado con este email (para sugerir restauración)
    const deletedUser = await prisma.usuarios.findFirst({
      where: {
        email: normalizedEmail,
        deletedAt: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        deletedAt: true,
      },
    });

    if (deletedUser) {
      const fechaEliminacion = deletedUser.deletedAt
        ? new Date(deletedUser.deletedAt).toLocaleDateString("es-PE")
        : "fecha desconocida";

      return {
        success: false,
        error: `Ya existe un usuario eliminado con este email (${deletedUser.name}, eliminado el ${fechaEliminacion}). Puedes restaurarlo desde la sección de usuarios eliminados.`,
        usuarioEliminadoId: deletedUser.id,
      };
    }

    // Validar jerarquía de roles
    if (session.role === "ADMIN_SUCURSAL") {
      // ADMIN_SUCURSAL solo puede crear OPERADOR y CONDUCTOR
      if (!["OPERADOR", "CONDUCTOR"].includes(role)) {
        return {
          success: false,
          error: "No tienes permisos para crear usuarios con este rol",
        };
      }

      // ADMIN_SUCURSAL solo puede asignar usuarios a su sucursal
      if (sucursalId && sucursalId !== session.sucursalId) {
        return {
          success: false,
          error: "Solo puedes asignar usuarios a tu sucursal",
        };
      }
    }

    // Verificar que la sucursal existe si se proporciona
    if (sucursalId) {
      const sucursal = await prisma.sucursales.findUnique({
        where: { id: sucursalId },
      });

      if (!sucursal) {
        return {
          success: false,
          error: "Sucursal no encontrada",
        };
      }
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const usuario = await prisma.usuarios.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
        phone: telefono?.trim() || null,
        sucursalId: sucursalId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        sucursalId: true,
        createdAt: true,
        sucursales: {
          select: {
            id: true,
            nombre: true,
            provincia: true,
          },
        },
      },
    });

    // Log de auditoría
    await AuditLogger.logUserAction("CREAR_USUARIO", usuario.id, {
      nombre: usuario.name,
      email: usuario.email,
      rol: usuario.role,
    });

    revalidatePath("/dashboard/configuracion/usuarios");

    return {
      success: true,
      data: usuario,
      message: "Usuario creado correctamente",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Actualizar usuario
export async function updateUsuario(id, data) {
  try {
    const session = await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    const { name, email, role, telefono, sucursalId, password } = data;

    // Verificar que el usuario existe
    const existingUser = await prisma.usuarios.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return {
        success: false,
        error: "Usuario no encontrado",
      };
    }

    // Validar jerarquía de roles
    if (session.role === "ADMIN_SUCURSAL") {
      // ADMIN_SUCURSAL solo puede editar usuarios de su sucursal
      if (existingUser.sucursalId !== session.sucursalId) {
        return {
          success: false,
          error: "Solo puedes editar usuarios de tu sucursal",
        };
      }

      // ADMIN_SUCURSAL no puede cambiar roles a SUPER_ADMIN o ADMIN_SUCURSAL
      if (role && !["OPERADOR", "CONDUCTOR"].includes(role)) {
        return {
          success: false,
          error: "No tienes permisos para asignar este rol",
        };
      }
    }

    // Verificar email único si se está cambiando
    if (email && email !== existingUser.email) {
      const normalizedEmail = email.toLowerCase().trim();

      const emailExists = await prisma.usuarios.findFirst({
        where: {
          email: normalizedEmail,
          deletedAt: null,
          NOT: { id },
        },
      });

      if (emailExists) {
        return {
          success: false,
          error: "Ya existe otro usuario activo con este email",
        };
      }

      // Verificar si existe un usuario eliminado con este email
      const deletedUserWithEmail = await prisma.usuarios.findFirst({
        where: {
          email: normalizedEmail,
          deletedAt: { not: null },
          NOT: { id },
        },
        select: {
          id: true,
          name: true,
          deletedAt: true,
        },
      });

      if (deletedUserWithEmail) {
        const fechaEliminacion = deletedUserWithEmail.deletedAt
          ? new Date(deletedUserWithEmail.deletedAt).toLocaleDateString("es-PE")
          : "fecha desconocida";

        return {
          success: false,
          error: `Ya existe un usuario eliminado con este email (${deletedUserWithEmail.name}, eliminado el ${fechaEliminacion}). Puedes restaurarlo desde la sección de usuarios eliminados.`,
          usuarioEliminadoId: deletedUserWithEmail.id,
        };
      }
    }

    // Verificar sucursal si se está cambiando
    if (sucursalId && sucursalId !== existingUser.sucursalId) {
      const sucursal = await prisma.sucursales.findUnique({
        where: { id: sucursalId },
      });

      if (!sucursal) {
        return {
          success: false,
          error: "Sucursal no encontrada",
        };
      }
    }

    // Preparar datos de actualización
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (role) updateData.role = role;
    if (telefono !== undefined) updateData.phone = telefono?.trim() || null;
    if (sucursalId !== undefined) updateData.sucursalId = sucursalId || null;

    // Encriptar nueva contraseña si se proporciona
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Actualizar usuario
    const usuario = await prisma.usuarios.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        sucursalId: true,
        updatedAt: true,
        sucursales: {
          select: {
            id: true,
            nombre: true,
            provincia: true,
          },
        },
      },
    });

    // Log de auditoría
    await AuditLogger.logUserAction("ACTUALIZAR_USUARIO", usuario.id, {
      cambios: Object.keys(updateData),
    });

    revalidatePath("/dashboard/configuracion/usuarios");

    return {
      success: true,
      data: usuario,
      message: "Usuario actualizado correctamente",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Eliminar usuario (soft delete)
export async function deleteUsuario(id) {
  try {
    const session = await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    // Verificar que el usuario existe y no está ya eliminado
    const existingUser = await prisma.usuarios.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return {
        success: false,
        error: "Usuario no encontrado",
      };
    }

    // Si ya está eliminado, no hacer nada
    if (existingUser.deletedAt) {
      return {
        success: false,
        error: "El usuario ya está eliminado",
      };
    }

    // No permitir eliminar el propio usuario
    if (existingUser.id === session.id) {
      return {
        success: false,
        error: "No puedes eliminar tu propio usuario",
      };
    }

    // Validar jerarquía de roles
    if (session.role === "ADMIN_SUCURSAL") {
      // ADMIN_SUCURSAL solo puede eliminar usuarios de su sucursal
      if (existingUser.sucursalId !== session.sucursalId) {
        return {
          success: false,
          error: "Solo puedes eliminar usuarios de tu sucursal",
        };
      }

      // ADMIN_SUCURSAL no puede eliminar otros ADMIN_SUCURSAL o SUPER_ADMIN
      if (["SUPER_ADMIN", "ADMIN_SUCURSAL"].includes(existingUser.role)) {
        return {
          success: false,
          error: "No tienes permisos para eliminar este usuario",
        };
      }
    }

    // Soft delete
    await prisma.usuarios.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Log de auditoría
    await AuditLogger.logUserAction("ELIMINAR_USUARIO", id, {
      nombre: existingUser.name,
      email: existingUser.email,
    });

    revalidatePath("/dashboard/configuracion/usuarios");

    return {
      success: true,
      message: "Usuario eliminado correctamente",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Obtener sucursales para asignar a usuarios
export async function getSucursales() {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    const sucursales = await prisma.sucursales.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        provincia: true,
      },
      orderBy: {
        nombre: "asc",
      },
    });

    return {
      success: true,
      data: sucursales,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Reactivar usuario eliminado
export async function reactivateUsuario(id) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    // Buscar el usuario sin importar si tiene deletedAt o no
    const existingUser = await prisma.usuarios.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return {
        success: false,
        error: "Usuario no encontrado",
      };
    }

    // Si el usuario no está eliminado, no hacer nada
    if (!existingUser.deletedAt) {
      return {
        success: false,
        error: "El usuario no está eliminado",
      };
    }

    // Reactivar: limpiar deletedAt
    const updatedUser = await prisma.usuarios.update({
      where: { id },
      data: {
        deletedAt: null, // Limpiar el soft delete
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        sucursalId: true,
        createdAt: true,
        deletedAt: true,
        sucursales: {
          select: {
            id: true,
            nombre: true,
            provincia: true,
          },
        },
      },
    });

    // Log de auditoría
    await AuditLogger.logUserAction("RESTAURAR_USUARIO", id, {
      nombre: updatedUser.name,
      email: updatedUser.email,
    });

    revalidatePath("/dashboard/configuracion/usuarios");

    return {
      success: true,
      data: updatedUser,
      message: "Usuario restaurado correctamente",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Obtener roles disponibles
export async function getRolesDisponibles() {
  return {
    success: true,
    data: [
      {
        id: "SUPER_ADMIN",
        nombre: "Super Administrador",
        descripcion: "Acceso completo al sistema",
      },
      {
        id: "ADMIN_SUCURSAL",
        nombre: "Administrador de Sucursal",
        descripcion: "Gestión de sucursal específica",
      },
      {
        id: "OPERADOR",
        nombre: "Operador",
        descripcion: "Operaciones básicas del sistema",
      },
      {
        id: "CONDUCTOR",
        nombre: "Conductor",
        descripcion: "Gestión de envíos y rutas",
      },
      {
        id: "CONTADOR",
        nombre: "Contador",
        descripcion: "Acceso a reportes financieros",
      },
      {
        id: "CLIENTE",
        nombre: "Cliente",
        descripcion: "Acceso limitado para clientes",
      },
    ],
  };
}
