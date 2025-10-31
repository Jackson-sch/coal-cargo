"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Receipt,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Calendar,
  DollarSign,
  Package,
} from "lucide-react";
import { toast } from "sonner";
// Importar componentes de comprobantes electrónicos
import ListaComprobantes from "@/components/facturacion/lista-comprobantes";
import ModalEmitirComprobante from "@/components/facturacion/modal-emitir-comprobante";
import EnviosPendientes from "@/components/facturacion/envios-pendientes";
import { obtenerEstadisticasFacturacion } from "@/lib/actions/comprobantes";

export default function FacturacionPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showModalEmitir, setShowModalEmitir] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    totalComprobantes: 0,
    totalFacturado: 0,
    comprobantesPendientes: 0,
    comprobantesAceptados: 0,
    comprobantesRechazados: 0,
    facturacionMensual: 0,
    crecimientoMensual: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const resultado = await obtenerEstadisticasFacturacion();
      if (resultado.success) {
        setEstadisticas(resultado.data);
      } else {
        toast.error("Error al cargar estadísticas");
      }
    } catch (error) {
      toast.error("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const handleEmitirComprobante = () => {
    setShowModalEmitir(true);
  };

  const handleComprobanteEmitido = () => {
    setShowModalEmitir(false);
    cargarEstadisticas();
    toast.success("Comprobante emitido correctamente");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
          <p className="text-muted-foreground">
            Gestiona comprobantes electrónicos y facturación
          </p>
        </div>
        <Button onClick={handleEmitirComprobante} className="gap-2">
          <Plus className="h-4 w-4" />
          Emitir Comprobante
        </Button>
      </div>

      {/* Estadísticas Dashboard */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Comprobantes
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {estadisticas.totalComprobantes}
              </div>
              <p className="text-xs text-muted-foreground">
                Comprobantes emitidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Facturado
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                S/ {estadisticas.totalFacturado.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Monto total facturado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {estadisticas.comprobantesPendientes}
              </div>
              <p className="text-xs text-muted-foreground">Por procesar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aceptados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {estadisticas.comprobantesAceptados}
              </div>
              <p className="text-xs text-muted-foreground">
                Comprobantes válidos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs de Contenido */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="comprobantes" className="gap-2">
            <Receipt className="h-4 w-4" />
            Comprobantes
          </TabsTrigger>
          <TabsTrigger value="pendientes" className="gap-2">
            <Package className="h-4 w-4" />
            Envíos Pendientes
          </TabsTrigger>
          <TabsTrigger value="reportes" className="gap-2">
            <Calendar className="h-4 w-4" />
            Reportes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Facturación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Facturación Mensual
                    </span>
                    <span className="font-medium">
                      S/ {estadisticas.facturacionMensual.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Crecimiento
                    </span>
                    <Badge
                      variant={
                        estadisticas.crecimientoMensual >= 0
                          ? "default"
                          : "destructive"
                      }
                    >
                      {estadisticas.crecimientoMensual >= 0 ? "+" : ""}
                      {estadisticas.crecimientoMensual.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Comprobantes Rechazados
                    </span>
                    <span className="font-medium text-red-600">
                      {estadisticas.comprobantesRechazados}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Tasa de Éxito
                    </span>
                    <span className="font-medium text-green-600">
                      {estadisticas.totalComprobantes > 0
                        ? (
                            (estadisticas.comprobantesAceptados /
                              estadisticas.totalComprobantes) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comprobantes">
          <ListaComprobantes />
        </TabsContent>

        <TabsContent value="pendientes">
          <EnviosPendientes onEmitirComprobante={handleEmitirComprobante} />
        </TabsContent>

        <TabsContent value="reportes">
          <Card>
            <CardHeader>
              <CardTitle>Reportes de Facturación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                  Reportes en desarrollo
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Los reportes de facturación estarán disponibles próximamente
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para Emitir Comprobante */}
      <ModalEmitirComprobante
        isOpen={showModalEmitir}
        onClose={() => setShowModalEmitir(false)}
        onComprobanteCreado={handleComprobanteEmitido}
      />
    </div>
  );
}
