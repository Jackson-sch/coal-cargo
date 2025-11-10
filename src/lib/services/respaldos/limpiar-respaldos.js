"use server";

import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/utils/error-handler";
import fs from "fs/promises";
import path from "path";

/**
 * Limpiar respaldos antiguos según la configuración
 */
export async function limpiarRespaldosAntiguos(configuracion) {
  try {
    const ahora = new Date();
    const fechaLimite = new Date(ahora);
    fechaLimite.setDate(fechaLimite.getDate() - configuracion.diasRetencion);

    // Obtener respaldos antiguos
    const respaldosAntiguos = await prisma.respaldos.findMany({
      where: {
        deletedAt: null,
        fechaInicio: {
          lt: fechaLimite,
        },
        estado: {
          in: ["COMPLETADO", "FALLIDO"],
        },
      },
      orderBy: {
        fechaInicio: "asc",
      },
    });

    let eliminados = 0;

    for (const respaldo of respaldosAntiguos) {
      try {
        // Eliminar archivo físico si existe
        if (respaldo.rutaArchivo) {
          try {
            await fs.unlink(respaldo.rutaArchivo);
          } catch (error) {
            // Ignorar si el archivo no existe
            if (error.code !== "ENOENT") {
              logError(error, {
                context: "limpiarRespaldosAntiguos",
                respaldoId: respaldo.id,
              });
            }
          }
        }

        // Soft delete del respaldo
        await prisma.respaldos.update({
          where: { id: respaldo.id },
          data: {
            deletedAt: new Date(),
            eliminadoEn: new Date(),
          },
        });

        eliminados++;
      } catch (error) {
        logError(error, {
          context: "limpiarRespaldosAntiguos",
          respaldoId: respaldo.id,
        });
      }
    }

    // También limpiar si excede el máximo de respaldos
    const totalRespaldos = await prisma.respaldos.count({
      where: {
        deletedAt: null,
        estado: "COMPLETADO",
      },
    });

    if (totalRespaldos > configuracion.maxRespaldos) {
      const respaldosExcedentes = await prisma.respaldos.findMany({
        where: {
          deletedAt: null,
          estado: "COMPLETADO",
        },
        orderBy: {
          fechaInicio: "asc",
        },
        take: totalRespaldos - configuracion.maxRespaldos,
      });

      for (const respaldo of respaldosExcedentes) {
        try {
          // Eliminar archivo físico si existe
          if (respaldo.rutaArchivo) {
            try {
              await fs.unlink(respaldo.rutaArchivo);
            } catch (error) {
              // Ignorar si el archivo no existe
            }
          }

          // Soft delete del respaldo
          await prisma.respaldos.update({
            where: { id: respaldo.id },
            data: {
              deletedAt: new Date(),
              eliminadoEn: new Date(),
            },
          });

          eliminados++;
        } catch (error) {
          logError(error, {
            context: "limpiarRespaldosAntiguos",
            respaldoId: respaldo.id,
          });
        }
      }
    }

    return {
      success: true,
      eliminados,
      message: `Se eliminaron ${eliminados} respaldos antiguos`,
    };
  } catch (error) {
    logError(error, { context: "limpiarRespaldosAntiguos" });
    throw error;
  }
}

