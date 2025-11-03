import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, CheckCircle, Clock } from "lucide-react";
import { formatSoles } from "@/lib/utils/formatters";

export default function KPIsReportes({
  total,
  entregadosPagina,
  pendientesPagina,
  totalPagina,
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total resultados
          </CardTitle>
          <Package className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground">Envíos según filtros</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Entregados (página)
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {entregadosPagina}
          </div>
          <p className="text-xs text-muted-foreground">
            Cantidad en esta página
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pendientes (página)
          </CardTitle>
          <Clock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {pendientesPagina}
          </div>
          <p className="text-xs text-muted-foreground">
            Cantidad en esta página
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total (página)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatSoles(totalPagina)}</div>
          <p className="text-xs text-muted-foreground">Suma de esta página</p>
        </CardContent>
      </Card>
    </div>
  );
}
