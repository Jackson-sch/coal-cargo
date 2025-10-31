"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";

const execAsync = promisify(exec);

// Esquemas de validación
const crearRespaldoSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  tipo: z
    .enum(["MANUAL", "AUTOMATICO", "PROGRAMADO", "EMERGENCIA"])
    .default("MANUAL"),
  incluyeArchivos: z.boolean().default(false),
  tablasIncluidas: z.array(z.string()).optional(),
  usuarioId: z.string(),
});

const configuracionRespaldoSchema = z.object({
  respaldosAutomaticos: z.boolean(),
  frecuencia: z.enum([
    "CADA_HORA",
    "CADA_6_HORAS",
    "CADA_12_HORAS",
    "DIARIO",
    "SEMANAL",
    "MENSUAL",
  ]),
  horaEjecucion: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  diasRetencion: z.number().min(1).max(365),
  maxRespaldos: z.number().min(1).max(100),
  almacenamientoLocal: z.boolean(),
  almacenamientoNube: z.boolean(),
  rutaLocal: z.string(),
  encriptarRespaldos: z.boolean(),
  comprimirRespaldos: z.boolean(),
  nivelCompresion: z.number().min(1).max(9),
  notificarExito: z.boolean(),
  notificarError: z.boolean(),
  emailsNotificacion: z.array(z.string().email()).optional(),
  tablasExcluidas: z.array(z.string()).optional(),
});

// ==================== FUNCIONES DE RESPALDO ====================

