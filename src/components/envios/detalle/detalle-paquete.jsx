import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { formatSoles } from "@/lib/utils/formatters";

export default function DetallePaquete({ envio }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" /> Detalles del Paquete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground  text-xs sm:text-sm">
            Peso:
          </span>
          <span className="font-medium  text-xs sm:text-sm">
            {envio.peso} kg
          </span>
        </div>
        {envio.pesoVolumetrico > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground  text-xs sm:text-sm">
              Peso Volumétrico:
            </span>
            <span className="font-medium  text-xs sm:text-sm">
              {envio.pesoVolumetrico} kg
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground  text-xs sm:text-sm">
            Peso Facturado:
          </span>
          <span className="font-medium  text-xs sm:text-sm">
            {envio.pesoFacturado} kg
          </span>
        </div>
        {(envio.largo || envio.ancho || envio.alto) && (
          <div className="flex justify-between">
            <span className="text-muted-foreground  text-xs sm:text-sm">
              Dimensiones:
            </span>
            <span className="font-medium  text-xs sm:text-sm">
              {envio.largo} x {envio.ancho} x{envio.alto} cm
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground  text-xs sm:text-sm">
            Descripción:
          </span>
          <span className="font-medium  text-xs sm:text-sm">
            {envio.descripcion}
          </span>
        </div>
        {envio.valorDeclarado && (
          <div className="flex justify-between">
            <span className="text-muted-foreground  text-xs sm:text-sm">
              Valor Declarado:
            </span>
            <span className="font-medium  text-xs sm:text-sm">
              {formatSoles(envio.valorDeclarado)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
