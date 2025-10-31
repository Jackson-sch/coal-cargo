"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  PERMISOS_DISPONIBLES,
  getPermisosBaseRol,
} from "@/lib/permissions";

/**
 * Inicializar permisos en la base de datos
 */
export async function inicializarPermisos() {
  try {
    for (const permiso of PERMISOS_DISPONIBLES) {
      await prisma.permisos.upsert({
        where: { codigo: permiso.codigo },
        update: {
          nombre: permiso.nombre,
          descripcion: permiso.descripcion,
          categoria: permiso.categoria,
        },
        create: {
          codigo: permiso.codigo,
          nombre: permiso.nombre,
          descripcion: permiso.descripcion,
          categoria: permiso.categoria,
        },
      });
    }

    return { success: true, message: "Permisos inicializados correctamente" };
  } catch (error) {
    return { success: false, error: "Error al inicializar permisos" };
  }
}

/**
 * Obtener todos los permisos disponibles
 */
export async function getPermisos() {
  try {
    const permisos = await prisma.permisos.findMany({
      where: { activo: true },
      orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    });

    return { success: true, data: permisos };
  } catch (error) {
    return { success: false, error: "Error al obtener permisos" };
  }
}

/**
 * Obtener permisos de un usuario específico
 */
export async function getPermisosUsuario(usuarioId) {
  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { id: usuarioId },
      include: { permisos: { include: { permiso: true } } },
    });

    if (!usuario) {
      return { success: false, error: "Usuario no encontrado" };
    }

    // Obtener permisos base del rol
    const permisosBase = getPermisosBaseRol(usuario.role);

    // Obtener permisos adicionales
    const permisosAdicionales = usuario.permisos.map((up) => ({
      id: up.permiso.id,
      codigo: up.permiso.codigo,
      nombre: up.permiso.nombre,
      categoria: up.permiso.categoria,
      otorgado: up.otorgado,
      esBase: false,
    }));

    // Combinar permisos base con adicionales
    const todosLosPermisos = await prisma.permisos.findMany({
      where: { activo: true },
      orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    });

    const permisosCompletos = todosLosPermisos.map((permiso) => {
      const esBase = permisosBase.includes(permiso.codigo);
      const adicional = permisosAdicionales.find(
        (p) => p.codigo === permiso.codigo
      );

      return {
        id: permiso.id,
        codigo: permiso.codigo,
        nombre: permiso.nombre,
        categoria: permiso.categoria,
        descripcion: permiso.descripcion,
        esBase,
        otorgado: esBase || (adicional ? adicional.otorgado : false),
        puedeModificar: !esBase, // Solo se pueden modificar los que no son base
      };
    });

    return { success: true, data: { usuario, permisos: permisosCompletos } };
  } catch (error) {
    return { success: false, error: "Error al obtener permisos del usuario" };
  }
}

/**
 * Actualizar permisos adicionales de un usuario
 */
export async function actualizarPermisosUsuario(
  usuarioId,
  permisosSeleccionados
) {
  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      return { success: false, error: "Usuario no encontrado" };
    }

    // Obtener permisos base del rol (no se pueden modificar)
    const permisosBase = getPermisosBaseRol(usuario.role);

    // Filtrar solo permisos que no son base
    const permisosModificables = permisosSeleccionados.filter(
      (codigo) => !permisosBase.includes(codigo)
    );

    // Eliminar permisos adicionales existentes
    await prisma.usuario_permisos.deleteMany({ where: { usuarioId } });

    // Crear nuevos permisos adicionales
    if (permisosModificables.length > 0) {
      const permisos = await prisma.permisos.findMany({
        where: { codigo: { in: permisosModificables }, activo: true },
      });

      const permisosData = permisos.map((permiso) => ({
        usuarioId,
        permisoId: permiso.id,
        otorgado: true,
      }));

      await prisma.usuario_permisos.createMany({ data: permisosData });
    }

    revalidatePath("/dashboard/configuracion/usuarios");

    return { success: true, message: "Permisos actualizados correctamente" };
  } catch (error) {
    return { success: false, error: "Error al actualizar permisos" };
  }
}

/**
 * Otorgar permiso específico a un usuario
 */
export async function otorgarPermiso(usuarioId, codigoPermiso) {
  try {
    const permiso = await prisma.permisos.findUnique({
      where: { codigo: codigoPermiso },
    });

    if (!permiso) {
      return { success: false, error: "Permiso no encontrado" };
    }

    await prisma.usuario_permisos.upsert({
      where: { usuarioId_permisoId: { usuarioId, permisoId: permiso.id } },
      update: { otorgado: true },
      create: { usuarioId, permisoId: permiso.id, otorgado: true },
    });

    revalidatePath("/dashboard/configuracion/usuarios");

    return { success: true, message: "Permiso otorgado correctamente" };
  } catch (error) {
    return { success: false, error: "Error al otorgar permiso" };
  }
}

/**
 * Revocar permiso específico de un usuario
 */
export async function revocarPermiso(usuarioId, codigoPermiso) {
  try {
    const permiso = await prisma.permisos.findUnique({
      where: { codigo: codigoPermiso },
    });

    if (!permiso) {
      return { success: false, error: "Permiso no encontrado" };
    }

    await prisma.usuario_permisos.deleteMany({
      where: { usuarioId, permisoId: permiso.id },
    });

    revalidatePath("/dashboard/configuracion/usuarios");

    return { success: true, message: "Permiso revocado correctamente" };
  } catch (error) {
    return { success: false, error: "Error al revocar permiso" };
  }
}
