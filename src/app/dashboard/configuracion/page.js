"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Settings,
  Building2,
  DollarSign,
  MapPin,
  Users,
  ArrowRight,
  Bell,
} from "lucide-react";
import { useEmpresaConfig } from "@/hooks/use-empresa-config";
export default function ConfiguracionPage() {
  const { empresaConfig } = useEmpresaConfig();
  const configuraciones = [
    {
      id: "general",
      titulo: "Configuración General",
      descripcion:
        "Parámetros generales del sistema, información de la empresa y configuraciones operativas",
      icono: Settings,
      href: "/dashboard/configuracion/general",
      color: "bg-blue-500",
      items: [
        "Información de la empresa",
        "Horarios de operación",
        "Configuraciones de notificaciones",
        "Parámetros de facturación",
      ],
    },
    {
      id: "tarifas",
      titulo: "Tarifas",
      descripcion:
        "Gestión de precios de envío por zonas, tipos de servicio y rangos de peso",
      icono: DollarSign,
      href: "/dashboard/configuracion/tarifas",
      color: "bg-green-500",
      items: [
        "Tarifas por zonas",
        "Tipos de servicio",
        "Calculadora de precios",
        "Rangos de peso",
      ],
    },
    {
      id: "ubicaciones",
      titulo: "Ubicaciones",
      descripcion:
        "Administración de departamentos, provincias y distritos para la cobertura de envíos",
      icono: MapPin,
      href: "/dashboard/configuracion/ubicaciones",
      color: "bg-orange-500",
      items: ["Departamentos", "Provincias", "Distritos", "Zonas de cobertura"],
    },
    {
      id: "usuarios",
      titulo: "Usuarios",
      descripcion:
        "Gestión de usuarios del sistema, roles y permisos de acceso",
      icono: Users,
      href: "/dashboard/configuracion/usuarios",
      color: "bg-purple-500",
      items: [
        "Usuarios del sistema",
        "Roles y permisos",
        "Control de acceso",
        "Gestión de sesiones",
      ],
    },
    {
      id: "notificaciones",
      titulo: "Notificaciones",
      descripcion:
        "Configuración de canales de notificación, plantillas y gestión de notificaciones",
      icono: Bell,
      href: "/dashboard/configuracion/notificaciones",
      color: "bg-pink-500",
      items: [
        "Canales de notificación",
        "Notificaciones automáticas",
        "Plantillas de mensajes",
        "Historial de notificaciones",
      ],
    },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configuración del Sistema</h1>
      </div>
      <p className="text-muted-foreground">
        Administra todos los aspectos de configuración del sistema desde un solo
        lugar.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {configuraciones.map((seccion) => {
          const IconoComponente = seccion.icono;
          return (
            <Card
              key={seccion.id}
              className="group hover:shadow-lg transition-all duration-200"
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${seccion.color} text-white`}>
                    <IconoComponente className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{seccion.titulo}</CardTitle>
                    <CardDescription className="mt-1">
                      {seccion.descripcion}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Incluye:
                  </h4>
                  <ul className="space-y-1">
                    {seccion.items.map((item, index) => (
                      <li
                        key={index}
                        className="text-sm flex items-center space-x-2"
                      >
                        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={seccion.href}>
                  <Button className="w-full group-hover:bg-primary/90 transition-colors">
                    Configurar
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Información adicional */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Información del Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Estado del Sistema</h4>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Operativo</span>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Versión</h4>
              <span className="text-muted-foreground">
                {empresaConfig.nombre || "Sistema de Gestión"} v1.0.0
              </span>
            </div>
            <div>
              <h4 className="font-medium mb-2">Última Actualización</h4>
              <span className="text-muted-foreground">
                {new Date().toLocaleDateString("es-PE")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
