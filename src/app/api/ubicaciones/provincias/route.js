// app/api/ubicaciones/provincias/route.j s
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Función de manejo de errores inlin e
function handleApiError(error) {return NextResponse.json( { success: false, error: error.message || "Error interno del servidor" }, { status: 500 } );
} async function GET(request) { try { const { searchParams } = new URL(request.url); const departamentoId = searchParams.get("departamentoId"); if (!departamentoId) { return NextResponse.json( {
          success: false, error: "departamentoId es requerido", }, { status: 400 } ); }

    const provincias = await prisma.provincia.findMany({ where: { departamentoId: parseInt(departamentoId), }, select: { id: true, nombre: true, codigo: true, departamentoId: true, }, orderBy: { nombre: "asc" }, }); return NextResponse.json({ success: true, data: provincias, }); } catch (error) { return handleApiError(error); }
} export { GET };
