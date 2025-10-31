"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, X, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function ModalErrorComprobante({
  isOpen,
  onClose,
  comprobante,
  onReenviar,
}) {
  if (!comprobante) return null;

  const copiarError = () => {
    const textoError = `
Comprobante: ${comprobante.numeroCompleto}
Tipo: ${comprobante.tipoComprobante}
Cliente: ${comprobante.nombreCliente}
Fecha: ${new Date(comprobante.fechaEmision).toLocaleDateString()}
Código de Error: ${comprobante.codigoError || "N/A"}
Mensaje: ${comprobante.mensajeError || "Error no especificado"}
    `.trim();

    navigator.clipboard.writeText(textoError);
    toast.success("Información del error copiada al portapapeles");
  };

  const handleReenviar = () => {
    onReenviar?.(comprobante.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Detalle del Error - {comprobante.numeroCompleto}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información del Comprobante */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Información del Comprobante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Número:
                  </span>
                  <p className="font-mono">{comprobante.numeroCompleto}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Tipo:
                  </span>
                  <p>{comprobante.tipoComprobante}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Cliente:
                  </span>
                  <p>{comprobante.nombreCliente}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Fecha:
                  </span>
                  <p>
                    {new Date(comprobante.fechaEmision).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Total:
                  </span>
                  <p>S/ {comprobante.total?.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Estado:
                  </span>
                  <Badge variant="destructive">{comprobante.estado}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Error */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-red-600">
                Detalles del Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {comprobante.codigoError && (
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Código de Error:
                  </span>
                  <p className="font-mono text-red-600 bg-red-50 p-2 rounded">
                    {comprobante.codigoError}
                  </p>
                </div>
              )}

              <div>
                <span className="text-sm font-medium text-gray-500">
                  Mensaje de Error:
                </span>
                <p className="text-red-600 bg-red-50 p-3 rounded border-l-4 border-red-400">
                  {comprobante.mensajeError || "Error no especificado"}
                </p>
              </div>

              {comprobante.pseResponse && (
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Respuesta del PSE:
                  </span>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-32">
                    {typeof comprobante.pseResponse === "string"
                      ? comprobante.pseResponse
                      : JSON.stringify(comprobante.pseResponse, null, 2)}
                  </pre>
                </div>
              )}

              {/* Información adicional si está disponible */}
              {comprobante.xmlContent && (
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Contenido XML:
                  </span>
                  <div className="bg-gray-50 p-3 rounded max-h-32 overflow-auto">
                    <code className="text-xs">
                      {comprobante.xmlContent.substring(0, 500)}...
                    </code>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recomendaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-blue-600">
                Recomendaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>• Verifique que los datos del comprobante sean correctos</p>
                <p>
                  • Asegúrese de que el RUC del cliente esté activo en SUNAT
                </p>
                <p>
                  • Revise que los montos y cálculos de impuestos sean correctos
                </p>
                <p>• Si el error persiste, contacte al soporte técnico</p>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={copiarError}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar Información
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button
                onClick={handleReenviar}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reenviar Comprobante
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
