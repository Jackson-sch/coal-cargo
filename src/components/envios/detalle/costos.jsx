import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { formatSoles } from "@/lib/utils/formatters";

export default function Costos({ envio }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" /> Costos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">Subtotal:</span>
          <span className="font-medium text-xs sm:text-sm">{formatSoles(envio.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">IGV:</span>
          <span className="font-medium text-xs sm:text-sm">{formatSoles(envio.igv)}</span>
        </div>
        <hr />
        <div className="flex justify-between font-bold text-lg">
          <span className="text-xs sm:text-sm">Total:</span>
          <span className="font-medium text-xs sm:text-sm">{formatSoles(envio.precio)}</span>
        </div>
        {envio.tiempoEstimado && (
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs sm:text-sm">Tiempo Estimado:</span>
            <span className="font-medium text-xs sm:text-sm">{envio.tiempoEstimado}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
