"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Componente de protección de rutas
 * Verifica que el usuario tenga el rol requerido para acceder a una página
 *
 * @param {Object} props
 * @param {string|string[]} props.allowedRoles - Roles permitidos (ej: "SUPER_ADMIN" o ["SUPER_ADMIN", "ADMIN_SUCURSAL"])
 * @param {React.ReactNode} props.children - Contenido a mostrar si tiene permisos
 * @param {string} props.redirectTo - Ruta a la que redirigir si no tiene permisos (default: "/dashboard")
 * @param {string} props.customMessage - Mensaje personalizado a mostrar
 */
export default function RouteProtection({
  allowedRoles,
  children,
  redirectTo = "/dashboard",
  customMessage,
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Convertir allowedRoles a array si es string
  const allowedRolesArray = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];

  useEffect(() => {
    if (status === "loading") {
      return; // Esperar a que cargue la sesión
    }

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      const userRole = session.user.role;

      // Verificar si el usuario tiene uno de los roles permitidos
      if (!allowedRolesArray.includes(userRole)) {
        // Redirigir si no tiene permisos
        router.push(redirectTo);
      }
    }
  }, [session, status, allowedRolesArray, redirectTo, router]);

  // Mostrar carga mientras se verifica la sesión
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (el useEffect redirigirá)
  if (status === "unauthenticated") {
    return null;
  }

  // Si no tiene permisos, mostrar mensaje de error
  if (session?.user && !allowedRolesArray.includes(session.user.role)) {
    const defaultMessage = customMessage || (
      <>
        No tienes permisos para acceder a esta página.
        <br />
        Esta sección está restringida a: {allowedRolesArray.join(", ")}
      </>
    );

    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Acceso Denegado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Sin Permisos</AlertTitle>
              <AlertDescription>{defaultMessage}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si tiene permisos, mostrar el contenido
  return <>{children}</>;
}

