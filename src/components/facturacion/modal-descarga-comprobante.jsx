"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Printer,
  FileText,
  File,
  CheckCircle,
  ExternalLink,
  Copy,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function ModalDescargaComprobante({
  isOpen,
  onClose,
  comprobante,
}) {
  const [descargando, setDescargando] = useState({});

  if (!comprobante) return null;

  const descargarArchivo = async (url, nombreArchivo, tipo) => {
    // Si es un PDF/XML/CDR de comprobante aceptado con pseId, usar el endpoint API de Next.js
    if (
      (tipo === "PDF" || tipo === "XML" || tipo === "CDR") &&
      comprobante.estado === "ACEPTADO" &&
      comprobante.pseId
    ) {
      setDescargando((prev) => ({ ...prev, [tipo]: true }));

      try {
        const endpoint =
          tipo === "PDF" ? "pdf" : tipo === "XML" ? "xml" : "cdr";
        const response = await fetch(
          `/api/facturas/${comprobante.id}/${endpoint}`
        );

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = urlBlob;
        const ext = tipo === "PDF" ? "pdf" : tipo === "XML" ? "xml" : "zip";
        link.download = `${comprobante.numeroCompleto}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(urlBlob);

        toast.success(`${tipo} descargado correctamente`);
        return;
      } catch (error) {
        console.error(`Error al descargar ${tipo}:`, error);
        toast.error(`Error al descargar ${tipo}: ${error.message}`);
      } finally {
        setDescargando((prev) => ({ ...prev, [tipo]: false }));
      }
    }

    // Descarga directa para URLs disponibles
    if (url) {
      setDescargando((prev) => ({ ...prev, [tipo]: true }));

      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = nombreArchivo;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`${tipo} descargado correctamente`);
      } catch (error) {
        console.error(`Error al descargar ${tipo}:`, error);
        toast.error(`Error al descargar ${tipo}`);
      } finally {
        setDescargando((prev) => ({ ...prev, [tipo]: false }));
      }
    } else {
      toast.error(`${tipo} no disponible`);
    }
  };

  const copiarInformacion = () => {
    const info = `
Comprobante: ${comprobante.numeroCompleto}
Tipo: ${comprobante.tipoComprobante}
Cliente: ${comprobante.nombreCliente}
Fecha: ${new Date(comprobante.fechaEmision).toLocaleDateString()}
Total: S/ ${comprobante.total?.toFixed(2)}
Estado: ${comprobante.estado}
    `.trim();

    navigator.clipboard.writeText(info);
    toast.success("Información copiada al portapapeles");
  };

  const archivosDisponibles = [
    {
      tipo: "PDF",
      nombre: "Comprobante PDF",
      descripcion: "Representación impresa del comprobante",
      icono: FileText,
      url: comprobante.pdfUrl || comprobante.urlPdf,
      disponible:
        !!(comprobante.pdfUrl || comprobante.urlPdf) ||
        (comprobante.estado === "ACEPTADO" && comprobante.pseId),
      color: "text-red-600",
    },
    {
      tipo: "XML",
      nombre: "Archivo XML",
      descripcion: "Estructura de datos del comprobante",
      icono: File,
      url: comprobante.xmlUrl,
      disponible:
        !!comprobante.xmlUrl ||
        (comprobante.estado === "ACEPTADO" && comprobante.pseId),
      color: "text-green-600",
    },
    {
      tipo: "CDR",
      nombre: "Constancia de Recepción",
      descripcion: "Respuesta de SUNAT (CDR)",
      icono: CheckCircle,
      url: comprobante.cdrUrl,
      disponible:
        !!comprobante.cdrUrl ||
        (comprobante.estado === "ACEPTADO" && comprobante.pseId),
      color: "text-blue-600",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Descargar Comprobante - {comprobante.numeroCompleto}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del comprobante */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Información del Comprobante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">
                    Número:
                  </span>
                  <p className="font-mono">{comprobante.numeroCompleto}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Tipo:
                  </span>
                  <p>{comprobante.tipoComprobante}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Cliente:
                  </span>
                  <p>{comprobante.nombreCliente}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Fecha:
                  </span>
                  <p>
                    {new Date(comprobante.fechaEmision).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Total:
                  </span>
                  <p className="font-semibold">
                    S/ {comprobante.total?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Estado:
                  </span>
                  <Badge
                    variant={
                      comprobante.estado === "ACEPTADO"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {comprobante.estado}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Archivos disponibles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Archivos Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {archivosDisponibles.map((archivo) => {
                  const Icono = archivo.icono;
                  const estaDescargando = descargando[archivo.tipo];

                  return (
                    <div
                      key={archivo.tipo}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Icono className={`h-5 w-5 ${archivo.color}`} />
                        <div>
                          <p className="font-medium text-sm">
                            {archivo.nombre}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {archivo.descripcion}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {archivo.disponible ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              descargarArchivo(
                                archivo.url,
                                `${
                                  comprobante.numeroCompleto
                                }.${archivo.tipo.toLowerCase()}`,
                                archivo.tipo
                              )
                            }
                            disabled={estaDescargando}
                            className="flex items-center gap-2"
                          >
                            {estaDescargando ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            {estaDescargando ? "Descargando..." : "Descargar"}
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs">No disponible</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={copiarInformacion}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar Información
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              {comprobante.estado === "ACEPTADO" && (
                <Button
                  onClick={() => window.print()}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
