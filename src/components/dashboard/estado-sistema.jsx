
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Calendar, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";

export default function EstadoSistema({ kpis }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" /> Estado del Sistema
        </CardTitle>
        <CardDescription> Información general del sistema </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">Sistema</span>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            Operativo
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Última Actualización</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {kpis?.fechaActualizacion && formatDate(kpis.fechaActualizacion)}
          </span>
        </div>
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {(
                  ((kpis?.enviosEntregadosHoy || 0) /
                    Math.max(kpis?.enviosHoy || 1, 1)) *
                  100
                ).toFixed(1)}
                %
              </div>
              <div className="text-xs text-muted-foreground">
                Eficiencia Hoy
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {kpis?.enviosMes || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                Envíos del Mes
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
