"use client";
import * as React from "react";
import {
  BarChart3,
  Building2,
  Calculator,
  Command,
  GalleryVerticalEnd,
  LayoutDashboard,
  Package,
  Settings2,
  Settings,
  Truck,
  Users,
  MapPin,
  FileText,
  DollarSign,
  TrendingUp,
  UserCheck,
  Route,
  CreditCard,
  Eye,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { SucursalSwitcher } from "@/components/sucursal-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useEmpresaSucursalConfig } from "@/hooks/use-empresa-sucursal-config";
import { useSucursalesDisponibles } from "@/hooks/use-sucursales-disponibles";
export function AppSidebar({ user, ...props }) {
  const { config, loading, getNombreCompleto, getPlan } =
    useEmpresaSucursalConfig();
  const { sucursales, loadingSucursales } = useSucursalesDisponibles(); // Generar lista de sucursales según el rol del usuari o
  const getSucursalesParaSidebar = () => {
    if (config.usuario.rol === "SUPER_ADMIN") {
      // Para SUPER_ADMIN: mostrar sucursal actual + todas las disponible s
      const sucursalesLista = [
        {
          name: getNombreCompleto(),
          logo: Building2,
          plan: getPlan(),
          isActive: true, // Sucursal/contexto actua l
        },
      ]; // Agregar otras sucursales disponible s
      if (!loadingSucursales && sucursales.length > 0) {
        sucursales.forEach((sucursal) => {
          // No duplicar la sucursal actual si ya está en la list a
          const esSucursalActual = config.sucursal.nombre === sucursal.nombre;
          if (!esSucursalActual) {
            sucursalesLista.push({
              name: `${config.empresa.nombre} - ${sucursal.nombre}`,
              logo: Building2,
              plan: "Sucursal",
              isActive: false,
              sucursalId: sucursal.id,
            });
          }
        });
      }

      return sucursalesLista;
    } else {
      // Para otros usuarios: solo mostrar su sucursal actua l
      return [
        {
          name: getNombreCompleto(),
          logo: Building2,
          plan: getPlan(),
          isActive: true,
        },
      ];
    }
  }; // Datos de navegación actualizados con el nombre dinámico de la empresa y sucursa l
  const data = {
    user: {
      name: config.usuario.nombre || user?.name,
      email: config.usuario.email || user?.email,
      avatar: "/avatars/shadcn.jpg",
    },
    teams: getSucursalesParaSidebar(),
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        items: [
          {
            title: "Resumen General",
            url: "/dashboard",
          },
          {
            title: "Estadísticas",
            url: "/dashboard/estadisticas",
          },
          {
            title: "Reportes",
            url: "/dashboard/reportes",
          },
        ],
      },
      {
        title: "Operaciones",
        url: "/dashboard/operaciones",
        icon: Package,
        items: [
          {
            title: "Cotizaciones",
            url: "/dashboard/cotizaciones",
            icon: Calculator,
          },
          {
            title: "Envíos",
            url: "/dashboard/envios",
            icon: Truck,
          },
          {
            title: "En Tránsito",
            url: "/dashboard/envios/transito",
            icon: Truck,
          },
          {
            title: "Entregados",
            url: "/dashboard/envios/entregados",
            icon: UserCheck,
          },
          {
            title: "Seguimiento",
            url: "/dashboard/seguimiento",
            icon: Eye,
          },
        ],
      },
      {
        title: "Clientes",
        url: "/dashboard/clientes",
        icon: Users,
        items: [
          {
            title: "Lista de Clientes",
            url: "/dashboard/clientes",
          },
          {
            title: "Importar Clientes",
            url: "/dashboard/clientes/importar",
          },
          {
            title: "Historial de Envíos",
            url: "/dashboard/clientes/historial",
          },
        ],
      },
      {
        title: "Configuraciones",
        url: "/dashboard/configuracion",
        icon: Settings,
        items: [
          {
            title: "General",
            url: "/dashboard/configuracion/general",
          },
          {
            title: "Tarifas",
            url: "/dashboard/configuracion/tarifas",
            icon: DollarSign,
          },
          {
            title: "Usuarios",
            url: "/dashboard/configuracion/usuarios",
            icon: Users,
          },
          {
            title: "Notificaciones",
            url: "/dashboard/configuracion/notificaciones",
          },
          {
            title: "Sistema",
            url: "/dashboard/configuracion/sistema",
          },
        ],
      },
      {
        title: "Administración",
        url: "/dashboard/administracion",
        icon: Settings2,
        items: [
          {
            title: "Sucursales",
            url: "/dashboard/administracion/sucursales",
            icon: Building2,
          },
          {
            title: "Rutas",
            url: "/dashboard/rutas",
            icon: Route,
          },
          {
            title: "Auditoría",
            url: "/dashboard/auditoria",
            icon: Eye,
          },
          {
            title: "Respaldos",
            url: "/dashboard/backup",
            icon: Settings2,
          },
        ],
      },
      {
        title: "Finanzas",
        url: "/dashboard/finanzas",
        icon: DollarSign,
        items: [
          {
            title: "Facturación",
            url: "/dashboard/facturacion",
            icon: FileText,
          },
          {
            title: "Pagos",
            url: "/dashboard/pagos",
            icon: CreditCard,
          },
          {
            title: "Reportes Financieros",
            url: "/dashboard/finanzas/reportes",
            icon: TrendingUp,
          },
          {
            title: "Cuentas por Cobrar",
            url: "/dashboard/finanzas/cuentas-cobrar",
            icon: BarChart3,
          },
        ],
      },
    ], // Eliminamos la sección projects ya que todo está en navMain ahor a
    projects: [],
  };
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SucursalSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {data.projects.length > 0 && <NavProjects projects={data.projects} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
