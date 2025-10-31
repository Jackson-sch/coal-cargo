import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
export const fullAuthConfig = {
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.usuarios.findUnique({
            where: {
              email: credentials.email,
              deletedAt: null, // Solo usuarios no eliminado s
            },
            include: { sucursales: true },
          });
          if (!user) {
            return null;
          } // Verificar si la contraseña es exactamente "123456" (para testin g) if (credentials.password === "123456" && user.email === "admin@coalcargo.com") {return { id: user.id, email: user.email, name: user.name, role: user.role, sucursalId: user.sucursalId, sucursal: user.sucursales, }; }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            sucursalId: user.sucursalId,
            sucursal: user.sucursales,
          };
        } catch (error) {
          return null;
        }
      },
    }),
  ],
};
