"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, TrendingUp } from "lucide-react";
import { formatSoles } from "@/lib/utils/formatters";

export default function TopClientes({ estadisticas }) {
  const topClientes = estadisticas?.topClientes || [];

  const totalClientes = topClientes.length;
  const totalIngresos = topClientes.reduce(
    (sum, cliente) => sum + (cliente.ingresos || 0),
    0
  );
  const totalEnvios = topClientes.reduce(
    (sum, cliente) => sum + (cliente.envios || 0),
    0
  );
  const promedioIngresos =
    totalClientes > 0 ? totalIngresos / totalClientes : 0;

  const getMedalColor = (index) => {
    switch (index) {
      case 0:
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case 1:
        return "bg-slate-400/10 text-slate-700 dark:text-slate-300";
      case 2:
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  const getMedalIcon = (index) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return index + 1;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Users className="h-5 w-5" />
          Top Clientes
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Clientes con mayor volumen de envíos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topClientes.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No hay datos de clientes para mostrar en este período
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {topClientes.map((cliente, index) => (
              <div
                key={`${cliente.nombre}-${index}`}
                className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
              >
                {/* Información principal - visible en todas las pantallas */}
                <div className="flex items-start gap-3 min-w-0 mb-3 md:mb-0">
                  <div
                    className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base ${getMedalColor(
                      index
                    )}`}
                  >
                    {getMedalIcon(index)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm md:text-base truncate">
                      {cliente.nombre || "Cliente sin nombre"}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {cliente.envios || 0}{" "}
                      {cliente.envios === 1 ? "envío" : "envíos"}
                    </p>
                  </div>
                </div>

                {/* Información de ingresos - adapta tamaño en móvil */}
                <div className="flex items-center justify-between md:flex-col md:text-right gap-4 md:gap-0">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm md:text-base text-primary">
                        {formatSoles(cliente?.ingresos || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground hidden md:block">
                        ingresos
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
