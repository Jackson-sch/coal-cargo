"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Función auxiliar para verificar permisos de SUPER_ADMIN
async function checkSuperAdminPermissions() {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    throw new Error("Solo los SUPER_ADMIN pueden gestionar sucursales");
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

/**
 * Obtener sucursales con estadísticas
 */
export async function getSucursalesConEstadisticas() {
  try {
    await checkSuperAdminPermissions();

    const sucursales = await prisma.sucursales.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        usuarios: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            usuarios: {
              where: {
                deletedAt: null,
              },
            },
            enviosOrigen: {
              where: {
                createdAt: {
                  gte: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1
                  ),
                },
              },
            },
            enviosDestino: {
              where: {
                createdAt: {
                  gte: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1
                  ),
                },
              },
            },
          },
        },
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

/**
 * Crear nueva sucursal
 */
export async function crearSucursal(data) {
  try {
    await checkSuperAdminPermissions();

    const { nombre, direccion, provincia, telefono } = data;

    // Validaciones
    if (!nombre?.trim()) {
      throw new Error("El nombre de la sucursal es requerido");
    }

    if (!direccion?.trim()) {
      throw new Error("La dirección es requerida");
    }

    if (!provincia?.trim()) {
      throw new Error("La provincia es requerida");
    }

    // Verificar que no exista una sucursal con el mismo nombre
    const sucursalExistente = await prisma.sucursales.findFirst({
      where: {
        nombre: nombre.trim(),
        deletedAt: null,
      },
    });

    if (sucursalExistente) {
      throw new Error("Ya existe una sucursal con ese nombre");
    }

    // Crear sucursal
    const nuevaSucursal = await prisma.sucursales.create({
      data: {
        id: `sucursal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        provincia: provincia.trim(),
        telefono: telefono?.trim() || null,
      },
      include: {
        usuarios: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            usuarios: true,
            enviosOrigen: true,
            enviosDestino: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/administracion/sucursales");

    return {
      success: true,
      data: nuevaSucursal,
      message: "Sucursal creada exitosamente",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Actualizar sucursal
 */
export async function actualizarSucursal(id, data) {
  try {
    await checkSuperAdminPermissions();

    const { nombre, direccion, provincia, telefono } = data;

    if (!id) {
      throw new Error("ID de sucursal requerido");
    }

    // Validaciones
    if (!nombre?.trim()) {
      throw new Error("El nombre de la sucursal es requerido");
    }

    if (!direccion?.trim()) {
      throw new Error("La dirección es requerida");
    }

    if (!provincia?.trim()) {
      throw new Error("La provincia es requerida");
    }

    // Verificar que la sucursal existe
    const sucursalExistente = await prisma.sucursales.findUnique({
      where: { id },
    });

    if (!sucursalExistente || sucursalExistente.deletedAt) {
      throw new Error("Sucursal no encontrada");
    }

    // Verificar que no exista otra sucursal con el mismo nombre
    const otraSucursal = await prisma.sucursales.findFirst({
      where: {
        nombre: nombre.trim(),
        id: { not: id },
        deletedAt: null,
      },
    });

    if (otraSucursal) {
      throw new Error("Ya existe otra sucursal con ese nombre");
    }

    // Actualizar sucursal
    const sucursalActualizada = await prisma.sucursales.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        provincia: provincia.trim(),
        telefono: telefono?.trim() || null,
      },
      include: {
        usuarios: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            usuarios: true,
            enviosOrigen: true,
            enviosDestino: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/administracion/sucursales");

    return {
      success: true,
      data: sucursalActualizada,
      message: "Sucursal actualizada exitosamente",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Eliminar sucursal (soft delete)
 */
export async function eliminarSucursal(id) {
  try {
    await checkSuperAdminPermissions();

    if (!id) {
      throw new Error("ID de sucursal requerido");
    }

    // Verificar que la sucursal existe
    const sucursal = await prisma.sucursales.findUnique({
      where: { id },
      include: {
        usuarios: {
          where: {
            deletedAt: null,
          },
        },
        enviosOrigen: {
          where: {
            estado: {
              in: ["REGISTRADO", "EN_BODEGA", "EN_TRANSITO", "EN_REPARTO"],
            },
          },
        },
        enviosDestino: {
          where: {
            estado: {
              in: ["REGISTRADO", "EN_BODEGA", "EN_TRANSITO", "EN_REPARTO"],
            },
          },
        },
      },
    });

    if (!sucursal || sucursal.deletedAt) {
      throw new Error("Sucursal no encontrada");
    }

    // Verificar que no tenga usuarios activos
    if (sucursal.usuarios.length > 0) {
      throw new Error(
        `No se puede eliminar la sucursal. Tiene ${sucursal.usuarios.length} usuario(s) asignado(s)`
      );
    }

    // Verificar que no tenga envíos activos
    const enviosActivos =
      sucursal.enviosOrigen.length + sucursal.enviosDestino.length;
    if (enviosActivos > 0) {
      throw new Error(
        `No se puede eliminar la sucursal. Tiene ${enviosActivos} envío(s) activo(s)`
      );
    }

    // Eliminar sucursal (soft delete)
    await prisma.sucursales.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/administracion/sucursales");

    return {
      success: true,
      message: "Sucursal eliminada exitosamente",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Asignar administrador a sucursal
 */
export async function asignarAdministradorSucursal(sucursalId, usuarioId) {
  try {
    await checkSuperAdminPermissions();

    if (!sucursalId || !usuarioId) {
      throw new Error("ID de sucursal y usuario requeridos");
    }

    // Verificar que la sucursal existe
    const sucursal = await prisma.sucursales.findUnique({
      where: { id: sucursalId },
    });

    if (!sucursal || sucursal.deletedAt) {
      throw new Error("Sucursal no encontrada");
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuarios.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario || usuario.deletedAt) {
      throw new Error("Usuario no encontrado");
    }

    // Actualizar usuario
    const usuarioActualizado = await prisma.usuarios.update({
      where: { id: usuarioId },
      data: {
        sucursalId: sucursalId,
        role: "ADMIN_SUCURSAL",
      },
    });

    revalidatePath("/dashboard/administracion/sucursales");
    revalidatePath("/dashboard/configuracion/usuarios");

    return {
      success: true,
      data: usuarioActualizado,
      message: "Administrador asignado exitosamente",
    };
  } catch (error) {
    return handleActionError(error);
  }
}
