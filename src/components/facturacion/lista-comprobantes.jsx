"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  FileText,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import {
  obtenerComprobantesElectronicos,
  consultarEstadoComprobante,
  reenviarComprobanteElectronico,
} from "@/lib/actions/comprobantes";
import { useDebounce } from "@/hooks/useDebounce";

// Configuración de estados
const ESTADOS_COMPROBANTE = {
  PENDIENTE: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  ACEPTADO: {
    label: "Aceptado",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  RECHAZADO: {
    label: "Rechazado",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  EXCEPCION: {
    label: "Excepción",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: AlertCircle,
  },
};

const TIPOS_COMPROBANTE = {
  FACTURA: {
    label: "Factura",
    icon: FileText,
    color: "text-blue-600",
  },
  BOLETA: {
    label: "Boleta",
    icon: Receipt,
    color: "text-green-600",
  },
};

export default function ListaComprobantes() {
  const [comprobantes, setComprobantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState(null);
  const [actualizandoEstado, setActualizandoEstado] = useState({});

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const registrosPorPagina = 20;

  const [filtros, setFiltros] = useState({
    busquedaRapida: "", // Nuevo filtro de búsqueda rápida
    numeroCompleto: "",
    estado: "TODOS",
    tipoComprobante: "TODOS",
    fechaDesde: "",
    fechaHasta: "",
  });

  // Usar hook personalizado para debounce
  const debouncedBusqueda = useDebounce(filtros.busquedaRapida, 500);

  const cargarComprobantes = useCallback(async () => {
    setLoading(true);
    try {
      const filtrosAplicados = {
        ...filtros,
        pagina: paginaActual,
        limite: registrosPorPagina,
      };

      // Limpiar filtros vacíos
      Object.keys(filtrosAplicados).forEach((key) => {
        if (filtrosAplicados[key] === "" || filtrosAplicados[key] === "TODOS") {
          delete filtrosAplicados[key];
        }
      });

      const resultado = await obtenerComprobantesElectronicos(filtrosAplicados);

      if (resultado.success) {
        setComprobantes(resultado.data.comprobantes || []);
        setTotalPaginas(resultado.data.totalPaginas || 0);
        setTotalRegistros(resultado.data.totalRegistros || 0);
      } else {
        toast.error(resultado.error || "Error al cargar comprobantes");
        setComprobantes([]);
      }
    } catch (error) {
      console.error("Error al cargar comprobantes:", error);
      toast.error("Error al cargar comprobantes");
      setComprobantes([]);
    } finally {
      setLoading(false);
    }
  }, [filtros, paginaActual]);

  // Efecto para cargar comprobantes cuando cambian los filtros
  useEffect(() => {
    cargarComprobantes();
  }, [cargarComprobantes, debouncedBusqueda]);

  // Efecto para resetear página cuando cambian los filtros
  useEffect(() => {
    if (paginaActual !== 1) {
      setPaginaActual(1);
    }
  }, [
    filtros.busquedaRapida,
    filtros.estado,
    filtros.tipoComprobante,
    filtros.fechaDesde,
    filtros.fechaHasta,
  ]);

  const consultarEstado = async (comprobanteId) => {
    try {
      setActualizandoEstado((prev) => ({ ...prev, [comprobanteId]: true }));
      const resultado = await consultarEstadoComprobante(comprobanteId);

      if (resultado.success) {
        toast.success("Estado actualizado correctamente");
        cargarComprobantes(); // Recargar la lista
      } else {
        toast.error(resultado.error || "Error al consultar estado");
      }
    } catch (error) {
      console.error("Error al consultar estado:", error);
      toast.error("Error al consultar estado");
    } finally {
      setActualizandoEstado((prev) => ({ ...prev, [comprobanteId]: false }));
    }
  };

  const reenviarComprobante = async (comprobanteId) => {
    try {
      setActualizandoEstado((prev) => ({ ...prev, [comprobanteId]: true }));
      const resultado = await reenviarComprobanteElectronico(comprobanteId);

      if (resultado.success) {
        toast.success("Comprobante reenviado correctamente");
        cargarComprobantes(); // Recargar la lista
      } else {
        toast.error(resultado.error || "Error al reenviar comprobante");
      }
    } catch (error) {
      console.error("Error al reenviar comprobante:", error);
      toast.error("Error al reenviar comprobante");
    } finally {
      setActualizandoEstado((prev) => ({ ...prev, [comprobanteId]: false }));
    }
  };

  const reenviarEmailComprobante = async (comprobanteId) => {
    try {
      setActualizandoEstado((prev) => ({ ...prev, [comprobanteId]: true }));
      const { enviarEmailComprobanteReenviado, enviarEmailComprobanteEmitido } = await import(
        "@/lib/utils/enviar-email-comprobante"
      );

      // Obtener el comprobante para verificar su estado
      const comprobante = comprobantes.find((c) => c.id === comprobanteId);
      
      if (!comprobante) {
        toast.error("Comprobante no encontrado");
        return;
      }

      // Si está aceptado, usar la función de emitido, sino la de reenviado
      const resultado = comprobante.estado === "ACEPTADO"
        ? await enviarEmailComprobanteEmitido(comprobanteId)
        : await enviarEmailComprobanteReenviado(comprobanteId);

      if (resultado.success) {
        toast.success("Email reenviado correctamente");
      } else {
        toast.error(resultado.error || "Error al reenviar email");
      }
    } catch (error) {
      console.error("Error al reenviar email:", error);
      toast.error("Error al reenviar email");
    } finally {
      setActualizandoEstado((prev) => ({ ...prev, [comprobanteId]: false }));
    }
  };

  const verDetalle = (comprobante) => {
    setComprobanteSeleccionado(comprobante);
    setModalDetalleAbierto(true);
  };

  const descargarPDF = (comprobante) => {
    if (comprobante.url_pdf) {
      window.open(comprobante.url_pdf, "_blank");
    } else {
      toast.error("PDF no disponible");
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      busquedaRapida: "",
      numeroCompleto: "",
      estado: "TODOS",
      tipoComprobante: "TODOS",
      fechaDesde: "",
      fechaHasta: "",
    });
    setPaginaActual(1);
  };

  const estadisticasResumen = useMemo(() => {
    return comprobantes.reduce((acc, comp) => {
      acc[comp.estado] = (acc[comp.estado] || 0) + 1;
      return acc;
    }, {});
  }, [comprobantes]);

  return (
    <div className="space-y-6">
      {/* Header con estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(ESTADOS_COMPROBANTE).map(([estado, config]) => {
          const Icon = config.icon;
          const cantidad = estadisticasResumen[estado] || 0;

          return (
            <Card key={estado}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {config.label}
                    </p>
                    <p className="text-2xl font-bold">{cantidad}</p>
                  </div>
                  <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Controles y filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Comprobantes Electrónicos
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={cargarComprobantes}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Búsqueda rápida */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, RUC, razón social..."
                value={filtros.busquedaRapida}
                onChange={(e) =>
                  setFiltros((prev) => ({
                    ...prev,
                    busquedaRapida: e.target.value,
                  }))
                }
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtros avanzados */}
          {mostrarFiltros && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Número Completo
                </label>
                <Input
                  placeholder="F001-00000001"
                  value={filtros.numeroCompleto}
                  onChange={(e) =>
                    setFiltros((prev) => ({
                      ...prev,
                      numeroCompleto: e.target.value,
                    }))
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
                    {Object.entries(ESTADOS_COMPROBANTE).map(
                      ([key, estado]) => (
                        <SelectItem key={key} value={key}>
                          {estado.label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <Select
                  value={filtros.tipoComprobante}
                  onValueChange={(value) =>
                    setFiltros((prev) => ({ ...prev, tipoComprobante: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos los tipos</SelectItem>
                    {Object.entries(TIPOS_COMPROBANTE).map(([key, tipo]) => (
                      <SelectItem key={key} value={key}>
                        {tipo.label}
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
              <div className="md:col-span-5 flex justify-end">
                <Button variant="outline" onClick={limpiarFiltros}>
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          )}

          {/* Tabla de comprobantes */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <span>Cargando comprobantes...</span>
                    </TableCell>
                  </TableRow>
                ) : comprobantes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No hay comprobantes
                      </h3>
                      <p className="text-muted-foreground">
                        No se encontraron comprobantes que coincidan con los
                        filtros aplicados
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  comprobantes.map((comprobante) => {
                    const estadoConfig =
                      ESTADOS_COMPROBANTE[comprobante.estado];
                    const tipoConfig =
                      TIPOS_COMPROBANTE[comprobante.tipo_comprobante];
                    const IconEstado = estadoConfig?.icon;
                    const IconTipo = tipoConfig?.icon;

                    return (
                      <TableRow key={comprobante.id}>
                        <TableCell className="font-mono">
                          {comprobante.numero_completo}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {IconTipo && (
                              <IconTipo
                                className={`h-4 w-4 ${tipoConfig.color}`}
                              />
                            )}
                            <span>
                              {tipoConfig?.label ||
                                comprobante.tipo_comprobante}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {comprobante.razon_social}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {comprobante.numero_documento}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(
                            comprobante.fecha_emision
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          S/{" "}
                          {comprobante.monto_total?.toLocaleString() || "0.00"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              estadoConfig?.color || "bg-gray-100 text-gray-800"
                            }
                          >
                            <div className="flex items-center gap-1">
                              {IconEstado && <IconEstado className="h-3 w-3" />}
                              {estadoConfig?.label || comprobante.estado}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => verDetalle(comprobante)}
                              className="h-8 w-8 p-0"
                              title="Ver detalle"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {comprobante.url_pdf && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => descargarPDF(comprobante)}
                                className="h-8 w-8 p-0"
                                title="Descargar PDF"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => reenviarEmailComprobante(comprobante.id)}
                              disabled={actualizandoEstado[comprobante.id]}
                              className="h-8 w-8 p-0"
                              title="Reenviar email"
                            >
                              <Mail
                                className={`h-4 w-4 ${
                                  actualizandoEstado[comprobante.id]
                                    ? "animate-pulse"
                                    : ""
                                }`}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => consultarEstado(comprobante.id)}
                              disabled={actualizandoEstado[comprobante.id]}
                              className="h-8 w-8 p-0"
                              title="Consultar estado"
                            >
                              <RefreshCw
                                className={`h-4 w-4 ${
                                  actualizandoEstado[comprobante.id]
                                    ? "animate-spin"
                                    : ""
                                }`}
                              />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {(paginaActual - 1) * registrosPorPagina + 1} a{" "}
                {Math.min(paginaActual * registrosPorPagina, totalRegistros)} de{" "}
                {totalRegistros} registros
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPaginaActual((prev) => Math.max(1, prev - 1))
                  }
                  disabled={paginaActual === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))
                  }
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalle */}
      <Dialog open={modalDetalleAbierto} onOpenChange={setModalDetalleAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Comprobante</DialogTitle>
          </DialogHeader>
          {comprobanteSeleccionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Número
                  </label>
                  <p className="font-mono">
                    {comprobanteSeleccionado.numero_completo}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Estado
                  </label>
                  <Badge
                    className={
                      ESTADOS_COMPROBANTE[comprobanteSeleccionado.estado]?.color
                    }
                  >
                    {ESTADOS_COMPROBANTE[comprobanteSeleccionado.estado]?.label}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Cliente
                  </label>
                  <p>{comprobanteSeleccionado.razon_social}</p>
                  <p className="text-sm text-muted-foreground">
                    {comprobanteSeleccionado.numero_documento}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Fecha de Emisión
                  </label>
                  <p>
                    {new Date(
                      comprobanteSeleccionado.fecha_emision
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Monto Total
                  </label>
                  <p className="text-lg font-semibold">
                    S/ {comprobanteSeleccionado.monto_total?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Moneda
                  </label>
                  <p>{comprobanteSeleccionado.moneda || "PEN"}</p>
                </div>
              </div>

              {comprobanteSeleccionado.observaciones && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Observaciones
                  </label>
                  <p className="text-sm bg-muted p-2 rounded">
                    {comprobanteSeleccionado.observaciones}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {comprobanteSeleccionado.url_pdf && (
                  <Button onClick={() => descargarPDF(comprobanteSeleccionado)}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() =>
                    reenviarComprobante(comprobanteSeleccionado.id)
                  }
                  disabled={actualizandoEstado[comprobanteSeleccionado.id]}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      actualizandoEstado[comprobanteSeleccionado.id]
                        ? "animate-spin"
                        : ""
                    }`}
                  />
                  Reenviar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
