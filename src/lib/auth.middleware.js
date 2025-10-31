import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthContextSchema } from "@/lib/validaciones-zod";
async function withAuth(handler, requiredRoles) {
  return async (req) => {
    try {
      const session = await auth();
      if (!session?.user?.email) {
        return NextResponse.json(
          { success: false, error: "No autorizado" },
          { status: 401 }
        );
      }

      // Obtener datos completos del usuari o
      const user = await prisma.usuarios.findUnique({
        where: {
          email: session.user.email,
          deletedAt: null, // Solo usuarios no eliminado s
        },
        include: { sucursales: true },
      });
      if (!user || !user.estado) {
        return NextResponse.json(
          { success: false, error: "Usuario inactivo" },
          { status: 401 }
        );
      }

      // Verificar roles si es necesari o
      if (requiredRoles && !requiredRoles.includes(user.role)) {
        return NextResponse.json(
          { success: false, error: "Sin permisos suficientes" },
          { status: 403 }
        );
      }

      const authContext = {
        userId: user.id,
        email: user.email,
        rol: user.role,
        sucursalId: user.sucursalId || undefined,
      }; // Validar authContext contra el schem a
      AuthContextSchema.parse(authContext);
      return handler(req, authContext);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Error interno del servidor" },
        { status: 500 }
      );
    }
  };
}

export { withAuth };
