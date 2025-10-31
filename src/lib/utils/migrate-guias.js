/**
 * Script de migración para estandarizar números de guía existentes
 * Convierte guías con formato antiguo al nuevo formato estándar
 */

import { prisma } from "@/lib/prisma";
import { generarNumeroGuia, validarFormatoGuia } from "./guia-generator.js";

/**
 * Migra todas las guías existentes al nuevo formato
 * Solo actualiza las que no siguen el formato estándar
 */
export async function migrarGuiasExistentes() {
  console.log("🔄 Iniciando migración de guías...");

  try {
    // Obtener todos los envíos con guías que no siguen el formato estándar
    const enviosConGuiasAntiguas = await prisma.envios.findMany({
      where: {
        deletedAt: null,
        NOT: {
          guia: null,
        },
      },
      select: {
        id: true,
        guia: true,
        sucursalOrigenId: true,
        createdAt: true,
      },
    });

    console.log(
      `📋 Encontrados ${enviosConGuiasAntiguas.length} envíos para revisar`
    );

    let migrados = 0;
    let yaCorrectos = 0;
    let errores = 0;

    for (const envio of enviosConGuiasAntiguas) {
      try {
        // Verificar si la guía ya tiene el formato correcto
        if (validarFormatoGuia(envio.guia)) {
          yaCorrectos++;
          continue;
        }

        console.log(`🔧 Migrando guía: ${envio.guia} (ID: ${envio.id})`);

        // Generar nueva guía con formato estándar
        const nuevaGuia = await generarNumeroGuia(envio.sucursalOrigenId);

        // Actualizar en la base de datos
        await prisma.envios.update({
          where: { id: envio.id },
          data: {
            guia: nuevaGuia,
            // Guardar la guía original en observaciones si no existe
            observaciones: envio.observaciones
              ? `${envio.observaciones}\n[Guía original: ${envio.guia}]`
              : `[Guía original: ${envio.guia}]`,
          },
        });

        console.log(`✅ Migrado: ${envio.guia} → ${nuevaGuia}`);
        migrados++;
      } catch (error) {
        console.error(`❌ Error migrando envío ${envio.id}:`, error.message);
        errores++;
      }
    }

    console.log("\n📊 Resumen de migración:");
    console.log(`✅ Guías migradas: ${migrados}`);
    console.log(`✓ Ya correctas: ${yaCorrectos}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📋 Total procesados: ${enviosConGuiasAntiguas.length}`);

    return {
      success: true,
      migrados,
      yaCorrectos,
      errores,
      total: enviosConGuiasAntiguas.length,
    };
  } catch (error) {
    console.error("❌ Error en migración:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Revierte la migración usando las guías originales guardadas en observaciones
 * ⚠️ USAR CON PRECAUCIÓN - Solo para casos de emergencia
 */
export async function revertirMigracion() {
  console.log("⚠️ Iniciando reversión de migración...");

  try {
    // Buscar envíos que tienen guías originales en observaciones
    const enviosMigrados = await prisma.envios.findMany({
      where: {
        deletedAt: null,
        observaciones: {
          contains: "[Guía original:",
        },
      },
      select: {
        id: true,
        guia: true,
        observaciones: true,
      },
    });

    console.log(`📋 Encontrados ${enviosMigrados.length} envíos migrados`);

    let revertidos = 0;
    let errores = 0;

    for (const envio of enviosMigrados) {
      try {
        // Extraer guía original de las observaciones
        const match = envio.observaciones.match(/\[Guía original: ([^\]]+)\]/);
        if (!match) {
          console.log(`⚠️ No se encontró guía original para envío ${envio.id}`);
          continue;
        }

        const guiaOriginal = match[1];

        // Limpiar observaciones
        const observacionesLimpias = envio.observaciones
          .replace(/\n?\[Guía original: [^\]]+\]/, "")
          .trim();

        // Actualizar en la base de datos
        await prisma.envios.update({
          where: { id: envio.id },
          data: {
            guia: guiaOriginal,
            observaciones: observacionesLimpias || null,
          },
        });

        console.log(`↩️ Revertido: ${envio.guia} → ${guiaOriginal}`);
        revertidos++;
      } catch (error) {
        console.error(`❌ Error revirtiendo envío ${envio.id}:`, error.message);
        errores++;
      }
    }

    console.log("\n📊 Resumen de reversión:");
    console.log(`↩️ Guías revertidas: ${revertidos}`);
    console.log(`❌ Errores: ${errores}`);

    return {
      success: true,
      revertidos,
      errores,
    };
  } catch (error) {
    console.error("❌ Error en reversión:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Genera un reporte de las guías actuales en el sistema
 */
export async function generarReporteGuias() {
  try {
    const envios = await prisma.envios.findMany({
      where: {
        deletedAt: null,
        NOT: {
          guia: null,
        },
      },
      select: {
        guia: true,
        createdAt: true,
        sucursalOrigen: {
          select: { nombre: true, provincia: true },
        },
      },
    });

    const formatosCorrectos = envios.filter((e) => validarFormatoGuia(e.guia));
    const formatosIncorrectos = envios.filter(
      (e) => !validarFormatoGuia(e.guia)
    );

    // Agrupar por patrones
    const patrones = {};
    formatosIncorrectos.forEach((envio) => {
      const patron = envio.guia.replace(/\d/g, "X");
      if (!patrones[patron]) {
        patrones[patron] = [];
      }
      patrones[patron].push(envio.guia);
    });

    console.log("📊 Reporte de Guías:");
    console.log(`✅ Formato correcto: ${formatosCorrectos.length}`);
    console.log(`❌ Formato incorrecto: ${formatosIncorrectos.length}`);
    console.log(`📋 Total: ${envios.length}`);

    if (Object.keys(patrones).length > 0) {
      console.log("\n🔍 Patrones de guías incorrectas:");
      Object.entries(patrones).forEach(([patron, guias]) => {
        console.log(`  ${patron}: ${guias.length} guías`);
        console.log(`    Ejemplos: ${guias.slice(0, 3).join(", ")}`);
      });
    }

    return {
      total: envios.length,
      correctos: formatosCorrectos.length,
      incorrectos: formatosIncorrectos.length,
      patrones,
    };
  } catch (error) {
    console.error("❌ Error generando reporte:", error);
    return { error: error.message };
  }
}
