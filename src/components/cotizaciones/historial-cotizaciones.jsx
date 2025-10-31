"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import {
  Building2,
  ArrowRight,
  Package,
  Filter,
  Eye,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCotizaciones,
  convertirCotizacionAEnvio,
} from "@/lib/actions/cotizaciones";
import {
  ejecutarMantenimientoCotizaciones,
  puedeConvertirseAEnvio,
} from "@/lib/utils/cotizaciones-utils";
import ModalDetalleCotizacion from "./modal-detalle-cotizacion";
import ModalDatosCliente from "./modal-datos-cliente";
import { formatSoles, formatDate } from "@/lib/utils/formatters";

const estadoColors = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  APROBADA: "bg-green-100 text-green-800",
  RECHAZADA: "bg-red-100 text-red-800",
  CONVERTIDA_ENVIO: "bg-blue-100 text-blue-800",
  EXPIRADA: "bg-gray-100 text-gray-800",
};
const estadoLabels = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  CONVERTIDA_ENVIO: "Convertida a Envío",
  EXPIRADA: "Expirada",
};
const tipoServicioLabels = {
  NORMAL: "Normal",
  EXPRESS: "Express",
  OVERNIGHT: "Overnight",
  ECONOMICO: "Económico",
};
const modalidadLabels = {
  SUCURSAL_SUCURSAL: "Sucursal a Sucursal",
  SUCURSAL_DOMICILIO: "Sucursal a Domicilio",
  DOMICILIO_SUCURSAL: "Domicilio a Sucursal",
  DOMICILIO_DOMICILIO: "Domicilio a Domicilio",
};

