import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Clock, MapPin, Navigation, AlertCircle } from "lucide-react";
import { formatDateTime } from "@/lib/utils/formatters";
import { estadosEnvioObject } from "@/lib/constants/estados";

export default function Seguimiento({ envio }) {
  console.log(envio);
  if (!envio || !envio.eventos || envio.eventos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="truncate">Seguimiento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-sm text-muted-foreground">
            No hay eventos de seguimiento disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          <span className="truncate">Seguimiento</span>
        </CardTitle>
        <CardDescription>Seguimiento detallado del envío</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {envio.eventos.map((evento, index) => {
            // Determinar si es formato simple o extendido
            const isSimpleFormat = evento.evento !== undefined;
            const estado = isSimpleFormat ? evento.evento : evento.estado;
            const titulo = isSimpleFormat ? evento.evento : evento.estado;

            // Obtener configuración del estado si existe
            const config = estadosEnvioObject[estado];
            const IconComponent = config?.icon || AlertCircle;

            return (
              <div key={evento.id || index} className="flex gap-4">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      config ? config.color || "bg-gray-500" : "bg-primary"
                    }`}
                  >
                    {config ? (
                      <IconComponent className="h-4 w-4" />
                    ) : (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  {index < envio.eventos.length - 1 && (
                    <div className="w-px h-8 bg-border mt-2"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm sm:text-base">
                      {config ? config.label || titulo : titulo}
                    </h4>
                    <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(evento.fechaEvento || evento.createdAt)}
                    </span>
                  </div>

                  {evento.descripcion && (
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                      {evento.descripcion}
                    </p>
                  )}

                  {evento.comentario && (
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                      <strong>Comentario:</strong> {evento.comentario}
                    </p>
                  )}

                  {evento.ubicacion && (
                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3" /> {evento.ubicacion}
                    </p>
                  )}

                  {evento.direccion && (
                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mb-1">
                      <Navigation className="h-3 w-3" /> {evento.direccion}
                    </p>
                  )}

                  {(evento.responsable || evento.nombreResponsable) &&
                    (evento.responsable || evento.nombreResponsable) !==
                      "Sistema" && (
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        <strong>Responsable:</strong>
                        {evento.responsable || evento.nombreResponsable}
                      </p>
                    )}

                  {/* Mostrar archivos adjuntos si existen */}
                  {(evento.fotoUrl || evento.firmaUrl) && (
                    <div className="flex gap-2 mt-2">
                      {evento.fotoUrl && (
                        <a
                          href={evento.fotoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                        >
                          📷 Ver foto
                        </a>
                      )}
                      {evento.firmaUrl && (
                        <a
                          href={evento.firmaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                        >
                          ✍️ Ver firma
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
