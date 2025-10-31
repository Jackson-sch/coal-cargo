import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { migrarGuiasExistentes } from "@/lib/utils/migrate-guias";

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

    console.log(
      `🔄 Iniciando migración de guías por usuario: ${session.user.email}`
    );

    const resultado = await migrarGuiasExistentes();

    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error }, { status: 500 });
    }

    console.log(`✅ Migración completada por usuario: ${session.user.email}`);
    console.log(
      `📊 Resultado: ${resultado.migrados} migradas, ${resultado.errores} errores`
    );

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error en migración de guías:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
