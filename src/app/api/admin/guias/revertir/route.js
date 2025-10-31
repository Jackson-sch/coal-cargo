import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revertirMigracion } from "@/lib/utils/migrate-guias";

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
      `⚠️ Iniciando reversión de migración por usuario: ${session.user.email}`
    );

    const resultado = await revertirMigracion();

    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error }, { status: 500 });
    }

    console.log(`↩️ Reversión completada por usuario: ${session.user.email}`);
    console.log(
      `📊 Resultado: ${resultado.revertidos} revertidas, ${resultado.errores} errores`
    );

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error en reversión de migración:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
