import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users } from "lucide-react";
import { formatSoles } from "@/lib/utils/formatters";

export default function TopClientes({ estadisticas }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Top Clientes
        </CardTitle>
        <CardDescription>Clientes con mayor volumen de envíos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {estadisticas.topClientes.map((cliente, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium">{cliente.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {cliente.envios} envíos
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatSoles(cliente?.ingresos || 0)}
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
