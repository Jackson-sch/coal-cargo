import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  TrendingUp,
  DollarSign,
  Users,
  Truck,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { formatSoles } from "@/lib/utils/formatters";

export default function Resumen({ estadisticas }) {
  const data = estadisticas.ingresosPorMes || [];

  const totalIngresos = data.reduce(
    (sum, item) => sum + (item.ingresos || 0),
    0
  );
  const totalEnvios = data.reduce((sum, item) => sum + (item.envios || 0), 0);
  const promedioMensual = data.length > 0 ? totalIngresos / data.length : 0;
  const mesMaximoIngresos =
    data.length > 0
      ? data.reduce((prev, current) =>
          prev.ingresos > current.ingresos ? prev : current
        )
      : null;

  const variacionMensual =
    data.length >= 2
      ? (
          ((data[data.length - 1].ingresos - data[data.length - 2].ingresos) /
            data[data.length - 2].ingresos) *
          100
        ).toFixed(1)
      : 0;

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Envíos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold">
            {totalEnvios.toLocaleString()}
          </div>
          <p
            className={`text-xs ${
              variacionMensual >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {variacionMensual >= 0 ? "+" : ""}
            {variacionMensual}% vs mes anterior
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
          <div className="text-xl md:text-2xl font-bold">
            {formatSoles(totalIngresos || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            En el período seleccionado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Promedio Mensual</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold">
            {formatSoles(promedioMensual)}
          </div>
          <p className="text-xs text-muted-foreground">Promedio mensual de ingresos</p>
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
          <div className="text-xl md:text-2xl font-bold">
            {estadisticas?.resumen?.clientesActivos || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Clientes únicos con envíos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Tránsito</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold">
            {estadisticas?.resumen?.enviosEnTransito || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Envíos en proceso de entrega
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
