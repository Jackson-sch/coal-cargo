import { NextResponse } from "next/server";
import { verificarSistemaRespaldos } from "@/lib/utils/backup-helper";

/**
 * API Route para verificar el estado del sistema de respaldos
 */
export async function GET() {
  try {
    const resultado = await verificarSistemaRespaldos();
    return NextResponse.json(resultado);
  } catch (error) {
    return NextResponse.json(
      {
        todoOk: false,
        error: error.message || "Error al verificar el sistema",
      },
      { status: 500 }
    );
  }
}

