import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Package, Truck, Users } from "lucide-react";
import Link from "next/link";

export default function AccionesRapidas() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
        <CardDescription>
          Accede rápidamente a las funciones más utilizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/envios"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <h4 className="font-semibold">Gestionar Envíos</h4>
              <p className="text-sm text-muted-foreground">
                Crear y administrar envíos
              </p>
            </div>
          </Link>
          <Link
            href="/dashboard/cotizaciones"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <h4 className="font-semibold">Cotizaciones</h4>
              <p className="text-sm text-muted-foreground">Calcular tarifas</p>
            </div>
          </Link>
          <Link
            href="/dashboard/seguimiento"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Truck className="h-8 w-8 text-purple-600" />
            <div>
              <h4 className="font-semibold">Seguimiento</h4>
              <p className="text-sm text-muted-foreground">Rastrear envíos</p>
            </div>
          </Link>
          <Link
            href="/dashboard/clientes"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Users className="h-8 w-8 text-orange-600" />
            <div>
              <h4 className="font-semibold">Clientes</h4>
              <p className="text-sm text-muted-foreground">
                Gestionar clientes
              </p>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
