"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Package,
  Truck,
  Calendar,
  DollarSign,
  FileText,
  Receipt,
  RefreshCw,
} from "lucide-react";
import {
  obtenerEnviosSinComprobantes,
  crearComprobanteDesdeEnvio,
} from "@/lib/actions/comprobantes";
import { toast } from "sonner";
import { ESTADOS_ENVIO_VALIDOS } from "@/lib/constants/estados";

const ESTADOS_ENVIO = {
  REGISTRADO: {
    label: "Registrado",
    color: "border-transparent bg-primary/10 text-primary",
  },
  EN_BODEGA: {
    label: "En Bodega",
    color: "border-transparent bg-yellow-400/20 text-yellow-500",
  },
  EN_AGENCIA_ORIGEN: {
    label: "En Agencia Origen",
    color: "border-transparent bg-blue-400/20 text-blue-500",
  },
  EN_TRANSITO: {
    label: "En Tránsito",
    color: "border-transparent bg-orange-400/20 text-orange-500",
  },
  EN_AGENCIA_DESTINO: {
    label: "En Agencia Destino",
    color: "border-transparent bg-purple-400/20 text-purple-500",
  },
  EN_REPARTO: {
    label: "En Reparto",
    color: "border-transparent bg-indigo-400/20 text-indigo-500",
  },
  ENTREGADO: {
    label: "Entregado",
    color: "border-transparent bg-green-400/20 text-green-500",
  },
  DEVUELTO: {
    label: "Devuelto",
    color: "border-transparent bg-red-400/20 text-red-500",
  },
  ANULADO: {
    label: "Anulado",
    color: "border-transparent bg-gray-400/20 text-gray-500",
  },
};

export default function EnviosPendientes({ onComprobanteCreado }) {
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creandoComprobante, setCreandoComprobante] = useState({});
  const [filtros, setFiltros] = useState({
    busqueda: "",
    estado: "TODOS",
    fechaDesde: "",
    fechaHasta: "",
  });

  useEffect(() => {
    cargarEnvios();
  }, []);

  const cargarEnvios = async () => {
    try {
      setLoading(true);
      const resultado = await obtenerEnviosSinComprobantes();

      if (resultado.success) {
        setEnvios(resultado.data);
      } else {
        toast.error("Error al cargar envíos: " + resultado.error);
        setEnvios([]);
      }
    } catch (error) {
      console.error("Error al cargar envíos:", error);
      toast.error("Error al cargar envíos");
      setEnvios([]);
    } finally {
      setLoading(false);
    }
  };

  const crearComprobante = async (envioId) => {
    try {
      setCreandoComprobante((prev) => ({ ...prev, [envioId]: true }));
      const resultado = await crearComprobanteDesdeEnvio(envioId);

      if (resultado.success) {
        toast.success("Comprobante creado exitosamente");
        cargarEnvios(); // Recargar la lista
        onComprobanteCreado?.(resultado.data);
      } else {
        toast.error("Error al crear comprobante: " + resultado.error);
      }
    } catch (error) {
      console.error("Error al crear comprobante:", error);
      toast.error("Error al crear comprobante");
    } finally {
      setCreandoComprobante((prev) => ({ ...prev, [envioId]: false }));
    }
  };

  const enviosFiltrados = envios.filter((envio) => {
    const coincideBusqueda =
      !filtros.busqueda ||
      envio.codigo_seguimiento
        ?.toLowerCase()
        .includes(filtros.busqueda.toLowerCase()) ||
      envio.destinatario
        ?.toLowerCase()
        .includes(filtros.busqueda.toLowerCase()) ||
      envio.origen?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      envio.destino?.toLowerCase().includes(filtros.busqueda.toLowerCase());

    const coincideEstado =
      filtros.estado === "TODOS" || envio.estado === filtros.estado;

    const coincideFecha =
      (!filtros.fechaDesde ||
        new Date(envio.fecha_creacion) >= new Date(filtros.fechaDesde)) &&
      (!filtros.fechaHasta ||
        new Date(envio.fecha_creacion) <= new Date(filtros.fechaHasta));

    return coincideBusqueda && coincideEstado && coincideFecha;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Cargando envíos pendientes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Código, destinatario, origen..."
                value={filtros.busqueda}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, busqueda: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select
                value={filtros.estado}
                onValueChange={(value) =>
                  setFiltros((prev) => ({ ...prev, estado: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los estados</SelectItem>
                  {Object.entries(ESTADOS_ENVIO)
                    .filter(([key]) => ESTADOS_ENVIO_VALIDOS.includes(key))
                    .map(([key, estado]) => (
                      <SelectItem key={key} value={key}>
                        {estado.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Desde</label>
              <Input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) =>
                  setFiltros((prev) => ({
                    ...prev,
                    fechaDesde: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Hasta</label>
              <Input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) =>
                  setFiltros((prev) => ({
                    ...prev,
                    fechaHasta: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de envíos */}
      <div className="grid gap-4">
        {enviosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No hay envíos pendientes
              </h3>
              <p className="text-muted-foreground">
                {envios.length === 0
                  ? "No hay envíos sin comprobantes en el sistema"
                  : "No se encontraron envíos que coincidan con los filtros aplicados"}
              </p>
            </CardContent>
          </Card>
        ) : (
          enviosFiltrados.map((envio) => (
            <Card key={envio.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm font-medium">
                          {envio.codigo_seguimiento}
                        </span>
                      </div>
                      <Badge
                        className={
                          ESTADOS_ENVIO[envio.estado]?.color ||
                          "border-transparent bg-gray-400/20 text-gray-500"
                        }
                      >
                        {ESTADOS_ENVIO[envio.estado]?.label || envio.estado}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Ruta:</span>
                          <span>
                            {envio.origen} → {envio.destino}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Fecha:</span>
                          <span>
                            {new Date(
                              envio.fecha_creacion
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Valor:</span>
                          <span>
                            S/ {envio.total?.toLocaleString() || "0.00"}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Destinatario:</span>
                          <span className="ml-2">{envio.destinatario}</span>
                        </div>
                      </div>
                    </div>

                    {envio.descripcion && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Descripción:</span>
                        <span className="ml-2">{envio.descripcion}</span>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <Button
                      onClick={() => crearComprobante(envio.id)}
                      disabled={creandoComprobante[envio.id]}
                      className="flex items-center gap-2"
                    >
                      {creandoComprobante[envio.id] ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Receipt className="h-4 w-4" />
                      )}
                      {creandoComprobante[envio.id]
                        ? "Creando..."
                        : "Crear Comprobante"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Resumen */}
      {enviosFiltrados.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Mostrando {enviosFiltrados.length} de {envios.length} envíos
                pendientes
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={cargarEnvios}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
