"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DetalleModal from "./detalle-modal";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import {
  Search,
  Package,
  Calculator,
  CreditCard,
  Calendar,
  Filter,
  Eye,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ClienteHistorialClient({
  initialData,
  cliente,
  initialFiltros,
  totalItems,
  totalPages,
  currentPage,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Estados para el modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filtros, setFiltros] = useState({
    tipo: initialFiltros?.tipo || "todos",
    estado: initialFiltros?.estado || "todos",
    fechaRango: {
      from: initialFiltros?.fechaDesde
        ? new Date(initialFiltros.fechaDesde)
        : null,
      to: initialFiltros?.fechaHasta
        ? new Date(initialFiltros.fechaHasta)
        : null,
    },
    busqueda: initialFiltros?.busqueda || "",
    page: currentPage || 1,
    limit: 10,
  });

  const data = initialData || [];

  // Función para abrir el modal con detalles
  const openModal = (item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  // Función para actualizar URL con filtros
  const updateURL = useCallback(
    (newParams) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value && value !== "") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Resetear página cuando cambian los filtros
      if (newParams.page === undefined) {
        params.delete("page");
      }

      router.push(`/dashboard/clientes/historial?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Manejar cambios de filtros
  const handleFiltroChange = (key, value) => {
    let newFiltros;
    if (key === "fechaRango") {
      newFiltros = { ...filtros, fechaRango: value };
      // Actualizar URL con fechas separadas para compatibilidad
      const urlParams = {
        ...filtros,
        fechaDesde: value?.from ? value.from.toISOString().split("T")[0] : "",
        fechaHasta: value?.to ? value.to.toISOString().split("T")[0] : "",
      };
      delete urlParams.fechaRango;
      setFiltros(newFiltros);
      startTransition(() => {
        updateURL(urlParams);
      });
    } else {
      newFiltros = { ...filtros, [key]: value };
      setFiltros(newFiltros);
      startTransition(() => {
        updateURL(newFiltros);
      });
    }
  };

  // Función para obtener el badge del estado
  const getEstadoBadge = (tipo, estado) => {
    const variants = {
      REGISTRADO: "default",
      EN_BODEGA: "secondary",
      EN_TRANSITO: "default",
      EN_REPARTO: "default",
      ENTREGADO: "success",
      DEVUELTO: "destructive",
      ANULADO: "destructive",
      PENDIENTE: "secondary",
      APROBADA: "success",
      RECHAZADA: "destructive",
      CONVERTIDA_ENVIO: "success",
      EXPIRADA: "destructive",
    };

    return <Badge variant={variants[estado] || "default"}>{estado}</Badge>;
  };

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    return format(new Date(fecha), "dd/MM/yyyy HH:mm", { locale: es });
  };

  // Función para formatear precio
  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(precio);
  };

  // Estadísticas del cliente
  const estadisticas = {
    totalEnvios: data.filter((item) => item.tipo === "envio").length,
    totalCotizaciones: data.filter((item) => item.tipo === "cotizacion").length,
    enviosEntregados: data.filter(
      (item) => item.tipo === "envio" && item.estado === "ENTREGADO"
    ).length,
    montoTotal: data.reduce(
      (sum, item) => sum + (item.total || item.precioFinal || 0),
      0
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Historial del Cliente</h1>
            {cliente && (
              <p className="text-muted-foreground">
                {cliente.nombre} {cliente.apellidos} - {cliente.numeroDocumento}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Envíos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.totalEnvios}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cotizaciones</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estadisticas.totalCotizaciones}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estadisticas.enviosEntregados}
            </div>
            <p className="text-xs text-muted-foreground">
              {estadisticas.totalEnvios > 0
                ? `${Math.round(
                    (estadisticas.enviosEntregados / estadisticas.totalEnvios) *
                      100
                  )}% de éxito`
                : "0% de éxito"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatearPrecio(estadisticas.montoTotal)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <Select
                value={filtros.tipo}
                onValueChange={(value) => handleFiltroChange("tipo", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="envios">Envíos</SelectItem>
                  <SelectItem value="cotizaciones">Cotizaciones</SelectItem>
                  <SelectItem value="pagos">Pagos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select
                value={filtros.estado || "todos"}
                onValueChange={(value) =>
                  handleFiltroChange("estado", value === "todos" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="REGISTRADO">Registrado</SelectItem>
                  <SelectItem value="EN_TRANSITO">En Tránsito</SelectItem>
                  <SelectItem value="ENTREGADO">Entregado</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="APROBADA">Aprobada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">
                Rango de Fechas
              </label>
              <DatePickerWithRange
                date={filtros.fechaRango}
                setDate={(dateRange) =>
                  handleFiltroChange("fechaRango", dateRange)
                }
                placeholder="Seleccionar rango de fechas"
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por guía, descripción..."
                  value={filtros.busqueda}
                  onChange={(e) =>
                    handleFiltroChange("busqueda", e.target.value)
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de historial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial de Actividad</CardTitle>
          <CardDescription>
            Mostrando {data.length} de {totalItems} registros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Activity className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          No hay actividad registrada
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={`${item.tipo}-${item.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {item.tipo === "envio" && (
                            <Package className="h-4 w-4 text-blue-500" />
                          )}
                          {item.tipo === "cotizacion" && (
                            <Calculator className="h-4 w-4 text-green-500" />
                          )}
                          {item.tipo === "pago" && (
                            <CreditCard className="h-4 w-4 text-purple-500" />
                          )}
                          <span className="capitalize">{item.tipo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatearFecha(item.createdAt || item.fechaRegistro)}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {item.guia || item.id}
                        </code>
                      </TableCell>
                      <TableCell>
                        {item.descripcion ||
                          item.contenido ||
                          "Sin descripción"}
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(item.tipo, item.estado)}
                      </TableCell>
                      <TableCell>
                        {item.total || item.precioFinal
                          ? formatearPrecio(item.total || item.precioFinal)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1 || isPending}
                  onClick={() =>
                    updateURL({ ...filtros, page: currentPage - 1 })
                  }
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages || isPending}
                  onClick={() =>
                    updateURL({ ...filtros, page: currentPage + 1 })
                  }
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalles */}
      <DetalleModal
        isOpen={modalOpen}
        onClose={closeModal}
        item={selectedItem}
      />
    </div>
  );
}
