"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache"; // Función auxiliar para verificar permiso s
async function checkAuditoriaPermissions() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  // Solo SUPER_ADMIN y ADMIN_SUCURSAL pueden ver auditorí a
  if (!["SUPER_ADMIN", "ADMIN_SUCURSAL"].includes(session.user.role)) {
    throw new Error("No tienes permisos para acceder a la auditoría");
  }

  return session.user;
}

// Función auxiliar para manejar errore s
function handleActionError(error) {
  if (error instanceof Error) {
    return { success: false, error: error.message };
  }

  return { success: false, error: "Error interno del servidor" };
}

/** * Crear log de auditoría */ export async function crearLogAuditoria({
  accion,
  recurso,
  detalles = null,
  categoria = "SISTEMA",
  severidad = "INFO",
  usuarioId = null,
  ip = null,
  userAgent = null,
}) {
  try {
    const log = await prisma.logs_auditoria.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        accion,
        recurso,
        detalles,
        categoria,
        severidad,
        usuarioId,
        ip,
        userAgent,
        fechaHora: new Date(),
      },
    });
    return { success: true, data: log };
  } catch (error) {
    return { success: false, error: "Error al crear log de auditoría" };
  }
}
/** * Obtener estadísticas de auditoría */ export async function getEstadisticasAuditoria() {
  try {
    const user = await checkAuditoriaPermissions();
    const hoy = new Date();
    const inicioHoy = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate(),
    );
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1); // Filtrar por sucursal si no es SUPER_ADMI N
    const whereClause =
      user.role !== "SUPER_ADMIN" && user.sucursalId
        ? {
            OR: [
              { usuarioId: null }, // Logs del sistem a
              { usuario: { sucursalId: user.sucursalId } },
            ],
          }
        : {};
    const [
      totalLogs,
      logsHoy,
      loginsFallidos,
      actividadSospechosa,
      erroresSistema,
      respaldos,
    ] = await Promise.all([
      // Total de log s
      prisma.logs_auditoria.count({
        where: { ...whereClause, fechaHora: { gte: inicioMes } },
      }), // Logs de ho y
      prisma.logs_auditoria.count({
        where: { ...whereClause, fechaHora: { gte: inicioHoy } },
      }), // Logins fallido s
      prisma.logs_auditoria.count({
        where: {
          ...whereClause,
          accion: "LOGIN_FAILED",
          fechaHora: { gte: inicioHoy },
        },
      }), // Actividad sospechos a
      prisma.logs_auditoria.count({
        where: {
          ...whereClause,
          severidad: "WARNING",
          fechaHora: { gte: inicioHoy },
        },
      }), // Errores del sistem a
      prisma.logs_auditoria.count({
        where: {
          ...whereClause,
          severidad: "ERROR",
          fechaHora: { gte: inicioHoy },
        },
      }), // Respaldo s
      prisma.logs_auditoria.count({
        where: {
          ...whereClause,
          categoria: "BACKUP",
          fechaHora: { gte: inicioMes },
        },
      }),
    ]);
    return {
      success: true,
      data: {
        totalLogs,
        logsHoy,
        loginsFallidos,
        actividadSospechosa,
        erroresSistema,
        respaldos,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
/** * Obtener logs de auditoría con filtros */ export async function getLogsAuditoria({
  page = 1,
  limit = 50,
  buscar = "",
  categoria = "",
  severidad = "",
  usuarioId = "",
  fechaDesde = null,
  fechaHasta = null,
} = {}) {
  try {
    const user = await checkAuditoriaPermissions();
    const skip = (page - 1) * limit; // Construir filtro s
    let whereClause = {}; // Filtrar por sucursal si no es SUPER_ADMI N
    if (user.role !== "SUPER_ADMIN" && user.sucursalId) {
      whereClause.OR = [
        { usuarioId: null }, // Logs del sistem a
        { usuario: { sucursalId: user.sucursalId } },
      ];
    }

    // Filtro de búsqued a
    if (buscar) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { accion: { contains: buscar, mode: "insensitive" } },
        { recurso: { contains: buscar, mode: "insensitive" } },
        { detalles: { contains: buscar, mode: "insensitive" } },
      ];
    }

    // Filtros específico s
    if (categoria && categoria !== "TODAS") {
      whereClause.categoria = categoria;
    }

    if (severidad && severidad !== "TODAS") {
      whereClause.severidad = severidad;
    }

    if (usuarioId && usuarioId !== "TODOS") {
      whereClause.usuarioId = usuarioId;
    }

    // Filtros de fech a
    if (fechaDesde || fechaHasta) {
      whereClause.fechaHora = {};
      if (fechaDesde) {
        whereClause.fechaHora.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        whereClause.fechaHora.lte = new Date(fechaHasta);
      }
    }
    const [logs, total] = await Promise.all([
      prisma.logs_auditoria.findMany({
        where: whereClause,
        include: {
          usuario: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { fechaHora: "desc" },
        skip,
        take: limit,
      }),
      prisma.logs_auditoria.count({ where: whereClause }),
    ]);
    return {
      success: true,
      data: { logs, total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
/** * Obtener usuarios para filtros */ export async function getUsuariosParaFiltros() {
  try {
    const user = await checkAuditoriaPermissions();
    let whereClause = { deletedAt: null }; // Filtrar por sucursal si no es SUPER_ADMI N
    if (user.role !== "SUPER_ADMIN" && user.sucursalId) {
      whereClause.sucursalId = user.sucursalId;
    }

    const usuarios = await prisma.usuarios.findMany({
      where: whereClause,
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
    return { success: true, data: usuarios };
  } catch (error) {
    return handleActionError(error);
  }
}
/** * Exportar logs a CSV */ export async function exportarLogsCSV(
  filtros = {},
) {
  try {
    await checkAuditoriaPermissions();
    const result = await getLogsAuditoria({
      ...filtros,
      limit: 10000, // Exportar hasta 10k registro s
    });
    if (!result.success) {
      throw new Error(result.error);
    }

    // Crear log de auditoría para la exportació n
    await crearLogAuditoria({
      accion: "EXPORT_LOGS",
      recurso: "auditoria",
      detalles: `Exportación de ${result.data.logs.length} logs`,
      categoria: "AUDITORIA",
      severidad: "INFO",
    });
    return { success: true, data: result.data.logs };
  } catch (error) {
    return handleActionError(error);
  }
}
