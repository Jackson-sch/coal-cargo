import StatCard from "@/components/stat-card";
import { useMemo } from "react";
import { Calendar, CheckCircle, Clock, TrendingUp } from "lucide-react";

export default function EstadisticaRapidasEntregados({ estadisticas }) {
  // Calcular estadísticas una sola vez
  const stats = useMemo(() => {
    return estadisticas;
  }, [estadisticas]);

  // Configuración de las tarjetas
  const cards = [
    {
      title: "Total Entregados",
      value: estadisticas.totalEntregados,
      description: "Envíos entregados",
      icon: CheckCircle,
      iconColor: "text-green-600",
    },
    {
      title: "Entregados Hoy",
      value: estadisticas.entregadosHoy,
      description: "Envíos entregados hoy",
      icon: Calendar,
      iconColor: "text-blue-600",
    },
    {
      title: "Entregados Esta Semana",
      value: estadisticas.entregadosSemana,
      description: "Envíos entregados esta semana",
      icon: TrendingUp,
      iconColor: "text-purple-600",
    },
    {
      title: "Tiempo Promedio de Entrega",
      value: estadisticas.tiempoPromedioEntrega,
      description: "Tiempo promedio de entrega",
      icon: Clock,
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  );
}
