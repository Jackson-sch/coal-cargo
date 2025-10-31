"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  DollarSign,
  Route,
  MapPin,
  Users,
  ArrowRight,
  Settings,
  Shield,
  Database,
} from "lucide-react";
import Link from "next/link";
export default function AdministracionPage() {
  const modulos = [
    {
      title: "Sucursales",
      description: "Gestionar sucursales y ubicaciones",
      icon: Building2,
      href: "/dashboard/sucursales",
      color: "bg-blue-500",
      stats: "Red de distribución nacional",
    },
    {
      title: "Tarifas",
      description: "Configurar precios y tarifas de envío",
      icon: DollarSign,
      href: "/dashboard/configuracion/tarifas",
      color: "bg-green-500",
      stats: "Sistema de precios dinámico",
    },
    {
      title: "Rutas",
      description: "Planificar y optimizar rutas de entrega",
      icon: Route,
      href: "/dashboard/rutas",
      color: "bg-purple-500",
      stats: "Optimización de recorridos",
    },
    {
      title: "Ubicaciones",
      description: "Administrar departamentos, provincias y distritos",
      icon: MapPin,
      href: "/dashboard/configuracion/ubicaciones",
      color: "bg-orange-500",
      stats: "Base de datos geográfica",
    },
    {
      title: "Usuarios",
      description: "Gestionar usuarios y permisos del sistema",
      icon: Users,
      href: "/dashboard/configuracion/usuarios",
      color: "bg-red-500",
      stats: "Control de acceso y roles",
    },
  ];
  const configuracionRapida = [
    {
      title: "Configuración General",
      description: "Ajustes básicos del sistema",
      icon: Settings,
      href: "/dashboard/configuracion",
    },
    {
      title: "Seguridad",
      description: "Configurar políticas de seguridad",
      icon: Shield,
      href: "/dashboard/configuracion/seguridad",
    },
    {
      title: "Base de Datos",
      description: "Mantenimiento y respaldos",
      icon: Database,
      href: "/dashboard/configuracion/database",
    },
  ];
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Panel de Administración
        </h1>
        <p className="text-gray-600">
          Configura y administra todos los aspectos del sistema
        </p>
      </div>
      {/* Módulos Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {modulos.map((modulo) => {
          const IconComponent = modulo.icon;
          return (
            <Card
              key={modulo.title}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${modulo.color} text-white`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{modulo.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {modulo.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">{modulo.stats}</p>
                  <Link href={modulo.href}>
                    <Button className="w-full">
                      Administrar {modulo.title}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Configuración Rápida */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {configuracionRapida.map((config) => {
              const IconComponent = config.icon;
              return (
                <Link key={config.title} href={config.href}>
                  <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5 text-gray-600" />
                        <div>
                          <h3 className="font-medium">{config.title}</h3>
                          <p className="text-sm text-gray-500">
                            {config.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* Accesos Rápidos */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link href="/dashboard/sucursales">
              <Button variant="outline" className="w-full">
                <Building2 className="mr-2 h-4 w-4" /> Gestionar Sucursales
              </Button>
            </Link>
            <Link href="/dashboard/configuracion/tarifas">
              <Button variant="outline" className="w-full">
                <DollarSign className="mr-2 h-4 w-4" /> Configurar Tarifas
              </Button>
            </Link>
            <Link href="/dashboard/rutas">
              <Button variant="outline" className="w-full">
                <Route className="mr-2 h-4 w-4" /> Planificar Ruta
              </Button>
            </Link>
            <Link href="/dashboard/configuracion/usuarios">
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" /> Gestionar Usuarios
              </Button>
            </Link>
            <Link href="/dashboard/configuracion">
              <Button variant="outline" className="w-full">
                <Settings className="mr-2 h-4 w-4" /> Configuración
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
