import { NextResponse } from "next/server";
import { obtenerConfiguracionRespaldos } from "@/lib/actions/respaldos";
import { ejecutarRespaldoAutomatico } from "@/lib/services/respaldos/ejecutar-automatico";

/**
 * API Route para ejecutar respaldos automáticos
 * Esta ruta debe ser llamada por un cron job o scheduler externo
 * 
 * Para configurar un cron job, usar:
 * - Vercel Cron Jobs (si está en Vercel)
 * - Cron-job.org
 * - GitHub Actions
 * - Sistema operativo (crontab)
 * 
 * Ejemplo de cron job (cada día a las 2 AM):
 * 0 2 * * * curl https://tudominio.com/api/respaldos/ejecutar-automatico?token=TU_SECRET_TOKEN
 */
export async function GET(request) {
  try {
    // Verificar token de seguridad (recomendado para producción)
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const expectedToken = process.env.BACKUP_CRON_SECRET;

    if (expectedToken && token !== expectedToken) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener configuración
    const configResult = await obtenerConfiguracionRespaldos();
    if (!configResult.success || !configResult.data.respaldosAutomaticos) {
      return NextResponse.json({
        success: true,
        message: "Respaldos automáticos deshabilitados",
        executed: false,
      });
    }

    // Ejecutar respaldo automático
    const result = await ejecutarRespaldoAutomatico(configResult.data);

    return NextResponse.json({
      success: true,
      message: "Respaldo automático ejecutado",
      executed: true,
      result,
    });
  } catch (error) {
    console.error("Error al ejecutar respaldo automático:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al ejecutar respaldo automático",
      },
      { status: 500 }
    );
  }
}

// También permitir POST por si se prefiere usar webhooks
export async function POST(request) {
  return GET(request);
}

