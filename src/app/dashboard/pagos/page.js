"use client";

import { useState, useEffect, useMemo } from "react";
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
import Modal from "@/components/ui/modal";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Plus,
  Search,
  Eye,
  Printer,
  Loader2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { getPagos, getPagoDetalle } from "@/lib/actions/pagos";
import { useDebounce } from "@/hooks/useDebounce";
import ModalRegistroPagoMejorado from "@/components/pagos/modal-registro-pago-mejorado";
import {
  useMetodoPago,
  useBusqueda,
  useFechaDesde,
  useFechaHasta,
  usePage,
} from "@/hooks/useQueryParams";
import { useQueryState, parseAsBoolean, parseAsString } from "nuqs";
import PagosResumen from "@/components/pagos/pagos-resumen";
import PagosFiltros from "@/components/pagos/pagos-filtros";
import PagosTabla from "@/components/pagos/pagos-tabla";
import ModalDetalle from "@/components/pagos/modal-detalle";
import { DataTable } from "@/components/ui/data-table";
import { pagosColumns } from "@/components/pagos/pagos-columns";

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
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Query params con nuqs (sincronizados con URL)
  const [estado, setEstado] = useQueryState(
    "estadoPago",
    parseAsString.withDefault("ALL")
  );
  const [metodo, setMetodo] = useMetodoPago("ALL");
  const [busqueda, setBusqueda] = useBusqueda("");
  const [fechaDesde, setFechaDesde] = useFechaDesde(null);
  const [fechaHasta, setFechaHasta] = useFechaHasta(null);
  const [conSaldo, setConSaldo] = useQueryState(
    "conSaldo",
    parseAsBoolean.withDefault(false)
  );
  const [page, setPage] = usePage(1);
  const [limit, setLimit] = useState(20);

  // Debounce para búsqueda (mantiene el comportamiento existente)
  const busquedaDebounced = useDebounce(busqueda, 400);

  // Construir objeto filtros desde los hooks (para mantener compatibilidad)
  const filtros = useMemo(
    () => ({
      estado,
      metodo,
      busqueda: busquedaDebounced,
      rangoFechas:
        fechaDesde || fechaHasta
          ? {
              from: fechaDesde ? new Date(fechaDesde) : null,
              to: fechaHasta ? new Date(fechaHasta) : null,
            }
          : undefined,
      conSaldo,
    }),
    [estado, metodo, busquedaDebounced, fechaDesde, fechaHasta, conSaldo]
  );

  const [totalPages, setTotalPages] = useState(1);
  const [pagos, setPagos] = useState([]);

  // Estados para modal de detalle
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detallePago, setDetallePago] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [imprimiendoId, setImprimiendoId] = useState(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

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

  // Reenviar email de confirmación de pago
  const reenviarEmailPago = async (pagoId) => {
    try {
      setImprimiendoId(pagoId);
      const { enviarEmailPagoRegistrado } = await import(
        "@/lib/utils/enviar-email-comprobante"
      );

      const resultado = await enviarEmailPagoRegistrado(pagoId);

      if (resultado.success) {
        toast.success("Email reenviado correctamente");
      } else {
        toast.error(resultado.error || "Error al reenviar email");
      }
    } catch (error) {
      console.error("Error al reenviar email:", error);
      toast.error("Error al reenviar email");
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

  const actions = {
    verDetalle,
    imprimir: imprimirVoucherPago,
    reenviarEmail: reenviarEmailPago,
  };

  // Convertir filtros 'nuqs' a filtros de React Table
  const initialColumnFilters = useMemo(() => {
    const filters = [];

    // Filtro por Estado
    if (estado && estado !== "ALL") {
      filters.push({ id: "estado", value: estado });
    }

    // Filtro por Método
    if (metodo && metodo !== "ALL") {
      filters.push({ id: "metodo", value: metodo });
    }

    return filters;
  }, [estado, metodo]);

  // Definir un estado local para los filtros (opcional, pero ayuda a controlar)
  const [columnFilters, setColumnFilters] = useState(initialColumnFilters);

  // Mantener el estado de React Table sincronizado con los filtros de URL (nuqs)
  useEffect(() => {
    setColumnFilters(initialColumnFilters);
  }, [initialColumnFilters]);

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
      <PagosResumen resumen={resumen} />

      {/* DataTable */}
      <DataTable
        columns={pagosColumns(actions)}
        data={pagos}
        searchKey="cliente"
        searchPlaceholder="Buscar por cliente..."
        emptyMessage="No se encontraron pagos"
        emptyIcon={CreditCard}
        columnFilters={columnFilters}
        setColumnFilters={setColumnFilters}
        pagination={pagination}
        setPagination={setPagination}
        renderComponents={
          <PagosFiltros
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            estado={estado}
            setEstado={setEstado}
            conSaldo={conSaldo}
            estadosPago={estadosPago}
            metodo={metodo}
            metodosPago={metodosPago}
            setConSaldo={setConSaldo}
            setMetodo={setMetodo}
            setPage={setPage}
          />
        }
      />

      {/* Modal mejorado para registrar pago */}
      <ModalRegistroPagoMejorado
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onPagoRegistrado={cargarPagos}
      />

      {/* Modal de detalle */}
      <ModalDetalle
        detallePago={detallePago}
        detalleLoading={detalleLoading}
        detalleOpen={detalleOpen}
        setDetalleOpen={setDetalleOpen}
        metodosPago={metodosPago}
      />
    </div>
  );
}
