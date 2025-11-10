"use server";

/**
 * Utilidades para verificar y diagnosticar problemas con respaldos
 */

/**
 * Verificar si pg_dump está disponible
 */
export async function verificarPgDump() {
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    const path = await import("path");

    const isWindows = process.platform === "win32";
    
    // Intentar encontrar pg_dump en ubicaciones comunes de Windows
    let comando = "pg_dump --version";
    let env = { ...process.env };
    
    if (isWindows) {
      // Buscar PostgreSQL en ubicaciones comunes
      const posiblesRutas = [
        "C:\\Program Files\\PostgreSQL\\17\\bin",
        "C:\\Program Files\\PostgreSQL\\16\\bin",
        "C:\\Program Files\\PostgreSQL\\15\\bin",
        "C:\\Program Files\\PostgreSQL\\14\\bin",
      ];

      // Intentar encontrar pg_dump en las rutas comunes
      const fs = await import("fs/promises");
      for (const rutaBin of posiblesRutas) {
        const rutaPgDump = path.join(rutaBin, "pg_dump.exe");
        try {
          await fs.access(rutaPgDump);
          // Encontró pg_dump, agregar al PATH
          env.Path = (env.Path || env.PATH || "") + ";" + rutaBin;
          break;
        } catch {
          // Continuar buscando
        }
      }
    }

    const { stdout } = await execAsync(comando, {
      timeout: 5000,
      shell: true,
      env: env,
    });

    return {
      disponible: true,
      version: stdout.trim(),
      mensaje: "pg_dump está disponible",
    };
  } catch (error) {
    return {
      disponible: false,
      version: null,
      mensaje:
        "pg_dump no está disponible. Instala PostgreSQL o agrega pg_dump al PATH.",
      error: error.message,
    };
  }
}

/**
 * Verificar si DATABASE_URL está configurada y es válida
 */
export async function verificarDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return {
      configurada: false,
      valida: false,
      mensaje: "DATABASE_URL no está configurada",
    };
  }

  try {
    const url = new URL(databaseUrl);
    if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
      return {
        configurada: true,
        valida: false,
        mensaje: `Protocolo inválido en DATABASE_URL: ${url.protocol}. Debe ser postgresql:// o postgres://`,
      };
    }

    return {
      configurada: true,
      valida: true,
      mensaje: "DATABASE_URL está configurada y es válida",
      host: url.hostname,
      port: url.port || "5432",
      database: url.pathname.substring(1),
      username: url.username,
    };
  } catch (error) {
    return {
      configurada: true,
      valida: false,
      mensaje: `DATABASE_URL tiene un formato inválido: ${error.message}`,
    };
  }
}

/**
 * Verificar permisos de escritura en el directorio de respaldos
 */
export async function verificarPermisosEscritura(ruta = "./backups") {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");

    // Intentar crear el directorio si no existe
    await fs.mkdir(ruta, { recursive: true });

    // Intentar escribir un archivo de prueba
    const archivoPrueba = path.join(ruta, ".test-write");
    await fs.writeFile(archivoPrueba, "test");
    await fs.unlink(archivoPrueba);

    return {
      tienePermisos: true,
      mensaje: `El directorio ${ruta} tiene permisos de escritura`,
    };
  } catch (error) {
    return {
      tienePermisos: false,
      mensaje: `No se tienen permisos de escritura en ${ruta}: ${error.message}`,
      error: error.message,
    };
  }
}

/**
 * Verificación completa del sistema de respaldos
 */
export async function verificarSistemaRespaldos() {
  const [pgDump, databaseUrl, permisos] = await Promise.all([
    verificarPgDump(),
    verificarDatabaseUrl(),
    verificarPermisosEscritura(),
  ]);

  const todoOk = pgDump.disponible && databaseUrl.valida && permisos.tienePermisos;

  return {
    todoOk,
    verificaciones: {
      pgDump,
      databaseUrl,
      permisos,
    },
    mensaje: todoOk
      ? "El sistema de respaldos está listo para usar"
      : "Hay problemas con la configuración del sistema de respaldos",
  };
}

