"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// Función auxiliar para verificar permisos
async function checkPermissions() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado");
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

// Obtener perfil del usuario actual
export async function getPerfil() {
  try {
    const user = await checkPermissions();

    const perfil = await prisma.usuarios.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        telefono: true,
        direccion: true,
        fechaNacimiento: true,
        avatar: true,
        sucursalId: true,
        createdAt: true,
        updatedAt: true,
        sucursal: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            provincia: true,
          },
        },
      },
    });

    if (!perfil) {
      return {
        success: false,
        error: "Usuario no encontrado",
      };
    }

    return {
      success: true,
      data: perfil,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Actualizar perfil del usuario
export async function updatePerfil(formData) {
  try {
    const user = await checkPermissions();

    const { name, telefono, direccion, fechaNacimiento, avatar } = formData;

    // Validaciones básicas
    if (!name || name.trim().length < 2) {
      return {
        success: false,
        error: "El nombre debe tener al menos 2 caracteres",
      };
    }

    if (telefono && telefono.length < 9) {
      return {
        success: false,
        error: "El teléfono debe tener al menos 9 dígitos",
      };
    }

    const usuario = await prisma.usuarios.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        telefono: telefono?.trim() || null,
        direccion: direccion?.trim() || null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        avatar: avatar || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        telefono: true,
        direccion: true,
        fechaNacimiento: true,
        avatar: true,
        sucursalId: true,
        sucursal: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            provincia: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/perfil");

    return {
      success: true,
      data: usuario,
      message: "Perfil actualizado correctamente",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Cambiar contraseña
export async function cambiarPassword(formData) {
  try {
    const user = await checkPermissions();

    const { currentPassword, newPassword, confirmPassword } = formData;

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      return {
        success: false,
        error: "Todos los campos son requeridos",
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        success: false,
        error: "Las contraseñas no coinciden",
      };
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        error: "La nueva contraseña debe tener al menos 6 caracteres",
      };
    }

    // Obtener usuario con contraseña
    const usuario = await prisma.usuarios.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        password: true,
      },
    });

    if (!usuario) {
      return {
        success: false,
        error: "Usuario no encontrado",
      };
    }

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      usuario.password
    );

    if (!isValidPassword) {
      return {
        success: false,
        error: "La contraseña actual es incorrecta",
      };
    }

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await prisma.usuarios.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    return {
      success: true,
      message: "Contraseña actualizada correctamente",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Obtener estadísticas del usuario
export async function getEstadisticasUsuario() {
  try {
    const user = await checkPermissions();

    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 30); // Últimos 30 días

    const whereClause = {
      createdAt: {
        gte: fechaInicio,
      },
    };

    // Si no es SUPER_ADMIN, filtrar por sucursal
    if (user.role !== "SUPER_ADMIN" && user.sucursalId) {
      whereClause.OR = [
        { origenId: user.sucursalId },
        { destinoId: user.sucursalId },
      ];
    }

    const [totalEnvios, enviosPendientes, enviosEntregados, enviosEnTransito] =
      await Promise.all([
        prisma.envios.count({
          where: whereClause,
        }),
        prisma.envios.count({
          where: {
            ...whereClause,
            estado: "REGISTRADO",
          },
        }),
        prisma.envios.count({
          where: {
            ...whereClause,
            estado: "ENTREGADO",
          },
        }),
        prisma.envios.count({
          where: {
            ...whereClause,
            estado: {
              in: ["EN_TRANSITO", "EN_AGENCIA_DESTINO", "EN_REPARTO"],
            },
          },
        }),
      ]);

    return {
      success: true,
      data: {
        totalEnvios,
        enviosPendientes,
        enviosEntregados,
        enviosEnTransito,
        periodo: "Últimos 30 días",
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Obtener actividad reciente del usuario
export async function getActividadReciente(limit = 10) {
  try {
    const user = await checkPermissions();

    const whereClause = {};

    // Si no es SUPER_ADMIN, filtrar por sucursal
    if (user.role !== "SUPER_ADMIN" && user.sucursalId) {
      whereClause.OR = [
        { origenId: user.sucursalId },
        { destinoId: user.sucursalId },
      ];
    }

    const enviosRecientes = await prisma.envios.findMany({
      where: whereClause,
      select: {
        id: true,
        guia: true,
        estado: true,
        destinatarioNombre: true,
        total: true,
        createdAt: true,
        sucursalOrigen: {
          select: {
            nombre: true,
          },
        },
        sucursalDestino: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return {
      success: true,
      data: enviosRecientes,
    };
  } catch (error) {
    return handleActionError(error);
  }
}
