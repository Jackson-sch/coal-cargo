import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config"; // Sin Prism a
import { NextResponse } from "next/server";
const { auth } = NextAuth(authConfig);
const publicRoutes = ["/", "/prices"];
const authRoutes = ["/login", "/register", "/recovery"];
const apiAuthPrefix = "/api/auth";
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const { pathname } = nextUrl; // Permitir rutas de API de aut h
  if (pathname.startsWith(apiAuthPrefix)) {
    return NextResponse.next();
  }

  // Permitir rutas pública s
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Redirigir a dashboard si está logueado y accede a auth route s
  if (isLoggedIn && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Redirigir a login si no está logueado y no es ruta públic a
  if (
    !isLoggedIn &&
    !authRoutes.includes(pathname) &&
    !publicRoutes.includes(pathname)
  ) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
