"use client";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useEmpresaConfig } from "@/hooks/use-empresa-config";

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const { empresaConfig } = useEmpresaConfig();
  // Dividir la ruta en segmentos

  const segments = pathname.split("/").filter(Boolean);
  // Mapeo de rutas a nombres legible s
  const routeNames = {
    dashboard: "Dashboard",
    operaciones: "Operaciones",
    envios: "Envíos",
    cotizaciones: "Cotizaciones",
    seguimiento: "Seguimiento",
    clientes: "Clientes",
    administracion: "Administración",
    configuraciones: "Configuraciones",
    general: "General",
    tarifas: "Tarifas",
    usuarios: "Usuarios",
    notificaciones: "Notificaciones",
    sistema: "Sistema",
  };

  // Siempre incluir el nombre de la empresa como raí z
  const breadcrumbs = [
    {
      href: "/dashboard",
      label: empresaConfig.nombre,
      isLast: segments.length === 1 && segments[0] === "dashboard",
    },
  ];

  // Construir breadcrumbs basado en la rut a
  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    const label =
      routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    if (currentPath !== "/dashboard") {
      breadcrumbs.push({ href: currentPath, label, isLast });
    }
  });
  // Si estamos en dashboard root, marcar como últim o
  if (pathname === "/dashboard") {
    breadcrumbs[0].isLast = true;
  }

  return (
    <div className="no-print">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center">
              <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!crumb.isLast && (
                <BreadcrumbSeparator
                  className={index === 0 ? "hidden md:block" : ""}
                />
              )}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
