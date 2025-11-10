import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Truck, TrendingUp, MapPin } from "lucide-react";
import { formatSoles } from "@/lib/utils/formatters";

export default function RutasPopulares({ estadisticas }) {
  const rutasPopulares = estadisticas?.rutasPopulares || [];

  const getRankingBadge = (index) => {
    const badges = [
      {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-700 dark:text-yellow-400",
        label: "🥇",
      },
      {
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-700 dark:text-slate-300",
        label: "🥈",
      },
      {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-700 dark:text-orange-400",
        label: "🥉",
      },
    ];
    return (
      badges[index] || {
        bg: "bg-muted",
        text: "text-muted-foreground",
        label: index + 1,
      }
    );
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2 sm:gap-0">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Truck className="h-5 w-5 shrink-0" />
              <span>Rutas Populares</span>
            </CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm">
              Rutas con mayor demanda
            </CardDescription>
          </div>
          <TrendingUp className="h-5 w-5 shrink-0 text-primary/60" />
        </div>
      </CardHeader>

      <CardContent>
        {rutasPopulares.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <MapPin className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              No hay datos de rutas para mostrar en este período
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {rutasPopulares.map((ruta, index) => {
              const badge = getRankingBadge(index);
              return (
                <div
                  key={`${ruta.origen}-${ruta.destino}-${index}`}
                  className="group flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-accent/30 transition-colors"
                >
                  <div
                    className={`shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full ${badge.bg} flex items-center justify-center border border-border/50`}
                  >
                    <span className="text-xs sm:text-sm font-bold">
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="space-y-1.5">
                      <div className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                        <div className="space-y-0.5">
                          <div className="break-words whitespace-normal">
                            {ruta.origen || "Origen no disponible"}
                          </div>
                          <div className="text-muted-foreground text-xs">→</div>
                          <div className="break-words whitespace-normal">
                            {ruta.destino || "Destino no disponible"}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ruta.envios || 0}{" "}
                        {ruta.envios === 1 ? "envío" : "envíos"}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right sm:text-left sm:min-w-[100px]">
                    <p className="font-semibold text-sm text-primary">
                      {formatSoles(ruta?.ingresos || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">ingresos</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
