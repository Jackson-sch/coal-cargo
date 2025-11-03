import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, Phone, Mail } from "lucide-react";

export default function ClienteFacturacion({ envio }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5" /> Cliente de Facturación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nombre:</span>
          <span className="font-medium">
            {(() => {
              const cf = envio?.clienteFacturacion;
              const tipo =
                cf?.tipoDocumento || envio?.clienteFacturacionTipoDocumento;
              if (tipo === "RUC") {
                return (
                  cf?.razonSocial ||
                  envio?.clienteFacturacionRazonSocial ||
                  "No especificado"
                );
              }
              return (
                cf?.nombre ||
                envio?.clienteFacturacionNombre ||
                "No especificado"
              );
            })()}
          </span>
        </div>
        {(() => {
          const cf = envio?.clienteFacturacion;
          const tipo =
            cf?.tipoDocumento || envio?.clienteFacturacionTipoDocumento;
          const numero =
            tipo === "RUC"
              ? cf?.ruc ||
                envio?.clienteFacturacionRuc ||
                envio?.clienteFacturacionNumeroDocumento
              : cf?.numeroDocumento || envio?.clienteFacturacionNumeroDocumento;
          return tipo && numero ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Documento:</span>
              <span className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {tipo === "RUC" ? `RUC: ${numero}` : `${tipo}: ${numero}`}
              </span>
            </div>
          ) : null;
        })()}
        {(() => {
          const cf = envio?.clienteFacturacion;
          const telefono = cf?.telefono || envio?.clienteFacturacionTelefono;
          return telefono ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teléfono:</span>
              <span className="font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" /> {telefono}
              </span>
            </div>
          ) : null;
        })()}
        {(() => {
          const cf = envio?.clienteFacturacion;
          const email = cf?.email || envio?.clienteFacturacionEmail;
          return email ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" /> {email}
              </span>
            </div>
          ) : null;
        })()}
        {(() => {
          const cf = envio?.clienteFacturacion;
          const direccion = cf?.direccion || envio?.clienteFacturacionDireccion;
          return direccion ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dirección:</span>
              <span className="font-medium">{direccion}</span>
            </div>
          ) : null;
        })()}
      </CardContent>
    </Card>
  );
}
