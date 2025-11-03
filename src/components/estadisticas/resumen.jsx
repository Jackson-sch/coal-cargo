import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  TrendingUp,
  DollarSign,
  Users,
  Truck,
  TrendingDown,
} from "lucide-react";
import { formatSoles } from "@/lib/utils/formatters";

export default function Resumen({ estadisticas }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Envíos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {estadisticas?.resumen?.totalEnvios?.toLocaleString() || "0"}
          </div>
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="inline h-3 w-3 text-green-500" />
            +12% desde el período anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ingresos Totales
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatSoles(estadisticas?.resumen?.ingresosTotales || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="inline h-3 w-3 text-green-500" />
            +8% desde el período anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Clientes Activos
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {estadisticas.resumen.clientesActivos}
          </div>
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="inline h-3 w-3 text-green-500" />
            +5% desde el período anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Tránsito</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {estadisticas.resumen.enviosEnTransito}
          </div>
          <p className="text-xs text-muted-foreground">
            <TrendingDown className="inline h-3 w-3 text-red-500" />
            -3% desde el período anterior
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
