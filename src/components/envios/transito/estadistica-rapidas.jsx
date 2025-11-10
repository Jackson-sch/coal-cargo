import StatCard from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Package, MapPin } from "lucide-react";
import { useMemo } from "react";

export default function EstadisticaRapidasTransito({ totalEnvios, envios }) {
  // Calcular estadísticas una sola vez
  const stats = useMemo(() => {
    const enTransito = envios.filter((e) => e.estado === "EN_TRANSITO").length;
    const enAgencias = envios.filter(
      (e) =>
        e.estado === "EN_AGENCIA_ORIGEN" || e.estado === "EN_AGENCIA_DESTINO"
    ).length;
    const enReparto = envios.filter((e) => e.estado === "EN_REPARTO").length;

    return { enTransito, enAgencias, enReparto };
  }, [envios]);

  // Configuración de las tarjetas
  const cards = [
    {
      title: "Total en Tránsito",
      value: totalEnvios,
      description: "Envíos en proceso",
      icon: Truck,
      iconColor: "text-muted-foreground",
    },
    {
      title: "En Tránsito",
      value: stats.enTransito,
      description: "En ruta",
      icon: Truck,
      iconColor: "text-yellow-600",
    },
    {
      title: "En Agencias",
      value: stats.enAgencias,
      description: "En almacén",
      icon: Package,
      iconColor: "text-blue-600",
    },
    {
      title: "En Reparto",
      value: stats.enReparto,
      description: "Para entrega",
      icon: MapPin,
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
