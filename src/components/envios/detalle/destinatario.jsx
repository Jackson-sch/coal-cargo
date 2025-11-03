import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

export default function Destinatario({ envio }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" /> Destinatario
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nombre:</span>
          <span className="font-medium text-xs sm:text-sm capitalize">
            {envio.destinatarioNombre || "No especificado"}
          </span>
        </div>
        {envio?.destinatarioTipoDocumento &&
          envio?.destinatarioNumeroDocumento && (
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs sm:text-sm">Documento:</span>
              <span className="font-medium flex items-center gap-2 text-xs sm:text-sm">
                {envio?.destinatarioTipoDocumento === "RUC"
                  ? `RUC: ${envio?.destinatarioNumeroDocumento}`
                  : `${envio?.destinatarioTipoDocumento}: ${envio?.destinatarioNumeroDocumento}`}
              </span>
            </div>
          )}
        {envio.destinatarioTelefono && (
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs sm:text-sm">Teléfono:</span>
            <span className="font-medium flex items-center gap-2 text-xs sm:text-sm">
              {envio.destinatarioTelefono}
            </span>
          </div>
        )}
        {envio.destinatarioEmail && (
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs sm:text-sm">Email:</span>
            <span className="font-medium flex items-center gap-2 text-xs sm:text-sm">
              {envio.destinatarioEmail}
            </span>
          </div>
        )}
        {(envio.modalidad === "SUCURSAL_DOMICILIO" ||
          envio.modalidad === "DOMICILIO_DOMICILIO") &&
          envio.destinatarioDireccion && (
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs sm:text-sm">Dirección:</span>
              <span className="font-medium text-xs sm:text-sm">{envio.destinatarioDireccion}</span>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
