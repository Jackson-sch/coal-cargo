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
import { handleServerActionError, logError } from "@/lib/utils/error-handler";

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

    // Ejecutar respaldo en background (sin await para no bloquear)
    // Los errores se manejarán dentro de la función
    ejecutarRespaldoBackground(respaldo.id).catch((error) => {
      // Los errores ya se manejan dentro de ejecutarRespaldoBackground
      // pero podemos loggear aquí también si es necesario
      console.error("Error al ejecutar respaldo en background:", error);
      logError(error, { context: "crearRespaldo", respaldoId: respaldo.id });
    });

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

    // Obtener configuración para timeout
    const configuracion = await obtenerConfiguracionRespaldos();
    const timeout = configuracion.data?.timeoutRespaldo || 3600; // 1 hora por defecto

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

    if (!respaldo) {
      throw new Error("Respaldo no encontrado");
    }

    // Generar nombre de archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const nombreArchivo = configuracion.data?.comprimirRespaldos
      ? `backup_${timestamp}.sql.gz`
      : `backup_${timestamp}.sql`;

    // Obtener ruta de respaldos de la configuración
    const backupsDir = configuracion.data?.rutaLocal || "./backups";
    const rutaArchivo = path.join(backupsDir, nombreArchivo);

    // Asegurar que existe el directorio
    await fs.mkdir(backupsDir, { recursive: true });

    // Actualizar progreso
    await prisma.respaldos.update({
      where: { id: respaldoId },
      data: { progreso: 30 },
    });

    // Ejecutar pg_dump con timeout
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL no configurada");
    }

    // Construir comando de respaldo
    // Extraer componentes de la URL de conexión para mayor compatibilidad
    const isWindows = process.platform === "win32";
    
    // Parsear DATABASE_URL para obtener componentes individuales
    let urlObj;
    try {
      urlObj = new URL(databaseUrl);
    } catch (error) {
      throw new Error(`DATABASE_URL tiene un formato inválido: ${error.message}`);
    }

    const dbHost = urlObj.hostname;
    const dbPort = urlObj.port || "5432";
    const dbName = urlObj.pathname.substring(1); // Remover el "/" inicial
    const dbUser = urlObj.username;
    const dbPassword = urlObj.password;

    // En Windows, intentar encontrar pg_dump en ubicaciones comunes
    let pgDumpPath = "pg_dump";
    let pgDumpEncontrado = false;
    
    if (isWindows) {
      const posiblesRutas = [
        "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe",
        "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe",
        "C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe",
        "C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe",
        "C:\\Program Files\\PostgreSQL\\13\\bin\\pg_dump.exe",
        "C:\\Program Files (x86)\\PostgreSQL\\17\\bin\\pg_dump.exe",
        "C:\\Program Files (x86)\\PostgreSQL\\16\\bin\\pg_dump.exe",
        "C:\\Program Files (x86)\\PostgreSQL\\15\\bin\\pg_dump.exe",
      ];

      // Intentar encontrar pg_dump
      for (const ruta of posiblesRutas) {
        try {
          await fs.access(ruta);
          pgDumpPath = `"${ruta}"`; // Usar ruta completa con comillas
          pgDumpEncontrado = true;
          break;
        } catch {
          // Continuar buscando
        }
      }
      
      // Si no se encontró en rutas comunes, verificar si está en PATH
      if (!pgDumpEncontrado) {
        try {
          // Intentar ejecutar pg_dump para ver si está en PATH
          await execAsync("pg_dump --version", { timeout: 2000, shell: true });
          pgDumpPath = "pg_dump"; // Está en PATH
          pgDumpEncontrado = true;
        } catch {
          // No está disponible
        }
      }
    }

    // Si no se encontró pg_dump, lanzar error antes de intentar ejecutar
    if (isWindows && !pgDumpEncontrado) {
      throw new Error(
        "pg_dump no está instalado o no está en el PATH. " +
        "Instala PostgreSQL desde https://www.postgresql.org/download/ " +
        "y asegúrate de que pg_dump esté en el PATH del sistema o reinicia tu servidor de desarrollo."
      );
    }

    // Construir comando de respaldo usando parámetros individuales (más compatible)
    const pgDumpArgs = [
      `--host=${dbHost}`,
      `--port=${dbPort}`,
      `--username=${dbUser}`,
      `--dbname=${dbName}`,
      "--no-password", // Usar PGPASSWORD en lugar de prompt
      "--format=plain",
      "--no-owner",
      "--no-acl",
    ];

    // Construir el comando completo de pg_dump
    // Si pgDumpPath tiene comillas (ruta completa), removerlas para construir el comando correctamente
    const pgDumpExe = pgDumpPath.replace(/^"|"$/g, ''); // Remover comillas si las tiene
    const pgDumpCmd = `${pgDumpExe} ${pgDumpArgs.join(" ")}`;

    let comando;
    if (configuracion.data?.comprimirRespaldos) {
      // Comprimir con gzip
      // Nota: gzip puede no estar disponible en Windows por defecto
      // El usuario deberá instalar gzip o desactivar compresión
      if (isWindows) {
        // En Windows, usar cmd.exe para mejor compatibilidad
        // Usar comillas alrededor de la ruta completa si tiene espacios
        const pgDumpExeQuoted = pgDumpExe.includes(' ') ? `"${pgDumpExe}"` : pgDumpExe;
        comando = `cmd /c "${pgDumpExeQuoted} ${pgDumpArgs.join(" ")} | gzip -${configuracion.data.nivelCompresion || 6} > "${rutaArchivo}""`;
      } else {
        comando = `${pgDumpCmd} | gzip -${configuracion.data.nivelCompresion || 6} > "${rutaArchivo}"`;
      }
    } else {
      // Sin compresión
      if (isWindows) {
        // En Windows, usar cmd.exe para redirección
        // Usar comillas alrededor de la ruta completa si tiene espacios
        const pgDumpExeQuoted = pgDumpExe.includes(' ') ? `"${pgDumpExe}"` : pgDumpExe;
        comando = `cmd /c "${pgDumpExeQuoted} ${pgDumpArgs.join(" ")} > "${rutaArchivo}""`;
      } else {
        comando = `${pgDumpCmd} > "${rutaArchivo}"`;
      }
    }

    // Ejecutar con timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout después de ${timeout} segundos`)), timeout * 1000);
    });

    try {
      // Preparar variables de entorno
      // En Windows, agregar rutas comunes de PostgreSQL al PATH si no están
      let env = { ...process.env };
      env.PGPASSWORD = dbPassword; // Establecer PGPASSWORD en el entorno
      
      if (isWindows) {
        const posiblesRutas = [
          "C:\\Program Files\\PostgreSQL\\17\\bin",
          "C:\\Program Files\\PostgreSQL\\16\\bin",
          "C:\\Program Files\\PostgreSQL\\15\\bin",
          "C:\\Program Files\\PostgreSQL\\14\\bin",
        ];

        // Agregar rutas que existan al PATH
        for (const rutaBin of posiblesRutas) {
          try {
            await fs.access(rutaBin);
            const currentPath = env.Path || env.PATH || "";
            if (!currentPath.includes(rutaBin)) {
              env.Path = currentPath + ";" + rutaBin;
            }
          } catch {
            // Continuar
          }
        }
      }

      // En Windows, asegurar que PowerShell pueda ejecutar el comando
      const execOptions = {
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer para respaldos grandes
        shell: true,
        env: env,
      };

      // El comando ya está construido arriba con formato adecuado para Windows

      await Promise.race([execAsync(comando, execOptions), timeoutPromise]);
    } catch (error) {
      // Mejorar mensaje de error
      if (error.message.includes("timeout")) {
        throw new Error(`El respaldo excedió el tiempo límite de ${timeout} segundos`);
      } else if (error.message.includes("pg_dump") || error.code === "ENOENT" || error.message.includes("no se reconoce")) {
        throw new Error(
          "pg_dump no está instalado o no está en el PATH. " +
          "Instala PostgreSQL desde https://www.postgresql.org/download/ " +
          "y asegúrate de que pg_dump esté en el PATH del sistema."
        );
      } else if (error.message.includes("authentication") || error.message.includes("password") || error.message.includes("FATAL")) {
        throw new Error(
          "Error de autenticación con la base de datos. " +
          `Verifica que las credenciales en DATABASE_URL sean correctas. Error: ${error.message}`
        );
      } else {
        throw new Error(`Error al ejecutar respaldo: ${error.message || error.stderr || "Error desconocido"}`);
      }
    }

    // Actualizar progreso
    await prisma.respaldos.update({
      where: { id: respaldoId },
      data: { progreso: 70 },
    });

    // Verificar que el archivo se creó
    let stats;
    try {
      stats = await fs.stat(rutaArchivo);
    } catch (error) {
      throw new Error(`No se pudo crear el archivo de respaldo: ${error.message}`);
    }

    const tamano = stats.size;

    // Generar checksum para verificación de integridad
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

    // Notificar éxito si está configurado
    if (configuracion.data?.notificarExito) {
      await enviarNotificacionRespaldo(respaldoId, "exito").catch((error) => {
        logError(error, { context: "enviarNotificacionRespaldo" });
      });
    }

    // Actualizar estadísticas
    await actualizarEstadisticasRespaldo();
  } catch (error) {
    logError(error, { context: "ejecutarRespaldoBackground", respaldoId });

    await prisma.respaldos.update({
      where: { id: respaldoId },
      data: {
        estado: "FALLIDO",
        mensajeError: error.message,
        detalleError: error.stack,
        fechaFinalizacion: new Date(),
      },
    });

    // Notificar error si está configurado
    const configuracion = await obtenerConfiguracionRespaldos();
    if (configuracion.data?.notificarError) {
      await enviarNotificacionRespaldo(respaldoId, "error").catch((err) => {
        logError(err, { context: "enviarNotificacionRespaldo" });
      });
    }
  }
}

