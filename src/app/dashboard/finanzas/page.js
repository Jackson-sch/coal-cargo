"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CreditCard,
  TrendingUp,
  BarChart3,
  ArrowRight,
  DollarSign,
  Calendar,
  PieChart,
  Receipt,
} from "lucide-react";
import Link from "next/link";
export default function FinanzasPage() {
  const modulosFinancieros = [
    {
      title: "Facturación",
      description: "Generar y gestionar facturas de envíos",
      icon: FileText,
      href: "/dashboard/facturacion",
      color: "bg-blue-500",
      stats: "Facturación automática y manual",
    },
    {
      title: "Pagos",
      description: "Procesar y rastrear pagos de clientes",
      icon: CreditCard,
      href: "/dashboard/pagos",
      color: "bg-green-500",
      stats: "Múltiples métodos de pago",
    },
    {
      title: "Reportes Financieros",
      description: "Análisis detallado de ingresos y gastos",
      icon: TrendingUp,
      href: "/dashboard/finanzas/reportes",
      color: "bg-purple-500",
      stats: "Reportes en tiempo real",
    },
    {
      title: "Cuentas por Cobrar",
      description: "Gestionar deudas pendientes de clientes",
      icon: BarChart3,
      href: "/dashboard/finanzas/cuentas-cobrar",
      color: "bg-orange-500",
      stats: "Control de cartera",
    },
  ];
  const estadisticasRapidas = [
    {
      title: "Ingresos del Mes",
      value: "S/ 0.00",
      icon: DollarSign,
      color: "text-green-600",
      change: "+0%",
    },
    {
      title: "Facturas Pendientes",
      value: "0",
      icon: FileText,
      color: "text-orange-600",
      change: "0 facturas",
    },
    {
      title: "Pagos Procesados",
      value: "0",
      icon: CreditCard,
      color: "text-blue-600",
      change: "Este mes",
    },
    {
      title: "Cuentas por Cobrar",
      value: "S/ 0.00",
      icon: Receipt,
      color: "text-red-600",
      change: "Pendientes",
    },
  ];
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Centro Financiero
        </h1>
        <p className="text-gray-600">
          Gestiona toda la información financiera y contable del sistema
        </p>
      </div>
      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {estadisticasRapidas.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-100`}>
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Módulos Financieros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {modulosFinancieros.map((modulo) => {
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
                      Acceder a {modulo.title}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Herramientas Financieras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" /> Análisis Financiero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Herramientas avanzadas de análisis financiero y proyecciones
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/dashboard/finanzas/reportes">
                  <Button variant="outline" size="sm" className="w-full">
                    <TrendingUp className="mr-2 h-4 w-4" /> Reportes
                  </Button>
                </Link>
                <Link href="/dashboard/finanzas/graficos">
                  <Button variant="outline" size="sm" className="w-full">
                    <BarChart3 className="mr-2 h-4 w-4" /> Gráficos
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/dashboard/facturacion">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" /> Nueva Factura
                </Button>
              </Link>
              <Link href="/dashboard/pagos">
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="mr-2 h-4 w-4" /> Registrar Pago
                </Button>
              </Link>
              <Link href="/dashboard/finanzas/reportes">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" /> Generar Reporte
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
