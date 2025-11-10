import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Componente de protección de rutas para Server Components
 * Verifica que el usuario tenga el rol requerido para acceder a una página
 *
 * @param {Object} props
 * @param {string|string[]} props.allowedRoles - Roles permitidos (ej: "SUPER_ADMIN" o ["SUPER_ADMIN", "ADMIN_SUCURSAL"])
 * @param {React.ReactNode} props.children - Contenido a mostrar si tiene permisos
 * @param {string} props.redirectTo - Ruta a la que redirigir si no tiene permisos (default: "/dashboard")
 */
export default async function RouteProtectionServer({
  allowedRoles,
  children,
  redirectTo = "/dashboard",
}) {
  const session = await auth();

  // Si no está autenticado, redirigir al login
  if (!session?.user) {
    redirect("/login");
  }

  // Convertir allowedRoles a array si es string
  const allowedRolesArray = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];

  // Verificar si el usuario tiene uno de los roles permitidos
  if (!allowedRolesArray.includes(session.user.role)) {
    redirect(redirectTo);
  }

  // Si tiene permisos, mostrar el contenido
  return <>{children}</>;
}

