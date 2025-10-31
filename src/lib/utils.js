import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { NextResponse } from "next/server";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function handleApiError(error) {
  return NextResponse.json(
    {
      success: false,
      error: error.message || "Error interno del servidor",
    },
    { status: 500 }
  );
}
