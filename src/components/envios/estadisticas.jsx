import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatSoles } from "@/lib/utils/formatters";
import { Calendar, DollarSign, Package, Truck } from "lucide-react";

export default function EstadisticasEnvios({ estadisticas }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Envíos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estadisticas.totalEnvios}</div>
          <p className="text-xs text-muted-foreground">
            Todos los envíos registrados
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Envíos Hoy</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estadisticas.enviosHoy}</div>
          <p className="text-xs text-muted-foreground">Nuevos envíos de hoy</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Tránsito</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {estadisticas.enviosEnTransito ?? 
              (estadisticas.enviosPorEstado?.EN_TRANSITO || 0)}
          </div>
          <p className="text-xs text-muted-foreground">Envíos en camino</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ingresos Mes</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatSoles(estadisticas.ingresosMes)}
          </div>
          <p className="text-xs text-muted-foreground">Facturación mensual</p>
        </CardContent>
      </Card>
    </div>
  );
}
