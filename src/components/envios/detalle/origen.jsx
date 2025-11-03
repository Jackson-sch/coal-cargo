import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function Origen({ envio }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" /> Origen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">Sucursal:</span>
          <span className="font-medium text-xs sm:text-sm capitalize text-start">{envio.sucursal_origen.nombre}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">Provincia:</span>
          <span className="font-medium text-xs sm:text-sm capitalize">{envio.sucursal_origen.provincia}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">Dirección:</span>
          <span className="font-medium text-xs sm:text-sm capitalize">{envio.sucursal_origen.direccion}</span>
        </div>
        {envio.direccionOrigen && (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs sm:text-sm">Dir. Recojo:</span>
              <span className="font-medium text-xs sm:text-sm capitalize">{envio.direccionOrigen}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs sm:text-sm">Contacto:</span>
              <span className="font-medium text-xs sm:text-sm capitalize">{envio.contactoOrigen}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs sm:text-sm">Teléfono:</span>
              <span className="font-medium text-xs sm:text-sm capitalize">{envio.telefonoOrigen}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