export default function HistorialCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    estado: "TODOS",
    fechaRango: { from: null, to: null },
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [modalDetalle, setModalDetalle] = useState({
    isOpen: false,
    cotizacionId: null,
  });
  const [modalDatosCliente, setModalDatosCliente] = useState({
    isOpen: false,
    cotizacionId: null,
    cotizacion: null,
  });
  const [convirtiendo, setConvirtiendo] = useState(null);
  useEffect(() => {
    cargarCotizaciones();
  }, [filtros]);
  const cargarCotizaciones = async () => {
    try {
      setLoading(true);
      console.log("🔍 Cargando cotizaciones con filtros:", filtros);

      // Ejecutar mantenimiento de cotizaciones (marcar expiradas)
      console.log("🔧 Ejecutando mantenimiento...");
      await ejecutarMantenimientoCotizaciones();

      console.log("📋 Obteniendo cotizaciones...");
      const result = await getCotizaciones(filtros);
      console.log("📊 Resultado getCotizaciones:", result);

      if (result.success) {
        console.log(
          "✅ Cotizaciones cargadas:",
          result.data.cotizaciones.length
        );
        setCotizaciones(result.data.cotizaciones);
        setPagination(result.data.pagination);
      } else {
        console.error("❌ Error en getCotizaciones:", result.error);
        toast.error(result.error);
      }
    } catch (error) {
      console.error("❌ Error al cargar cotizaciones:", error);
      toast.error("Error al cargar las cotizaciones");
    } finally {
      setLoading(false);
    }
  };
  const handleFiltroChange = (key, value) => {
    if (key === "fechaRango") {
      // Convertir el rango de fechas a fechaDesde y fechaHasta para la AP I
      const filtrosActualizados = {
        ...filtros,
        fechaRango: value,
        fechaDesde: value?.from ? value.from.toISOString().split("T")[0] : "",
        fechaHasta: value?.to ? value.to.toISOString().split("T")[0] : "",
        page: 1,
      };
      setFiltros(filtrosActualizados);
    } else {
      setFiltros((prev) => ({
        ...prev,
        [key]: value,
        page: 1, // Resetear a la primera página cuando cambian los filtro s
      }));
    }
  };
  const handlePageChange = (newPage) => {
    setFiltros((prev) => ({ ...prev, page: newPage }));
  };
  const isExpired = (validoHasta) => {
    return new Date(validoHasta) < new Date();
  };
  const handleVerDetalle = (cotizacionId) => {
    setModalDetalle({ isOpen: true, cotizacionId });
  };
  const handleCerrarModal = () => {
    setModalDetalle({ isOpen: false, cotizacionId: null });
  };
  const handleConvertirAEnvio = async (cotizacionId, datosCliente = null) => {
    try {
      console.log("🔄 Convirtiendo cotización:", cotizacionId);
      console.log("👤 Datos del cliente:", datosCliente);

      setConvirtiendo(cotizacionId);
      const result = await convertirCotizacionAEnvio(
        cotizacionId,
        datosCliente
      );

      console.log("📊 Resultado conversión:", result);

      if (result.success) {
        console.log("✅ Conversión exitosa");
        toast.success(result.message);
        setModalDatosCliente({
          isOpen: false,
          cotizacionId: null,
          cotizacion: null,
        });
        cargarCotizaciones(); // Recargar la lista
      } else if (result.requiresClientData) {
        console.log("📝 Se requieren datos del cliente");
        // Si se requieren datos del cliente, buscar la cotización y abrir el modal
        const cotizacion = cotizaciones.find((c) => c.id === cotizacionId);
        setModalDatosCliente({ isOpen: true, cotizacionId, cotizacion });
        toast.info("Se requieren datos del cliente para crear el envío");
      } else {
        console.error("❌ Error en conversión:", result.error);
        toast.error(result.error);
      }
    } catch (error) {
      console.error("❌ Error al convertir cotización:", error);
      toast.error("Error al convertir la cotización a envío");
    } finally {
      setConvirtiendo(null);
    }
  };
  const handleCotizacionActualizada = () => {
    cargarCotizaciones(); // Recargar la lista cuando se actualice una cotizació n
  };
  const handleDatosClienteSubmit = (datosCliente) => {
    console.log("📋 handleDatosClienteSubmit llamado con:", datosCliente);
    console.log("🆔 cotizacionId:", modalDatosCliente.cotizacionId);

    if (modalDatosCliente.cotizacionId) {
      console.log("✅ Llamando handleConvertirAEnvio...");
      handleConvertirAEnvio(modalDatosCliente.cotizacionId, datosCliente);
    } else {
      console.error("❌ No hay cotizacionId disponible");
    }
  };
  const handleCerrarModalDatos = () => {
    setModalDatosCliente({
      isOpen: false,
      cotizacionId: null,
      cotizacion: null,
    });
    setConvirtiendo(null);
  };
  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={filtros.estado}
                onValueChange={(value) => handleFiltroChange("estado", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="APROBADA">Aprobada</SelectItem>
                  <SelectItem value="RECHAZADA">Rechazada</SelectItem>
                  <SelectItem value="CONVERTIDA_ENVIO">
                    Convertida a Envío
                  </SelectItem>
                  <SelectItem value="EXPIRADA">Expirada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Rango de Fechas</Label>
              <DatePickerWithRange
                date={filtros.fechaRango}
                setDate={(dateRange) =>
                  handleFiltroChange("fechaRango", dateRange)
                }
                placeholder="Seleccionar rango de fechas"
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setFiltros({
                    estado: "TODOS",
                    fechaRango: { from: null, to: null },
                    page: 1,
                    limit: 10,
                  });
                }}
                variant="outline"
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Lista de Cotizaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Historial de Cotizaciones
            </div>
            <Badge variant="outline">{pagination.total} cotizaciones</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Cargando cotizaciones...
              </span>
            </div>
          ) : cotizaciones.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay cotizaciones que coincidan con los filtros</p>
              <p className="text-sm">
                Intenta ajustar los filtros o crear una nueva cotización
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead> <TableHead>Ruta</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Peso</TableHead> <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Válido Hasta</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cotizaciones.map((cotizacion) => (
                      <TableRow key={cotizacion.id}>
                        <TableCell className="font-mono text-xs">
                          {cotizacion.id.slice(-8)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex items-center gap-1 text-xs">
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-20">
                                {cotizacion.sucursalOrigen?.nombre}
                              </span>
                            </div>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <div className="flex items-center gap-1 text-xs">
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-20">
                                {cotizacion.sucursalDestino?.nombre}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {cotizacion.nombreCliente || "Cliente anónimo"}
                            </div>
                            {cotizacion.telefonoCliente && (
                              <div className="text-xs text-muted-foreground">
                                📞 {cotizacion.telefonoCliente}
                              </div>
                            )}
                            {cotizacion.emailCliente && (
                              <div className="text-xs text-muted-foreground">
                                ✉️ {cotizacion.emailCliente}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs">
                              {tipoServicioLabels[cotizacion.tipoServicio]}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {modalidadLabels[cotizacion.modalidad]}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span className="text-sm">{cotizacion.peso}kg</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatSoles(cotizacion.precioFinal)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Base: {formatSoles(cotizacion.precioBase)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              estadoColors[cotizacion.estado]
                            } text-xs`}
                          >
                            {estadoLabels[cotizacion.estado]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(cotizacion.validoHasta)}
                          </div>
                          {isExpired(cotizacion.validoHasta) && (
                            <div className="text-xs text-red-600">Expirada</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerDetalle(cotizacion.id)}
                              title="Ver detalles"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {puedeConvertirseAEnvio(cotizacion) && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() =>
                                  handleConvertirAEnvio(cotizacion.id)
                                }
                                disabled={convirtiendo === cotizacion.id}
                                title="Convertir a envío"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {convirtiendo === cotizacion.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Package className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Paginación */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}
                    de {pagination.total} cotizaciones
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, pagination.pages) },
                        (_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={
                                page === pagination.page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          );
                        }
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      {/* Modal de Detalle */}
      <ModalDetalleCotizacion
        isOpen={modalDetalle.isOpen}
        onClose={handleCerrarModal}
        cotizacionId={modalDetalle.cotizacionId}
        onCotizacionActualizada={handleCotizacionActualizada}
      />
      {/* Modal para capturar datos del cliente */}
      <ModalDatosCliente
        isOpen={modalDatosCliente.isOpen}
        onClose={handleCerrarModalDatos}
        onSubmit={handleDatosClienteSubmit}
        loading={convirtiendo !== null}
        cotizacion={modalDatosCliente.cotizacion}
      />
    </div>
  );
}
