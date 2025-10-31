"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import Paginator from "@/components/ui/paginator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Filter,
  Plus,
  Search,
  Eye,
  Printer,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPagos,
  registrarPago,
  getPagosPorEnvio,
  getPagoDetalle,
} from "@/lib/actions/pagos";
import { useEmpresaConfig } from "@/hooks/use-empresa-config";
import { useDebounce } from "@/hooks/useDebounce";
import ModalRegistroPagoMejorado from "@/components/pagos/modal-registro-pago-mejorado";

const estadosPago = [
  {
    value: "PENDIENTE",
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  {
    value: "CONFIRMADO",
    label: "Confirmado",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  {
    value: "RECHAZADO",
    label: "Rechazado",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
];

const metodosPago = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA_CREDITO", label: "Tarjeta de Crédito" },
  { value: "TARJETA_DEBITO", label: "Tarjeta de Débito" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "DEPOSITO", label: "Depósito" },
  { value: "YAPE", label: "Yape" },
  { value: "PLIN", label: "Plin" },
  { value: "BILLETERA_DIGITAL", label: "Billetera Digital" },
];

export default function PagosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { empresaConfig } = useEmpresaConfig();

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [filtros, setFiltros] = useState({
    estado: "ALL",
    metodo: "ALL",
    busqueda: "",
    rangoFechas: undefined,
    conSaldo: false,
  });

  // Paginación
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pagos, setPagos] = useState([]);

  // Estados para modal de detalle
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detallePago, setDetallePago] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleSaldoPendiente, setDetalleSaldoPendiente] = useState(null);
  const [detalleEstadoEnvio, setDetalleEstadoEnvio] = useState("");
  const [ariaMessage, setAriaMessage] = useState("");
  const [imprimiendoId, setImprimiendoId] = useState(null);

  // Estados para nuevo pago
  const [nuevoPago, setNuevoPago] = useState({
    cliente: "",
    envio: "",
    monto: "",
    metodo: "EFECTIVO",
    estado: "CONFIRMADO",
    referencia: "",
    fecha: new Date().toISOString().slice(0, 10),
  });

  // Estados para búsqueda de envíos
  const [envioOpen, setEnvioOpen] = useState(false);
  const [envioQuery, setEnvioQuery] = useState("");
  const envioQueryDebounced = useDebounce(envioQuery, 300);
  const busquedaDebounced = useDebounce(filtros.busqueda, 400);
  const [envioOptions, setEnvioOptions] = useState([]);
  const [montoEditable, setMontoEditable] = useState(false);
  const [envioResumen, setEnvioResumen] = useState(null);
  const envioInputRef = useRef(null);

  // Filtrar pagos
  const pagosFiltrados = pagos.filter((p) => {
    const coincideEstado =
      filtros.estado === "ALL" || p.estado === filtros.estado;
    const coincideMetodo =
      !filtros.metodo ||
      filtros.metodo === "ALL" ||
      p.metodo === filtros.metodo;

    const coincideBusqueda =
      !filtros.busqueda ||
      (p.cliente &&
        p.cliente.toLowerCase().includes(filtros.busqueda.toLowerCase())) ||
      (p.envio &&
        p.envio.toLowerCase().includes(filtros.busqueda.toLowerCase())) ||
      (p.referencia &&
        p.referencia.toLowerCase().includes(filtros.busqueda.toLowerCase()));

    let coincideFecha = true;
    if (filtros.rangoFechas?.from && filtros.rangoFechas?.to) {
      const f = new Date(p.fecha);
      const from = new Date(filtros.rangoFechas.from);
      const to = new Date(filtros.rangoFechas.to);
      coincideFecha = f >= from && f <= to;
    }

    const coincideSaldo =
      !filtros.conSaldo || Number(p.saldoEnvio || 0) > 0.0001;

    return (
      coincideEstado &&
      coincideMetodo &&
      coincideBusqueda &&
      coincideFecha &&
      coincideSaldo
    );
  });

  // Resumen de pagos
  const resumen = {
    total: pagos.reduce((acc, p) => acc + p.monto, 0),
    confirmados: pagos.filter((p) => p.estado === "CONFIRMADO").length,
    pendientes: pagos.filter((p) => p.estado === "PENDIENTE").length,
    rechazados: pagos.filter((p) => p.estado === "RECHAZADO").length,
  };

  // Cargar pagos
  const cargarPagos = async () => {
    try {
      setLoading(true);
      const resultado = await getPagos({
        page,
        limit,
        ...filtros,
      });

      if (resultado.success) {
        setPagos(resultado.data.pagos || []);
        setTotalPages(resultado.data.totalPages || 1);
        setTotal(resultado.data.total || 0);
      } else {
        toast.error("Error al cargar pagos");
      }
    } catch (error) {
      console.error("Error al cargar pagos:", error);
      toast.error("Error al cargar pagos");
    } finally {
      setLoading(false);
    }
  };

  // Registrar nuevo pago
  const registrarPagoHandler = async () => {
    if (!nuevoPago.envio || !nuevoPago.monto || !nuevoPago.metodo) {
      toast.error("Completa guía, monto y método");
      return;
    }

    try {
      setGuardando(true);
      const resultado = await registrarPago(nuevoPago);

      if (resultado.success) {
        toast.success("Pago registrado correctamente");
        setShowModal(false);
        setNuevoPago({
          cliente: "",
          envio: "",
          monto: "",
          metodo: "EFECTIVO",
          estado: "CONFIRMADO",
          referencia: "",
          fecha: new Date().toISOString().slice(0, 10),
        });
        cargarPagos();
      } else {
        toast.error(resultado.error || "Error al registrar pago");
      }
    } catch (error) {
      console.error("Error al registrar pago:", error);
      toast.error("Error al registrar pago");
    } finally {
      setGuardando(false);
    }
  };

  // Ver detalle del pago
  const verDetalle = async (pagoId) => {
    try {
      setDetalleLoading(true);
      setDetalleOpen(true);

      const resultado = await getPagoDetalle(pagoId);

      if (resultado.success) {
        setDetallePago(resultado.data);
      } else {
        toast.error("Error al cargar detalle del pago");
      }
    } catch (error) {
      console.error("Error al cargar detalle:", error);
      toast.error("Error al cargar detalle del pago");
    } finally {
      setDetalleLoading(false);
    }
  };

  // Reimprimir voucher de pago
  // Abrir voucher completo para impresión
  const imprimirVoucherPago = async (pago) => {
    try {
      setImprimiendoId(pago.id);

      // Abrir el voucher completo con parámetro de impresión
      const voucherUrl = `/dashboard/pagos/voucher/${pago.id}?print=true&format=80`;
      window.open(voucherUrl, "_blank");

      toast.success("Voucher abierto para impresión");
    } catch (error) {
      console.error("Error al abrir voucher:", error);
      toast.error("Error al abrir el voucher");
    } finally {
      setImprimiendoId(null);
    }
  };

  // Efectos
  useEffect(() => {
    cargarPagos();
  }, [page, limit]);

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    } else {
      cargarPagos();
    }
  }, [
    busquedaDebounced,
    filtros.estado,
    filtros.metodo,
    filtros.rangoFechas,
    filtros.conSaldo,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión de Pagos
          </h1>
          <p className="text-muted-foreground">
            Administra los pagos de envíos y transacciones
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Registrar Pago
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {resumen.total.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {resumen.confirmados}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {resumen.pendientes}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {resumen.rechazados}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cliente, envío, referencia..."
                  value={filtros.busqueda}
                  onChange={(e) =>
                    setFiltros((prev) => ({
                      ...prev,
                      busqueda: e.target.value,
                    }))
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Estado</Label>
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
                  <SelectItem value="ALL">Todos</SelectItem>
                  {estadosPago.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Método</Label>
              <Select
                value={filtros.metodo}
                onValueChange={(value) =>
                  setFiltros((prev) => ({ ...prev, metodo: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  {metodosPago.map((metodo) => (
                    <SelectItem key={metodo.value} value={metodo.value}>
                      {metodo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <Switch
                id="con-saldo"
                checked={filtros.conSaldo}
                onCheckedChange={(checked) =>
                  setFiltros((prev) => ({ ...prev, conSaldo: checked }))
                }
              />
              <Label htmlFor="con-saldo">Con saldo pendiente</Label>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() =>
                  setFiltros({
                    estado: "ALL",
                    metodo: "ALL",
                    busqueda: "",
                    rangoFechas: undefined,
                    conSaldo: false,
                  })
                }
              >
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Cargando pagos...</span>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Envío</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          No hay pagos
                        </h3>
                        <p className="text-muted-foreground">
                          No se encontraron pagos que coincidan con los filtros
                          aplicados
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagosFiltrados.map((pago) => {
                      const estadoConfig = estadosPago.find(
                        (e) => e.value === pago.estado
                      );
                      const IconoEstado = estadoConfig?.icon || Clock;

                      return (
                        <TableRow key={pago.id}>
                          <TableCell>
                            {new Date(pago.fecha).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{pago.cliente}</TableCell>
                          <TableCell className="font-mono">
                            {pago.envio}
                          </TableCell>
                          <TableCell>
                            {metodosPago.find((m) => m.value === pago.metodo)
                              ?.label || pago.metodo}
                          </TableCell>
                          <TableCell className="font-semibold">
                            S/ {pago.monto.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={estadoConfig?.color}>
                              <IconoEstado className="h-3 w-3 mr-1" />
                              {estadoConfig?.label || pago.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => verDetalle(pago.id)}
                                title="Ver detalle"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => imprimirVoucherPago(pago)}
                                disabled={imprimiendoId === pago.id}
                                title="Reimprimir voucher"
                              >
                                {imprimiendoId === pago.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Printer className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Paginator
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal mejorado para registrar pago */}
      <ModalRegistroPagoMejorado
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onPagoRegistrado={cargarPagos}
      />

      {/* Modal de detalle */}
      <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Pago</DialogTitle>
          </DialogHeader>
          {detalleLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Cargando detalle...</span>
            </div>
          ) : detallePago ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">ID del Pago</Label>
                  <p className="font-mono">{detallePago.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha</Label>
                  <p>{new Date(detallePago.fecha).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cliente</Label>
                  <p>{detallePago.cliente}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Envío</Label>
                  <p className="font-mono">{detallePago.envio}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Método</Label>
                  <p>
                    {
                      metodosPago.find((m) => m.value === detallePago.metodo)
                        ?.label
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Monto</Label>
                  <p className="text-lg font-semibold">
                    S/ {detallePago.monto.toLocaleString()}
                  </p>
                </div>
              </div>

              {detallePago.referencia && (
                <div>
                  <Label className="text-muted-foreground">Referencia</Label>
                  <p>{detallePago.referencia}</p>
                </div>
              )}

              {detallePago.observaciones && (
                <div>
                  <Label className="text-muted-foreground">Observaciones</Label>
                  <p>{detallePago.observaciones}</p>
                </div>
              )}
            </div>
          ) : (
            <p>No se pudo cargar el detalle del pago</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
