"use server";

import { prisma } from "@/lib/prisma";
import { crearRespaldo } from "@/lib/actions/respaldos";
import { logError } from "@/lib/utils/error-handler";
import { limpiarRespaldosAntiguos } from "./limpiar-respaldos";

/**
 * Ejecutar respaldo automático según la configuración
 */
export async function ejecutarRespaldoAutomatico(configuracion) {
  try {
    // Verificar si debe ejecutarse según la frecuencia
    if (!debeEjecutarse(configuracion)) {
      return {
        success: true,
        message: "No es momento de ejecutar respaldo automático",
        executed: false,
      };
    }

    // Obtener usuario del sistema (o crear uno especial para respaldos automáticos)
    const usuarioSistema = await obtenerUsuarioSistema();

    // Crear respaldo automático
    const respaldoResult = await crearRespaldo({
      nombre: `Respaldo automático - ${new Date().toLocaleString("es-PE")}`,
      descripcion: `Respaldo automático programado (${configuracion.frecuencia})`,
      tipo: "AUTOMATICO",
      usuarioId: usuarioSistema.id,
      incluyeArchivos: false,
    });

    if (!respaldoResult.success) {
      throw new Error(respaldoResult.error || "Error al crear respaldo automático");
    }

    // Limpiar respaldos antiguos si es necesario
    await limpiarRespaldosAntiguos(configuracion).catch((error) => {
      logError(error, { context: "limpiarRespaldosAntiguos" });
      // No fallar el respaldo por error en limpieza
    });

    return {
      success: true,
      message: "Respaldo automático creado exitosamente",
      executed: true,
      respaldoId: respaldoResult.data.id,
    };
  } catch (error) {
    logError(error, { context: "ejecutarRespaldoAutomatico" });
    throw error;
  }
}

/**
 * Verificar si debe ejecutarse el respaldo según la configuración
 */
function debeEjecutarse(configuracion) {
  if (!configuracion.respaldosAutomaticos || !configuracion.activo) {
    return false;
  }

  const ahora = new Date();
  const [horaConfig, minutoConfig] = configuracion.horaEjecucion
    .split(":")
    .map(Number);

  // Verificar frecuencia
  switch (configuracion.frecuencia) {
    case "CADA_HORA":
      // Ejecutar cada hora
      return ahora.getMinutes() === 0;

    case "CADA_6_HORAS":
      // Ejecutar a las horas: 0, 6, 12, 18
      return ahora.getHours() % 6 === 0 && ahora.getMinutes() === 0;

    case "CADA_12_HORAS":
      // Ejecutar a las 0:00 y 12:00
      return (ahora.getHours() === 0 || ahora.getHours() === 12) &&
        ahora.getMinutes() === 0;

    case "DIARIO":
      // Ejecutar a la hora configurada
      return (
        ahora.getHours() === horaConfig && ahora.getMinutes() === minutoConfig
      );

    case "SEMANAL":
      // Ejecutar el domingo a la hora configurada
      return (
        ahora.getDay() === 0 &&
        ahora.getHours() === horaConfig &&
        ahora.getMinutes() === minutoConfig
      );

    case "MENSUAL":
      // Ejecutar el primer día del mes a la hora configurada
      return (
        ahora.getDate() === 1 &&
        ahora.getHours() === horaConfig &&
        ahora.getMinutes() === minutoConfig
      );

    default:
      return false;
  }
}

/**
 * Obtener o crear usuario del sistema para respaldos automáticos
 */
async function obtenerUsuarioSistema() {
  const crypto = await import("crypto");
  
  // Buscar usuario del sistema
  let usuarioSistema = await prisma.usuarios.findFirst({
    where: {
      email: "sistema@coalcargo.local",
      role: "SUPER_ADMIN",
    },
  });

  // Si no existe, crear uno (solo lectura, no puede iniciar sesión)
  if (!usuarioSistema) {
    usuarioSistema = await prisma.usuarios.create({
      data: {
        email: "sistema@coalcargo.local",
        name: "Sistema Automático",
        role: "SUPER_ADMIN",
        password: crypto.randomBytes(32).toString("hex"), // Contraseña aleatoria
        estado: true,
        // Marcar como usuario del sistema (puedes agregar un campo en el schema)
      },
    });
  }

  return usuarioSistema;
}

