import { formatSoles } from "@/lib/utils/formatters";
import { CheckCircle, Clock, DollarSign, XCircle } from "lucide-react";
import StatCard from "../stat-card";

export default function PagosResumen({ resumen }) {
  const stats = [
    {
      title: "Total Pagos",
      value: formatSoles(resumen.total || 0),
      icon: DollarSign,
      iconColor: "text-blue-600",
    },
    {
      title: "Confirmados",
      value: resumen.confirmados || 0,
      icon: CheckCircle,
      iconColor: "text-green-600",
    },
    {
      title: "Pendientes",
      value: resumen.pendientes || 0,
      icon: Clock,
      iconColor: "text-orange-600",
    },
    {
      title: "Rechazados",
      value: resumen.rechazados || 0,
      icon: XCircle,
      iconColor: "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          {...stat}
        />
      ))}
    </div>
  );
}
