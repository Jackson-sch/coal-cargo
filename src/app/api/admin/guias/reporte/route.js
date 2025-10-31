import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generarReporteGuias } from "@/lib/utils/migrate-guias";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo super admins pueden ejecutar esto
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Permisos insuficientes" },
        { status: 403 }
      );
    }

    const reporte = await generarReporteGuias();

    if (reporte.error) {
      return NextResponse.json({ error: reporte.error }, { status: 500 });
    }

    return NextResponse.json(reporte);
  } catch (error) {
    console.error("Error en reporte de guías:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
