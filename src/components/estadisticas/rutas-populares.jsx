import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Truck } from "lucide-react";
import { formatSoles } from "@/lib/utils/formatters";

export default function RutasPopulares({ estadisticas }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Rutas Populares
        </CardTitle>
        <CardDescription>Rutas con mayor demanda</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {estadisticas.rutasPopulares.map((ruta, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium">
                    {ruta.origen} → {ruta.destino}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {ruta.envios} envíos
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatSoles(ruta?.ingresos || 0)}
                </p>
                <p className="text-sm text-muted-foreground">ingresos</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
