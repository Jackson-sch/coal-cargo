import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/formatters";

export default function InformacionGeneral({
  envio,
  modalidades,
  getEstadoBadge,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Información General</CardTitle>
      </CardHeader>
            <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">Número de Guía:</span>
          <span className="font-medium text-xs sm:text-sm">{envio.numeroGuia}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">Estado:</span>
          {getEstadoBadge(envio.estado)}
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">Tipo de Servicio:</span>
          <span className="font-medium text-xs sm:text-sm">{envio.tipoServicio}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">Modalidad:</span>
          <span className="font-medium text-xs sm:text-sm">
            {modalidades.find((m) => m.value === envio.modalidad)?.label}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">Fecha de Creación:</span>
          <span className="font-medium text-xs sm:text-sm">{formatDate(envio.createdAt)}</span>
        </div>
        {envio.fechaEntrega && (
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs sm:text-sm">Fecha de Entrega:</span>
            <span className="font-medium text-xs sm:text-sm">
              {formatDate(envio.fechaEntrega)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
