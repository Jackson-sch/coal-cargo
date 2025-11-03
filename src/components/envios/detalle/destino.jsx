import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function Destino({ envio }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" /> Destino
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">
            Sucursal:
          </span>
          <span className="font-medium  text-xs sm:text-sm">
            {envio.sucursal_destino.nombre}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground  text-xs sm:text-sm">
            Provincia:
          </span>
          <span className="font-medium  text-xs sm:text-sm">
            {envio.sucursal_destino.provincia}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground  text-xs sm:text-sm">
            Dirección:
          </span>
          <span className="font-medium  text-xs sm:text-sm ">
            {envio.sucursal_destino.direccion}
          </span>
        </div>
        {envio.direccionDestino && (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground  text-xs sm:text-sm">
                Dir. Entrega:
              </span>
              <span className="font-medium  text-xs sm:text-sm">
                {envio.direccionDestino}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground  text-xs sm:text-sm">
                Contacto:
              </span>
              <span className="font-medium  text-xs sm:text-sm">
                {envio.contactoDestino}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground  text-xs sm:text-sm">
                Teléfono:
              </span>
              <span className="font-medium  text-xs sm:text-sm">
                {envio.telefonoDestino}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