async function ejecutarRestauracionBackground(restauracionId) {
  try {
    const restauracion = await prisma.restauraciones.findUnique({
      where: { id: restauracionId },
      include: { respaldo: true },
    });

    if (!restauracion) {
      throw new Error("Restauración no encontrada");
    }

    // Verificar que el respaldo existe y está completo
    if (!restauracion.respaldo) {
      throw new Error("Respaldo asociado no encontrado");
    }

    if (restauracion.respaldo.estado !== "COMPLETADO") {
      throw new Error("El respaldo no está completo");
    }

    // Verificar que el archivo existe
    try {
      await fs.access(restauracion.respaldo.rutaArchivo);
    } catch (error) {
      throw new Error(`Archivo de respaldo no encontrado: ${restauracion.respaldo.rutaArchivo}`);
    }

    // Verificar checksum si existe
    if (restauracion.respaldo.checksum) {
      const contenido = await fs.readFile(restauracion.respaldo.rutaArchivo);
      const checksumActual = crypto
        .createHash("sha256")
        .update(contenido)
        .digest("hex");

      if (checksumActual !== restauracion.respaldo.checksum) {
        throw new Error("Checksum del archivo no coincide. El archivo puede estar corrupto.");
      }
    }

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
      await prisma.restauraciones.update({
        where: { id: restauracionId },
        data: { progreso: 20 },
      });

      const respaldoPrevioResult = await crearRespaldo({
        nombre: `Respaldo previo a restauración - ${new Date().toISOString()}`,
        descripcion: "Respaldo automático antes de restauración",
        tipo: "AUTOMATICO",
        usuarioId: restauracion.creadoPor || "sistema",
      });

      if (respaldoPrevioResult.success) {
        await prisma.restauraciones.update({
          where: { id: restauracionId },
          data: {
            respaldoPrevioId: respaldoPrevioResult.data.id,
          },
        });
      }
    }

    // Actualizar progreso
    await prisma.restauraciones.update({
      where: { id: restauracionId },
      data: { progreso: 50 },
    });

    // Ejecutar restauración
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL no configurada");
    }

    // Parsear DATABASE_URL para restaurar también
    let urlObjRestore;
    try {
      urlObjRestore = new URL(databaseUrl);
    } catch (error) {
      throw new Error(`DATABASE_URL tiene un formato inválido: ${error.message}`);
    }

    const dbHostRestore = urlObjRestore.hostname;
    const dbPortRestore = urlObjRestore.port || "5432";
    const dbNameRestore = urlObjRestore.pathname.substring(1);
    const dbUserRestore = urlObjRestore.username;
    const dbPasswordRestore = urlObjRestore.password;

    const isWindowsRestore = process.platform === "win32";
    
    const psqlArgs = [
      `--host=${dbHostRestore}`,
      `--port=${dbPortRestore}`,
      `--username=${dbUserRestore}`,
      `--dbname=${dbNameRestore}`,
      "--no-password",
    ];

    const archivo = restauracion.respaldo.rutaArchivo;

    // Si el archivo está comprimido (termina en .gz), descomprimir primero
    let comando;
    if (archivo.endsWith(".gz")) {
      const psqlCmd = `psql ${psqlArgs.join(" ")}`;
      if (isWindowsRestore) {
        // En Windows, usar cmd para mejor compatibilidad
        comando = `cmd /c "gunzip -c "${archivo}" | ${psqlCmd}"`;
      } else {
        comando = `gunzip -c "${archivo}" | PGPASSWORD="${dbPasswordRestore}" ${psqlCmd}`;
      }
    } else {
      const psqlCmd = `psql ${psqlArgs.join(" ")}`;
      if (isWindowsRestore) {
        comando = `cmd /c "${psqlCmd} < "${archivo}"`;
      } else {
        comando = `PGPASSWORD="${dbPasswordRestore}" ${psqlCmd} < "${archivo}"`;
      }
    }

    await prisma.restauraciones.update({
      where: { id: restauracionId },
      data: { progreso: 70 },
    });

    await execAsync(comando, {
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      shell: true,
      env: {
        ...process.env,
        PGPASSWORD: dbPasswordRestore,
      },
    });

    // Actualizar progreso
    await prisma.restauraciones.update({
      where: { id: restauracionId },
      data: { progreso: 90 },
    });

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
        registrosRestaurados: null, // No se puede calcular fácilmente desde psql
      },
    });

    // Notificar éxito
    await enviarNotificacionRestauracion(restauracionId, "exito").catch((error) => {
      logError(error, { context: "enviarNotificacionRestauracion" });
    });
  } catch (error) {
    logError(error, { context: "ejecutarRestauracionBackground", restauracionId });

    await prisma.restauraciones.update({
      where: { id: restauracionId },
      data: {
        estado: "FALLIDO",
        mensajeError: error.message,
        detalleError: error.stack,
        fechaFinalizacion: new Date(),
      },
    });

    // Notificar error
    await enviarNotificacionRestauracion(restauracionId, "error").catch((err) => {
      logError(err, { context: "enviarNotificacionRestauracion" });
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

/**
 * Enviar notificación de respaldo (éxito o error)
 */
async function enviarNotificacionRespaldo(respaldoId, tipo) {
  try {
    const respaldo = await prisma.respaldos.findUnique({
      where: { id: respaldoId },
      include: {
        usuario: {
          select: { email: true, name: true },
        },
      },
    });

    if (!respaldo) return;

    const configuracion = await obtenerConfiguracionRespaldos();
    const emails = configuracion.data?.emailsNotificacion || [];

    if (emails.length === 0 && respaldo.usuario?.email) {
      emails.push(respaldo.usuario.email);
    }

    if (emails.length === 0) return;

    const { enviarEmail } = await import(
      "@/lib/services/notificaciones/email-service"
    );

    const asunto =
      tipo === "exito"
        ? `✅ Respaldo completado: ${respaldo.nombre}`
        : `❌ Error en respaldo: ${respaldo.nombre}`;

    const mensaje =
      tipo === "exito"
        ? `El respaldo "${respaldo.nombre}" se completó exitosamente.\n\nDetalles:\n- Tamaño: ${formatBytes(Number(respaldo.tamano || 0))}\n- Duración: ${respaldo.duracion}s\n- Fecha: ${respaldo.fechaFinalizacion?.toLocaleString("es-PE")}`
        : `El respaldo "${respaldo.nombre}" falló.\n\nError: ${respaldo.mensajeError}\n\nFecha: ${respaldo.fechaFinalizacion?.toLocaleString("es-PE")}`;

    // Enviar a todos los emails configurados
    await Promise.all(
      emails.map((email) =>
        enviarEmail({
          destinatario: email,
          asunto,
          mensaje,
        })
      )
    );
  } catch (error) {
    logError(error, { context: "enviarNotificacionRespaldo" });
  }
}

/**
 * Enviar notificación de restauración (éxito o error)
 */
async function enviarNotificacionRestauracion(restauracionId, tipo) {
  try {
    const restauracion = await prisma.restauraciones.findUnique({
      where: { id: restauracionId },
      include: {
        respaldo: true,
        usuario: {
          select: { email: true, name: true },
        },
      },
    });

    if (!restauracion) return;

    const configuracion = await obtenerConfiguracionRespaldos();
    const emails = configuracion.data?.emailsNotificacion || [];

    if (emails.length === 0 && restauracion.usuario?.email) {
      emails.push(restauracion.usuario.email);
    }

    if (emails.length === 0) return;

    const { enviarEmail } = await import(
      "@/lib/services/notificaciones/email-service"
    );

    const asunto =
      tipo === "exito"
        ? `✅ Restauración completada`
        : `❌ Error en restauración`;

    const mensaje =
      tipo === "exito"
        ? `La restauración del respaldo "${restauracion.respaldo?.nombre}" se completó exitosamente.\n\nDetalles:\n- Duración: ${restauracion.duracion}s\n- Fecha: ${restauracion.fechaFinalizacion?.toLocaleString("es-PE")}`
        : `La restauración del respaldo "${restauracion.respaldo?.nombre}" falló.\n\nError: ${restauracion.mensajeError}\n\nFecha: ${restauracion.fechaFinalizacion?.toLocaleString("es-PE")}`;

    // Enviar a todos los emails configurados
    await Promise.all(
      emails.map((email) =>
        enviarEmail({
          destinatario: email,
          asunto,
          mensaje,
        })
      )
    );
  } catch (error) {
    logError(error, { context: "enviarNotificacionRestauracion" });
  }
}
