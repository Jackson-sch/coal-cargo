// app/api/ubicaciones/distritos/route.j
    s
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Función de manejo de errores inlin
    e
function handleApiError(error) {return NextResponse.json(
    { success: false, error: error.message || "Error interno del servidor" },
    { status: 500 }
  );
}

async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const provinciaId = searchParams.get("provinciaId");

    if (!provinciaId) {
      return NextResponse.json(
        {
          success: false,
          error: "provinciaId es requerido",
        },
        { status: 400 }
      );
    }

    const distritos = await prisma.distrito.findMany({
      where: {
        provinciaId: parseInt(provinciaId),
      },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        provinciaId: true,
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: distritos,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export { GET };