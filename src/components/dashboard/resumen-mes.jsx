
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Package, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils/formatters";

export default function ResumenMes({ kpis }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" /> Resumen del Mes
        </CardTitle>
        <CardDescription> Estadísticas del mes actual </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Total Envíos</span>
          </div>
          <span className="font-semibold">{kpis?.enviosMes || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm">Ingresos</span>
          </div>
          <span className="font-semibold">
            {formatCurrency(kpis?.ingresosMes || 0)}
          </span>
        </div>
        {kpis?.enviosMes > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tasa de Entrega</span>
              <span>
                {Math.round(
                  ((kpis.enviosMes -
                    kpis.enviosEnTransito -
                    kpis.enviosRetrasados) /
                    kpis.enviosMes) *
                    100
                )}
                %
              </span>
            </div>
            <Progress
              value={
                ((kpis.enviosMes -
                  kpis.enviosEnTransito -
                  kpis.enviosRetrasados) /
                  kpis.enviosMes) *
                100
              }
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
