"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  FileText,
  Undo2,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export default function GestionGuiasPage() {
  const [loading, setLoading] = useState(false);
  const [reporte, setReporte] = useState(null);
  const [migracionResult, setMigracionResult] = useState(null);

  const generarReporte = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/guias/reporte", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Error al generar reporte");
      }

      const data = await response.json();
      setReporte(data);
      toast.success("Reporte generado correctamente");
    } catch (error) {
      toast.error("Error al generar reporte: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const ejecutarMigracion = async () => {
    if (
      !confirm(
        "¿Estás seguro de que quieres migrar todas las guías? Esta acción modificará los números de guía existentes."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/guias/migrar", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Error en la migración");
      }

      const data = await response.json();
      setMigracionResult(data);
      toast.success(
        `Migración completada: ${data.migrados} guías actualizadas`
      );

      // Actualizar reporte después de la migración
      await generarReporte();
    } catch (error) {
      toast.error("Error en la migración: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const revertirMigracion = async () => {
    if (
      !confirm(
        "⚠️ ¿Estás seguro de que quieres revertir la migración? Esto restaurará las guías originales."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/guias/revertir", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Error al revertir migración");
      }

      const data = await response.json();
      toast.success(
        `Reversión completada: ${data.revertidos} guías restauradas`
      );

      // Actualizar reporte después de la reversión
      await generarReporte();
    } catch (error) {
      toast.error("Error al revertir: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Guías</h1>
          <p className="text-muted-foreground">
            Administra y estandariza los números de guía del sistema
          </p>
        </div>
      </div>

      {/* Información del nuevo formato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Formato Estándar de Guías
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <strong>Formato:</strong>{" "}
              <code className="bg-muted px-2 py-1 rounded">
                {"{PREFIJO}-{YYYYMMDD}-{XXXXXX}"}
              </code>
            </div>
            <div>
              <strong>Ejemplo:</strong>{" "}
              <code className="bg-muted px-2 py-1 rounded">
                TRU-20251030-123456
              </code>
            </div>
            <div className="text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>PREFIJO:</strong> 2-3 letras basadas en la sucursal
                  (código, provincia o nombre)
                </li>
                <li>
                  <strong>YYYYMMDD:</strong> Fecha de creación en formato
                  año-mes-día
                </li>
                <li>
                  <strong>XXXXXX:</strong> Número aleatorio de 6 dígitos para
                  unicidad
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generar Reporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Analiza el estado actual de las guías en el sistema
            </p>
            <Button
              onClick={generarReporte}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Generar Reporte
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Migrar Guías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Convierte todas las guías al formato estándar
            </p>
            <Button
              onClick={ejecutarMigracion}
              disabled={loading || !reporte || reporte.incorrectos === 0}
              className="w-full"
              variant={reporte?.incorrectos > 0 ? "default" : "secondary"}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Ejecutar Migración
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Undo2 className="h-5 w-5" />
              Revertir Migración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Restaura las guías originales (solo emergencias)
            </p>
            <Button
              onClick={revertirMigracion}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Undo2 className="h-4 w-4 mr-2" />
              )}
              Revertir
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reporte de estado */}
      {reporte && (
        <Card>
          <CardHeader>
            <CardTitle>Estado Actual de las Guías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {reporte.correctos}
                </div>
                <div className="text-sm text-muted-foreground">
                  Formato Correcto
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {reporte.incorrectos}
                </div>
                <div className="text-sm text-muted-foreground">
                  Formato Incorrecto
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{reporte.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>

            {reporte.patrones && Object.keys(reporte.patrones).length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <h4 className="font-semibold mb-3">
                    Patrones de Guías Incorrectas:
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(reporte.patrones).map(([patron, guias]) => (
                      <div
                        key={patron}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div>
                          <code className="font-mono text-sm">{patron}</code>
                          <div className="text-xs text-muted-foreground mt-1">
                            Ejemplos: {guias.slice(0, 3).join(", ")}
                          </div>
                        </div>
                        <Badge variant="secondary">{guias.length}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resultado de migración */}
      {migracionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resultado de la Migración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">
                  {migracionResult.migrados}
                </div>
                <div className="text-sm text-muted-foreground">Migradas</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">
                  {migracionResult.yaCorrectos}
                </div>
                <div className="text-sm text-muted-foreground">
                  Ya Correctas
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600">
                  {migracionResult.errores}
                </div>
                <div className="text-sm text-muted-foreground">Errores</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{migracionResult.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
