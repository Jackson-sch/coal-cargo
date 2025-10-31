// lib/utils.j s
import { NextResponse } from "next/server";
import { z } from "zod";
function handleApiError(error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: "Datos inválidos",
        details: error.errors,
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: false, error: "Error interno del servidor" },
    { status: 500 }
  );
}

function generateGuiaNumber(sucursalCodigo) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${sucursalCodigo}-${timestamp}-${random}`;
}

function calcularVolumen(largo, ancho, alto) {
  if (!largo || !ancho || !alto) return null;
  return (largo * ancho * alto) / 1000000; // cm3 a m3
}

export default { handleApiError, generateGuiaNumber, calcularVolumen };
