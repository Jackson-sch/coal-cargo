import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

export default function Remitente({ envio }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" /> Remitente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">
            Nombre:
          </span>
          <span className="font-medium text-xs sm:text-sm capitalize">
            {envio?.cliente?.tipoDocumento === "RUC"
              ? envio?.cliente?.razonSocial || "No especificado"
              : envio.remitenteNombre ||
                envio?.cliente?.nombre ||
                "No especificado"}
          </span>
        </div>
        {/* Mostrar documento del remitente directo o del cliente */}
        {envio.remitenteTipoDocumento && envio.remitenteNumeroDocumento ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs sm:text-sm">
              Documento:
            </span>
            <span className="font-medium flex items-center gap-2">
              {envio.remitenteTipoDocumento === "RUC"
                ? `RUC: ${envio.remitenteNumeroDocumento}`
                : `${envio.remitenteTipoDocumento}: ${envio.remitenteNumeroDocumento}`}
            </span>
          </div>
        ) : (
          envio?.cliente?.tipoDocumento &&
          (envio?.cliente?.ruc || envio?.cliente?.numeroDocumento) && (
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs sm:text-sm">
                Documento:
              </span>
              <span className="font-medium flex items-center gap-2 text-xs sm:text-sm">
                {envio?.cliente?.tipoDocumento === "RUC"
                  ? `RUC: ${
                      envio?.cliente?.ruc || envio?.cliente?.numeroDocumento
                    }`
                  : `${envio?.cliente?.tipoDocumento}: ${envio?.cliente?.numeroDocumento}`}
              </span>
            </div>
          )
        )}
        {envio.remitenteTelefono && (
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs sm:text-sm">
              Teléfono:
            </span>
            <span className="font-medium flex items-center gap-2 text-xs sm:text-sm">
              {envio.remitenteTelefono}
            </span>
          </div>
        )}
        {envio.remitenteEmail && (
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs sm:text-sm">
              Email:
            </span>
            <span className="font-medium flex items-center gap-2 text-xs sm:text-sm">
              {envio.remitenteEmail}
            </span>
          </div>
        )}
        {(envio.modalidad === "DOMICILIO_SUCURSAL" ||
          envio.modalidad === "DOMICILIO_DOMICILIO") &&
          envio.remitenteDireccion && (
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs sm:text-sm">
                Dirección:
              </span>
              <span className="font-medium text-xs sm:text-sm">
                {envio.remitenteDireccion}
              </span>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
