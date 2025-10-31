import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { fullAuthConfig } from "./auth.config.full";
import { prisma } from "@/lib/prisma";

const authConfig = {
  adapter: PrismaAdapter(prisma),
  ...fullAuthConfig,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sucursalId = user.sucursalId;
        token.sucursal = user.sucursal;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.sucursalId = token.sucursalId;
        session.user.sucursal = token.sucursal;
      }
      return session;
    },
    async signOut({ token }) {
      // Limpiar cualquier dato adicional si es necesario
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/login",
  },
  events: {
    async signOut(message) {},
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
export const authOptions = authConfig;
