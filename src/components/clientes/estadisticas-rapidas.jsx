import StatCard from "@/components/stat-card";
import { useMemo } from "react";
import { Users, Building2, UserPlus } from "lucide-react";

export default function EstadisticasRapidasClientes({
  totalClientes,
  clientes,
  estadisticas = null,
}) {
  const stats = useMemo(() => {
    // Si tenemos estadísticas reales desde la BD, usarlas
    // Si no, calcular basándose en los clientes de la página actual (fallback)
    if (estadisticas) {
      return {
        totalClientes: estadisticas.totalClientes,
        activos: estadisticas.activos,
        inactivos: estadisticas.inactivos,
        empresas: estadisticas.empresas,
        personasNaturales: estadisticas.personasNaturales,
        nuevosEsteMes: estadisticas.nuevosEsteMes,
      };
    }

    // Fallback: calcular desde los clientes de la página actual
    return {
      totalClientes: totalClientes || clientes.length,
      activos: clientes.filter((c) => c.estado === true).length,
      inactivos: clientes.filter((c) => c.estado === false).length,
      empresas: clientes.filter((c) => c.esEmpresa === true).length,
      personasNaturales: clientes.filter((c) => c.esEmpresa === false).length,
      nuevosEsteMes: 0, // No podemos calcular esto sin datos completos
    };
  }, [totalClientes, clientes, estadisticas]);

  const cards = [
    {
      title: "Total Clientes",
      value: stats.totalClientes,
      description: "Total de clientes",
      icon: Users,
      iconColor: "text-muted-foreground",
    },
    {
      title: "Activos",
      value: stats.activos,
      description: "Clientes activos",
      icon: Users,
      iconColor: "text-green-600",
    },
    {
      title: "Inactivos",
      value: stats.inactivos,
      description: "Clientes inactivos",
      icon: Users,
      iconColor: "text-red-600",
    },
    {
      title: estadisticas ? "Empresas" : "Esta Página",
      value: estadisticas ? stats.empresas : clientes.length,
      description: estadisticas
        ? "Clientes empresas"
        : "Clientes en esta página",
      icon: estadisticas ? Building2 : Users,
      iconColor: "text-blue-600",
    },
  ];

  // Si hay estadísticas reales, agregar una tarjeta adicional para "Nuevos este mes"
  if (estadisticas && stats.nuevosEsteMes !== undefined) {
    cards.push({
      title: "Nuevos este mes",
      value: stats.nuevosEsteMes,
      description: "Clientes registrados este mes",
      icon: UserPlus,
      iconColor: "text-purple-600",
    });
  }

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.slice(0, 4).map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
