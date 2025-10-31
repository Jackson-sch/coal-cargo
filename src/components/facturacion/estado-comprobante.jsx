"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Download,
  Eye,
  RefreshCw,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const ESTADOS_CONFIG = {
  PENDIENTE: {
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    badgeVariant: "secondary",
    label: "Pendiente",
    description: "Comprobante creado, pendiente de envío",
  },
  ENVIADO: {
    icon: RefreshCw,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    badgeVariant: "default",
    label: "Enviado",
    description: "Enviado a SUNAT, esperando respuesta",
  },
  ACEPTADO: {
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    badgeVariant: "default",
    label: "Aceptado",
    description: "Aceptado por SUNAT",
  },
  RECHAZADO: {
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-200",
    badgeVariant: "destructive",
    label: "Rechazado",
    description: "Rechazado por SUNAT",
  },
  ERROR: {
    icon: AlertTriangle,
    color: "bg-red-100 text-red-800 border-red-200",
    badgeVariant: "destructive",
    label: "Error",
    description: "Error en el procesamiento",
  },
};

export default function EstadoComprobante({
  comprobante,
  showActions = true,
  onReenviar,
  onConsultarEstado,
}) {
  const [descargando, setDescargando] = useState(false);
  const [consultando, setConsultando] = useState(false);

  const estadoConfig =
    ESTADOS_CONFIG[comprobante.estado] || ESTADOS_CONFIG.PENDIENTE;
  const IconoEstado = estadoConfig.icon;

  const handleDescargarPDF = async () => {
    if (!comprobante.urlPdf && !comprobante.pdfUrl) {
      toast.error("PDF no disponible");
      return;
    }

    setDescargando(true);
    try {
      // Crear un enlace temporal para descargar
      const link = document.createElement("a");
      link.href = comprobante.urlPdf || comprobante.pdfUrl;
      link.download = `${comprobante.tipoComprobante}-${comprobante.serie}-${comprobante.numero}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Descarga iniciada");
    } catch (error) {
      console.error("Error al descargar PDF:", error);
      toast.error("Error al descargar el PDF");
    } finally {
      setDescargando(false);
    }
  };

  const handleConsultarEstado = async () => {
    if (!onConsultarEstado) return;

    setConsultando(true);
    try {
      await onConsultarEstado(comprobante.id);
    } catch (error) {
      console.error("Error al consultar estado:", error);
      toast.error("Error al consultar estado");
    } finally {
      setConsultando(false);
    }
  };

  const handleReenviar = async () => {
    if (!onReenviar) return;

    try {
      await onReenviar(comprobante.id);
    } catch (error) {
      console.error("Error al reenviar:", error);
      toast.error("Error al reenviar comprobante");
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${estadoConfig.color}`}>
              <IconoEstado className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={estadoConfig.badgeVariant}>
                  {estadoConfig.label}
                </Badge>
                <span className="text-sm font-medium">
                  {comprobante.numeroCompleto}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {estadoConfig.description}
              </p>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-2">
              {/* Botón de consultar estado */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleConsultarEstado}
                disabled={consultando}
                className="h-8 w-8 p-0"
              >
                {consultando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>

              {/* Botón de descargar PDF */}
              {(comprobante.urlPdf || comprobante.pdfUrl) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDescargarPDF}
                  disabled={descargando}
                  className="h-8 w-8 p-0"
                >
                  {descargando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              )}

              {/* Botón de reenviar (solo para estados de error) */}
              {(comprobante.estado === "RECHAZADO" ||
                comprobante.estado === "ERROR") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReenviar}
                  className="h-8 px-3"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reenviar
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Información adicional para estados de error */}
        {(comprobante.estado === "RECHAZADO" ||
          comprobante.estado === "ERROR") &&
          comprobante.mensajeError && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <strong>Error:</strong> {comprobante.mensajeError}
            </div>
          )}
      </CardContent>
    </Card>
  );
}