export async function obtenerEstadisticasRespaldo() {
  try {
    // Obtener estadísticas generales
    const totalRespaldos = await prisma.respaldos.count({
      where: { deletedAt: null },
    });

    const respaldosExitosos = await prisma.respaldos.count({
      where: {
        estado: "COMPLETADO",
        deletedAt: null,
      },
    });

    const respaldosFallidos = await prisma.respaldos.count({
      where: {
        estado: "FALLIDO",
        deletedAt: null,
      },
    });

    // Último respaldo
    const ultimoRespaldo = await prisma.respaldos.findFirst({
      where: { deletedAt: null },
      orderBy: { fechaInicio: "desc" },
      include: {
        usuario: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Próximo respaldo programado (basado en configuración)
    const configuracion = await obtenerConfiguracionRespaldos();
    const proximoRespaldo = calcularProximoRespaldo(configuracion);

    // Estadísticas de almacenamiento
    const estadisticasAlmacenamiento =
      await obtenerEstadisticasAlmacenamiento();

    // Calcular tasa de éxito
    const tasaExito =
      totalRespaldos > 0
        ? Math.round((respaldosExitosos / totalRespaldos) * 100 * 100) / 100
        : 0;

    // Tiempo promedio de respaldo
    const respaldosConDuracion = await prisma.respaldos.findMany({
      where: {
        duracion: { not: null },
        deletedAt: null,
      },
      select: { duracion: true },
    });

    const tiempoPromedio =
      respaldosConDuracion.length > 0
        ? Math.round(
            respaldosConDuracion.reduce(
              (acc, r) => acc + (r.duracion || 0),
              0
            ) / respaldosConDuracion.length
          )
        : 0;

    return {
      success: true,
      data: {
        sistema: {
          estado:
            ultimoRespaldo?.estado === "COMPLETADO"
              ? "healthy"
              : ultimoRespaldo?.estado === "FALLIDO"
              ? "error"
              : "warning",
          tamanoBD: await obtenerTamanoBD(),
          ultimoRespaldo: ultimoRespaldo
            ? {
                fecha: ultimoRespaldo.fechaInicio,
                estado: ultimoRespaldo.estado,
                duracion: ultimoRespaldo.duracion,
              }
            : null,
          proximoRespaldo,
        },
        estadisticas: {
          totalRespaldos,
          respaldosExitosos,
          respaldosFallidos,
          tasaExito,
          tiempoPromedio,
        },
        almacenamiento: estadisticasAlmacenamiento,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener estadísticas de respaldo",
    };
  }
}

export async function obtenerHistorialRespaldos(page = 1, limit = 10) {
  try {
    const offset = (page - 1) * limit;

    const [respaldos, total] = await Promise.all([
      prisma.respaldos.findMany({
        where: { deletedAt: null },
        include: {
          usuario: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { fechaInicio: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.respaldos.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      success: true,
      data: {
        respaldos: respaldos.map((respaldo) => ({
          ...respaldo,
          tamano: respaldo.tamano ? Number(respaldo.tamano) : null,
          tablasIncluidas: respaldo.tablasIncluidas || [],
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener historial de respaldos",
    };
  }
}

export async function crearRespaldo(data) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return {
        success: false,
        error: "No autorizado",
      };
    }

    // Verificar permisos de administrador
    if (!["SUPER_ADMIN", "ADMIN_SUCURSAL"].includes(session.user.role)) {
      return {
        success: false,
        error: "Permisos insuficientes",
      };
    }

    // Add user ID to data
    const dataWithUser = {
      ...data,
      usuarioId: session.user.id,
    };

    const validatedData = crearRespaldoSchema.parse(dataWithUser);

    // Crear registro de respaldo
    const respaldo = await prisma.respaldos.create({
      data: {
        nombre: validatedData.nombre,
        descripcion: validatedData.descripcion,
        tipo: validatedData.tipo,
        estado: "INICIADO",
        fechaInicio: new Date(),
        creadoPor: validatedData.usuarioId,
        incluyeArchivos: validatedData.incluyeArchivos,
        tablasIncluidas: validatedData.tablasIncluidas || [],
        encriptado: true,
        comprimido: true,
        almacenamientoLocal: true,
        almacenamientoNube: false,
      },
    });

    // Ejecutar respaldo en background
    ejecutarRespaldoBackground(respaldo.id);

    revalidatePath("/dashboard/respaldo");

    return {
      success: true,
      data: respaldo,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Error al crear respaldo",
    };
  }
}

export async function restaurarRespaldo(respaldoId, opciones = {}) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return {
        success: false,
        error: "No autorizado",
      };
    }

    // Verificar permisos de administrador
    if (!["SUPER_ADMIN", "ADMIN_SUCURSAL"].includes(session.user.role)) {
      return {
        success: false,
        error: "Permisos insuficientes",
      };
    }

    const respaldo = await prisma.respaldos.findUnique({
      where: { id: respaldoId },
    });

    if (!respaldo) {
      return {
        success: false,
        error: "Respaldo no encontrado",
      };
    }

    if (respaldo.estado !== "COMPLETADO") {
      return {
        success: false,
        error: "Solo se pueden restaurar respaldos completados",
      };
    }

    // Crear registro de restauración
    const restauracion = await prisma.restauraciones.create({
      data: {
        respaldoId,
        estado: "INICIADO",
        fechaInicio: new Date(),
        creadoPor: session.user.id,
        restaurarCompleto: opciones.restaurarCompleto ?? true,
        tablasSeleccionadas: opciones.tablasSeleccionadas || [],
        sobrescribirDatos: opciones.sobrescribirDatos ?? false,
        crearRespaldoAntes: opciones.crearRespaldoAntes ?? true,
      },
    });

    // Ejecutar restauración en background
    ejecutarRestauracionBackground(restauracion.id);

    revalidatePath("/dashboard/respaldo");

    return {
      success: true,
      data: restauracion,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Error al restaurar respaldo",
    };
  }
}

export async function eliminarRespaldo(respaldoId) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return {
        success: false,
        error: "No autorizado",
      };
    }

    // Verificar permisos de administrador
    if (!["SUPER_ADMIN", "ADMIN_SUCURSAL"].includes(session.user.role)) {
      return {
        success: false,
        error: "Permisos insuficientes",
      };
    }

    const respaldo = await prisma.respaldos.findUnique({
      where: { id: respaldoId },
    });

    if (!respaldo) {
      return {
        success: false,
        error: "Respaldo no encontrado",
      };
    }

    // Eliminar archivo físico si existe
    if (respaldo.rutaArchivo) {
      try {
        await fs.unlink(respaldo.rutaArchivo);
      } catch (error) {
        // Ignorar error si el archivo no existe
      }
    }

    // Soft delete del respaldo
    await prisma.respaldos.update({
      where: { id: respaldoId },
      data: {
        deletedAt: new Date(),
        eliminadoEn: new Date(),
      },
    });

    revalidatePath("/dashboard/respaldo");

    return {
      success: true,
      message: "Respaldo eliminado correctamente",
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al eliminar respaldo",
    };
  }
}

// ==================== CONFIGURACIÓN ====================

export async function obtenerConfiguracionRespaldos() {
  try {
    let configuracion = await prisma.configuracion_respaldos.findFirst();

    if (!configuracion) {
      // Crear configuración por defecto
      configuracion = await prisma.configuracion_respaldos.create({
        data: {
          respaldosAutomaticos: true,
          frecuencia: "DIARIO",
          horaEjecucion: "02:00",
          diasRetencion: 30,
          maxRespaldos: 50,
          almacenamientoLocal: true,
          almacenamientoNube: false,
          rutaLocal: "/backups",
          encriptarRespaldos: true,
          comprimirRespaldos: true,
          nivelCompresion: 6,
          notificarExito: true,
          notificarError: true,
          timeoutRespaldo: 3600,
          maxIntentos: 3,
          activo: true,
        },
      });
    }

    return {
      success: true,
      data: {
        ...configuracion,
        emailsNotificacion: configuracion.emailsNotificacion || [],
        tablasExcluidas: configuracion.tablasExcluidas || [],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener configuración",
    };
  }
}

export async function actualizarConfiguracionRespaldos(data) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return {
        success: false,
        error: "No autorizado",
      };
    }

    // Verificar permisos de administrador
    if (!["SUPER_ADMIN", "ADMIN_SUCURSAL"].includes(session.user.role)) {
      return {
        success: false,
        error: "Permisos insuficientes",
      };
    }

    const validatedData = configuracionRespaldoSchema.parse(data);

    let configuracion = await prisma.configuracion_respaldos.findFirst();

    if (configuracion) {
      configuracion = await prisma.configuracion_respaldos.update({
        where: { id: configuracion.id },
        data: validatedData,
      });
    } else {
      configuracion = await prisma.configuracion_respaldos.create({
        data: validatedData,
      });
    }

    revalidatePath("/dashboard/respaldo");

    return {
      success: true,
      data: configuracion,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Error al actualizar configuración",
    };
  }
}

// ==================== FUNCIONES AUXILIARES ====================

async function ejecutarRespaldoBackground(respaldoId) {
  try {
    // Verificar que no estamos en build time
    if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
      throw new Error("Respaldos no disponibles durante el build");
    }

    // Actualizar estado a EN_PROGRESO
    await prisma.respaldos.update({
      where: { id: respaldoId },
      data: {
        estado: "EN_PROGRESO",
        progreso: 10,
      },
    });

    const respaldo = await prisma.respaldos.findUnique({
      where: { id: respaldoId },
    });

    // Generar nombre de archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const nombreArchivo = `backup_${timestamp}.sql`;

    // Usar ruta relativa específica para evitar escaneo del sistema
    const backupsDir = "./backups";
    const rutaArchivo = path.join(backupsDir, nombreArchivo);

    // Asegurar que existe el directorio (solo crear la carpeta backups)
    await fs.mkdir(backupsDir, { recursive: true });

    // Actualizar progreso
    await prisma.respaldos.update({
      where: { id: respaldoId },
      data: { progreso: 30 },
    });

    // Ejecutar pg_dump solo si no estamos en build
    const databaseUrl = process.env.DATABASE_URL;
    const comando = `pg_dump "${databaseUrl}" > "${rutaArchivo}"`;
    await execAsync(comando);

    // Actualizar progreso
    await prisma.respaldos.update({
      where: { id: respaldoId },
      data: { progreso: 70 },
    });

    // Obtener información del archivo
    const stats = await fs.stat(rutaArchivo);
    const tamano = stats.size;

    // Generar checksum
    const contenido = await fs.readFile(rutaArchivo);
    const checksum = crypto
      .createHash("sha256")
      .update(contenido)
      .digest("hex");

    // Actualizar progreso
    await prisma.respaldos.update({
      where: { id: respaldoId },
      data: { progreso: 90 },
    });

    // Finalizar respaldo
    const fechaFinalizacion = new Date();
    const duracion = Math.floor(
      (fechaFinalizacion - respaldo.fechaInicio) / 1000
    );

    await prisma.respaldos.update({
      where: { id: respaldoId },
      data: {
        estado: "COMPLETADO",
        progreso: 100,
        nombreArchivo,
        rutaArchivo,
        tamano: BigInt(tamano),
        checksum,
        fechaFinalizacion,
        duracion,
      },
    });

    // Actualizar estadísticas
    await actualizarEstadisticasRespaldo();
  } catch (error) {
    await prisma.respaldos.update({
      where: { id: respaldoId },
      data: {
        estado: "FALLIDO",
        mensajeError: error.message,
        detalleError: error.stack,
        fechaFinalizacion: new Date(),
      },
    });
  }
}

async function ejecutarRestauracionBackground(restauracionId) {
  try {
    const restauracion = await prisma.restauraciones.findUnique({
      where: { id: restauracionId },
      include: { respaldo: true },
    });

    if (!restauracion) return;

    // Actualizar estado
    await prisma.restauraciones.update({
      where: { id: restauracionId },
      data: {
        estado: "EN_PROGRESO",
        progreso: 10,
      },
    });

    // Crear respaldo previo si está configurado
    if (restauracion.crearRespaldoAntes) {
      await crearRespaldo({
        nombre: `Respaldo previo a restauración - ${new Date().toISOString()}`,
        descripcion: "Respaldo automático antes de restauración",
        tipo: "AUTOMATICO",
        usuarioId: restauracion.creadoPor,
      });
    }

    // Actualizar progreso
    await prisma.restauraciones.update({
      where: { id: restauracionId },
      data: { progreso: 50 },
    });

    // Ejecutar restauración
    const databaseUrl = process.env.DATABASE_URL;
    const comando = `psql "${databaseUrl}" < "${restauracion.respaldo.rutaArchivo}"`;
    await execAsync(comando);

    // Finalizar restauración
    const fechaFinalizacion = new Date();
    const duracion = Math.floor(
      (fechaFinalizacion - restauracion.fechaInicio) / 1000
    );

    await prisma.restauraciones.update({
      where: { id: restauracionId },
      data: {
        estado: "COMPLETADO",
        progreso: 100,
        fechaFinalizacion,
        duracion,
        registrosRestaurados: 0, // TODO: Calcular registros reales
      },
    });
  } catch (error) {
    await prisma.restauraciones.update({
      where: { id: restauracionId },
      data: {
        estado: "FALLIDO",
        mensajeError: error.message,
        detalleError: error.stack,
        fechaFinalizacion: new Date(),
      },
    });
  }
}

async function obtenerTamanoBD() {
  try {
    const result = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    return result[0]?.size || "0 MB";
  } catch (error) {
    return "N/A";
  }
}

async function obtenerEstadisticasAlmacenamiento() {
  try {
    // Calcular espacio usado por respaldos
    const respaldos = await prisma.respaldos.findMany({
      where: {
        deletedAt: null,
        tamano: { not: null },
      },
      select: {
        tamano: true,
        almacenamientoLocal: true,
        almacenamientoNube: true,
      },
    });

    let espacioLocal = 0;
    let espacioNube = 0;

    respaldos.forEach((respaldo) => {
      const tamano = Number(respaldo.tamano || 0);
      if (respaldo.almacenamientoLocal) espacioLocal += tamano;
      if (respaldo.almacenamientoNube) espacioNube += tamano;
    });

    return {
      local: {
        usado: formatBytes(espacioLocal),
        disponible: "45.8 GB", // TODO: Calcular espacio real disponible
        total: "58.0 GB",
      },
      nube: {
        usado: formatBytes(espacioNube),
        disponible: "∞",
        total: "100 GB",
      },
    };
  } catch (error) {
    return {
      local: {
        usado: "0 GB",
        disponible: "N/A",
        total: "N/A",
      },
      nube: {
        usado: "0 GB",
        disponible: "N/A",
        total: "N/A",
      },
    };
  }
}

function calcularProximoRespaldo(configuracion) {
  if (!configuracion.data?.respaldosAutomaticos) {
    return null;
  }

  const ahora = new Date();
  const [hora, minuto] = configuracion.data.horaEjecucion
    .split(":")
    .map(Number);

  let proximaFecha = new Date(ahora);
  proximaFecha.setHours(hora, minuto, 0, 0);

  // Si ya pasó la hora de hoy, programar para mañana
  if (proximaFecha <= ahora) {
    proximaFecha.setDate(proximaFecha.getDate() + 1);
  }

  // Ajustar según frecuencia
  switch (configuracion.data.frecuencia) {
    case "CADA_HORA":
      proximaFecha = new Date(ahora.getTime() + 60 * 60 * 1000);
      break;
    case "CADA_6_HORAS":
      proximaFecha = new Date(ahora.getTime() + 6 * 60 * 60 * 1000);
      break;
    case "CADA_12_HORAS":
      proximaFecha = new Date(ahora.getTime() + 12 * 60 * 60 * 1000);
      break;
    case "SEMANAL":
      proximaFecha.setDate(proximaFecha.getDate() + 7);
      break;
    case "MENSUAL":
      proximaFecha.setMonth(proximaFecha.getMonth() + 1);
      break;
  }

  return proximaFecha;
}

async function actualizarEstadisticasRespaldo() {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const estadisticas = await prisma.estadisticas_respaldos.findUnique({
      where: { fecha: hoy },
    });

    const datos = await obtenerEstadisticasRespaldo();

    if (estadisticas) {
      await prisma.estadisticas_respaldos.update({
        where: { fecha: hoy },
        data: {
          totalRespaldos: datos.data.estadisticas.totalRespaldos,
          respaldosExitosos: datos.data.estadisticas.respaldosExitosos,
          respaldosFallidos: datos.data.estadisticas.respaldosFallidos,
          tiempoPromedioRespaldo: datos.data.estadisticas.tiempoPromedio,
        },
      });
    } else {
      await prisma.estadisticas_respaldos.create({
        data: {
          fecha: hoy,
          totalRespaldos: datos.data.estadisticas.totalRespaldos,
          respaldosExitosos: datos.data.estadisticas.respaldosExitosos,
          respaldosFallidos: datos.data.estadisticas.respaldosFallidos,
          tiempoPromedioRespaldo: datos.data.estadisticas.tiempoPromedio,
        },
      });
    }
  } catch (error) {
    // Ignorar errores de estadísticas
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
