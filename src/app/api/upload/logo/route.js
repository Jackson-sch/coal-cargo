import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { auth } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "logos");

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    // Check permissions
    if (!["SUPER_ADMIN", "ADMIN_SUCURSAL"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Permisos insuficientes" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("logo");

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WebP)",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "El archivo es demasiado grande. Máximo 5MB",
        },
        { status: 400 }
      );
    }

    await ensureUploadDir();

    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.name);
    const filename = `logo-${timestamp}${extension}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the public URL
    const logoUrl = `/uploads/logos/${filename}`;

    return NextResponse.json({
      success: true,
      logoUrl,
      message: "Logo subido correctamente",
    });
  } catch (error) {
    console.error("Error uploading logo:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    // Check permissions
    if (!["SUPER_ADMIN", "ADMIN_SUCURSAL"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Permisos insuficientes" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { success: false, error: "Nombre de archivo requerido" },
        { status: 400 }
      );
    }

    const filepath = path.join(UPLOAD_DIR, filename);

    // Check if file exists and delete it
    if (existsSync(filepath)) {
      await unlink(filepath);
    }

    return NextResponse.json({
      success: true,
      message: "Logo eliminado correctamente",
    });
  } catch (error) {
    console.error("Error deleting logo:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
