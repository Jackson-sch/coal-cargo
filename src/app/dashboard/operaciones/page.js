"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Truck,
  Eye,
  UserCheck,
  ArrowRight,
  Package,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
export default function OperacionesPage() {
  const operaciones = [
    {
      title: "Cotizaciones",
      description: "Crear y gestionar cotizaciones de envío",
      icon: Calculator,
      href: "/dashboard/cotizaciones",
      color: "bg-blue-500",
      stats: "Sistema avanzado con tarifas por destino",
    },
    {
      title: "Envíos",
      description: "Administrar todos los envíos del sistema",
      icon: Truck,
      href: "/dashboard/envios",
      color: "bg-green-500",
      stats: "Gestión completa del ciclo de vida",
    },
    {
      title: "En Tránsito",
      description: "Envíos actualmente en camino",
      icon: Truck,
      href: "/dashboard/envios/transito",
      color: "bg-yellow-500",
      stats: "Seguimiento en tiempo real",
    },
    {
      title: "Entregados",
      description: "Envíos completados exitosamente",
      icon: UserCheck,
      href: "/dashboard/envios/entregados",
      color: "bg-green-600",
      stats: "Historial de entregas",
    },
    {
      title: "Seguimiento",
      description: "Rastrear envíos en tiempo real",
      icon: Eye,
      href: "/dashboard/seguimiento",
      color: "bg-purple-500",
      stats: "Seguimiento público y privado",
    },
  ];
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Centro de Operaciones
        </h1>
        <p className="text-gray-600">
          Gestiona todo el flujo operativo desde cotización hasta entrega
        </p>
      </div>
      {/* Flujo de Proceso */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Flujo de Proceso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-600">
              <Calculator className="h-5 w-5" />
              <span className="font-medium">Cotización</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className="flex items-center gap-2 text-green-600">
              <Package className="h-5 w-5" />
              <span className="font-medium">Envío</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className="flex items-center gap-2 text-purple-600">
              <Eye className="h-5 w-5" />
              <span className="font-medium">Seguimiento</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className="flex items-center gap-2 text-orange-600">
              <UserCheck className="h-5 w-5" />
              <span className="font-medium">Entrega</span>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Grid de Operaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {operaciones.map((operacion) => {
          const IconComponent = operacion.icon;
          return (
            <Card
              key={operacion.title}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-lg ${operacion.color} text-white`}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {operacion.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {operacion.description}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">{operacion.stats}</p>
                  <Link href={operacion.href}>
                    <Button className="w-full">
                      Acceder a {operacion.title}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Accesos Rápidos */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Accesos Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/cotizaciones">
              <Button variant="outline" className="w-full">
                <Calculator className="mr-2 h-4 w-4" /> Nueva Cotización
              </Button>
            </Link>
            <Link href="/dashboard/envios">
              <Button variant="outline" className="w-full">
                <Truck className="mr-2 h-4 w-4" /> Ver Envíos
              </Button>
            </Link>
            <Link href="/dashboard/seguimiento">
              <Button variant="outline" className="w-full">
                <Eye className="mr-2 h-4 w-4" /> Rastrear Envío
              </Button>
            </Link>
            <Link href="/dashboard/envios/entregados">
              <Button variant="outline" className="w-full">
                <UserCheck className="mr-2 h-4 w-4" /> Ver Entregados
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
