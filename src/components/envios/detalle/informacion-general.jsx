import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils/formatters";

export default function InformacionGeneral({
  envio,
  modalidades,
  getEstadoBadge,
}) {
  // Función para obtener el color según el progreso
  const getProgressColor = (progreso) => {
    if (progreso >= 100) return "bg-green-500";
    if (progreso >= 75) return "bg-green-400";
    if (progreso >= 50) return "bg-blue-500";
    if (progreso >= 25) return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Información General</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progreso */}
        {envio.progreso !== undefined && (
          <div className="space-y-2 pb-3 border-b">
            <div className="flex justify-between text-sm">
              <span>Progreso del envío</span>
              <span>{envio.progreso}%</span>
            </div>
            <Progress
              value={envio.progreso}
              className="h-2"
              indicatorClassName={getProgressColor(envio.progreso)}
            />
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">
            Número de Guía:
          </span>
          <span className="font-medium text-xs sm:text-sm">
            {envio.numeroGuia}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">
            Estado:
          </span>
          {getEstadoBadge(envio.estado)}
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">
            Tipo de Servicio:
          </span>
          <span className="font-medium text-xs sm:text-sm">
            {envio.tipoServicio}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">
            Modalidad:
          </span>
          <span className="font-medium text-xs sm:text-sm">
            {modalidades.find((m) => m.value === envio.modalidad)?.label}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs sm:text-sm">
            Fecha de Registro:
          </span>
          <span className="font-medium text-xs sm:text-sm">
            {envio.fechaRegistro
              ? formatDate(envio.fechaRegistro)
              : envio.createdAt
              ? formatDate(envio.createdAt)
              : "N/A"}
          </span>
        </div>
        {envio.fechaEntrega && (
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs sm:text-sm">
              Fecha de Entrega:
            </span>
            <span className="font-medium text-xs sm:text-sm">
              {formatDate(envio.fechaEntrega)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
