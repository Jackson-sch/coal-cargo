"use client";

import { useEffect, useState, useMemo } from "react";
import { getCuentasPorCobrar, registrarPago } from "@/lib/actions/pagos";
import { getSucursales } from "@/lib/actions/sucursales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
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
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Printer, Filter, CreditCard, Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useEmpresaConfig } from "@/hooks/use-empresa-config";
import { toast } from "sonner";
import {
  useSucursalOrigen,
  useSucursalDestino,
  useBusqueda,
  useMetodoPago,
  useFechaDesde,
  useFechaHasta,
  usePage,
  useTipoFecha,
} from "@/hooks/useQueryParams";
import { useQueryState, parseAsString } from "nuqs";

export default function CuentasPorCobrarPage() {
  const { empresaConfig } = useEmpresaConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [resumen, setResumen] = useState({
    totalSaldo: 0,
    totalPagado: 0,
    enviosConSaldo: 0,
    totalEnvios: 0,
  });
  // Query params con nuqs (sincronizados con URL)
  const [page, setPage] = usePage(1);
  const [sucursalOrigenId, setSucursalOrigenId] = useSucursalOrigen(null);
  const [sucursalDestinoId, setSucursalDestinoId] = useSucursalDestino(null);
  const [busquedaCliente, setBusquedaCliente] = useBusqueda("");
  const [estadoEnvio, setEstadoEnvio] = useQueryState(
    "estadoEnvio",
    parseAsString.withDefault("")
  );
  const [metodoPago, setMetodoPago] = useMetodoPago("");
  const [fechaDesde, setFechaDesde] = useFechaDesde(null);
  const [fechaHasta, setFechaHasta] = useFechaHasta(null);
  const [tipoFecha, setTipoFecha] = useTipoFecha("envio");

  // Paginación (solo limit, total, totalPages son estado local)
  const [pagination, setPagination] = useState({
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // Construir objeto rangoFechas desde los hooks (para mantener compatibilidad)
  const rangoFechas = useMemo(() => {
    if (!fechaDesde && !fechaHasta) return undefined;
    return {
      from: fechaDesde ? new Date(fechaDesde) : null,
      to: fechaHasta
        ? new Date(fechaHasta)
        : fechaDesde
        ? new Date(fechaDesde)
        : null,
    };
  }, [fechaDesde, fechaHasta]);

  // Función para actualizar rangoFechas (mantiene compatibilidad)
  const setRangoFechas = (rango) => {
    if (!rango) {
      setFechaDesde(null);
      setFechaHasta(null);
      return;
    }
    setFechaDesde(rango.from ? rango.from.toISOString().split("T")[0] : null);
    setFechaHasta(rango.to ? rango.to.toISOString().split("T")[0] : null);
  };

  // Construir objeto filtros desde los hooks (para mantener compatibilidad)
  const filtros = useMemo(
    () => ({
      sucursalOrigenId: sucursalOrigenId || "",
      sucursalDestinoId: sucursalDestinoId || "",
      busquedaCliente: busquedaCliente || "",
      estadoEnvio: estadoEnvio || "",
      metodoPago: metodoPago || "",
    }),
    [
      sucursalOrigenId,
      sucursalDestinoId,
      busquedaCliente,
      estadoEnvio,
      metodoPago,
    ]
  );

  // Función para actualizar filtros (mantiene compatibilidad)
  const setFiltros = (newFiltrosOrUpdater) => {
    const newFiltros =
      typeof newFiltrosOrUpdater === "function"
        ? newFiltrosOrUpdater(filtros)
        : newFiltrosOrUpdater;

    if (newFiltros.sucursalOrigenId !== undefined) {
      setSucursalOrigenId(
        newFiltros.sucursalOrigenId === "" ||
          newFiltros.sucursalOrigenId === "all"
          ? null
          : newFiltros.sucursalOrigenId
      );
    }
    if (newFiltros.sucursalDestinoId !== undefined) {
      setSucursalDestinoId(
        newFiltros.sucursalDestinoId === "" ||
          newFiltros.sucursalDestinoId === "all"
          ? null
          : newFiltros.sucursalDestinoId
      );
    }
    if (newFiltros.busquedaCliente !== undefined) {
      setBusquedaCliente(newFiltros.busquedaCliente || null);
    }
    if (newFiltros.estadoEnvio !== undefined) {
      setEstadoEnvio(
        newFiltros.estadoEnvio === "" || newFiltros.estadoEnvio === "all"
          ? null
          : newFiltros.estadoEnvio
      );
    }
    if (newFiltros.metodoPago !== undefined) {
      setMetodoPago(
        newFiltros.metodoPago === "" || newFiltros.metodoPago === "all"
          ? null
          : newFiltros.metodoPago
      );
    }
  };

  const [sucursales, setSucursales] = useState([]);

  useEffect(() => {
    getSucursales()
      .then((sucsRes) => {
        if (sucsRes?.success) setSucursales(sucsRes.data || []);
      })
      .catch(() => {});
  }, []);

  const fmtISO = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  const todayISO = () => fmtISO(new Date());

  const busquedaDebounced = useDebounce(busquedaCliente, 400);

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

  const [pagoModal, setPagoModal] = useState({
    open: false,
    guia: "",
    saldo: 0,
    monto: "",
    metodo: "EFECTIVO",
    referencia: "",
    fecha: todayISO(),
  });

  const cargar = async (pageNum = page) => {
    setLoading(true);
    setError(null);
    try {
      let fechaDesde, fechaHasta, fechaPagoDesde, fechaPagoHasta;
      if (rangoFechas?.from) {
        if (tipoFecha === "envio") {
          fechaDesde = fmtISO(rangoFechas.from);
          fechaHasta = fmtISO(rangoFechas.to || rangoFechas.from);
        } else {
          fechaPagoDesde = fmtISO(rangoFechas.from);
          fechaPagoHasta = fmtISO(rangoFechas.to || rangoFechas.from);
        }
      }

      // Normalizar valores de Select: "all" -> "" para no filtrar
      const normalize = (v) => (v === "all" ? "" : v);

      const res = await getCuentasPorCobrar({
        fechaDesde,
        fechaHasta,
        sucursalOrigenId: normalize(filtros.sucursalOrigenId),
        sucursalDestinoId: normalize(filtros.sucursalDestinoId),
        busquedaCliente: busquedaDebounced || undefined,
        estadoEnvio: normalize(filtros.estadoEnvio),
        metodoPago: normalize(filtros.metodoPago),
        fechaPagoDesde,
        fechaPagoHasta,
        page: pageNum,
        limit: pagination.limit,
      });

      if (res.success) {
        setItems(res.data.items);
        setResumen(res.data.resumen);
        // Actualizar paginación pero mantener page del hook de nuqs
        const { page: _, ...paginationData } = res.data.pagination;
        setPagination(paginationData);
      } else {
        setError(res.error || "Error al cargar datos");
      }
    } catch (e) {
      setError("Error inesperado al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar(1);
  }, []);

  // Resetear página cuando cambian los filtros (excepto page)
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [
    sucursalOrigenId,
    sucursalDestinoId,
    estadoEnvio,
    metodoPago,
    busquedaDebounced,
    fechaDesde,
    fechaHasta,
    tipoFecha,
  ]);

  // Cargar cuando cambia la página o los filtros
  useEffect(() => {
    cargar(page);
  }, [
    page,
    sucursalOrigenId,
    sucursalDestinoId,
    estadoEnvio,
    metodoPago,
    busquedaDebounced,
    fechaDesde,
    fechaHasta,
    tipoFecha,
  ]);

  const exportarCSV = () => {
    const bom = "\uFEFF";
    const headers = [
      "Guía",
      "Cliente",
      "Sucursal Origen",
      "Sucursal Destino",
      "Estado",
      "Fecha Registro",
      "Total",
      "Pagado",
      "Saldo",
    ];
    const rows = items.map((i) => [
      i.guia || "",
      i.clienteNombre || "",
      i.sucursalOrigenNombre || "",
      i.sucursalDestinoNombre || "",
      i.estado || "",
      i.fechaRegistro ? new Date(i.fechaRegistro).toLocaleDateString() : "",
      i.total?.toFixed(2),
      i.pagado?.toFixed(2),
      i.saldo?.toFixed(2),
    ]);
    const csv = [
      headers.join(";"),
      ...rows.map((r) =>
        r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")
      ),
    ].join("\n");
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cuentas_por_cobrar.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const limpiar = () => {
    setRangoFechas(undefined);
    setTipoFecha("envio");
    setSucursalOrigenId(null);
    setSucursalDestinoId(null);
    setBusquedaCliente(null);
    setEstadoEnvio(null);
    setMetodoPago(null);
    setPage(1);
    // cargar se ejecutará automáticamente cuando cambien los filtros
  };

  const displayCliente = (c) =>
    c.esEmpresa && c.razonSocial
      ? c.razonSocial
      : `${c.nombre ?? ""} ${c.apellidos ?? ""}`.trim();

  const registrarPagoHandler = async () => {
    if (!pagoModal.monto || parseFloat(pagoModal.monto) <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }

    try {
      const res = await registrarPago({
        guia: pagoModal.guia,
        monto: parseFloat(pagoModal.monto),
        metodo: pagoModal.metodo,
        referencia: pagoModal.referencia,
        fecha: pagoModal.fecha,
      });

      if (res.success) {
        toast.success("Pago registrado correctamente");
        setPagoModal({ ...pagoModal, open: false });
        cargar(page);
      } else {
        toast.error(res.error || "Error al registrar pago");
      }
    } catch (error) {
      toast.error("Error al registrar pago");
    }
  };

  return (
    <div className="space-y-6">
      {/* Estilos de impresión específicos para CxC: solo tabla y en horizontal */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 12mm;
          }
          /* Oculta todo excepto el área marcada */
          body * {
            visibility: hidden;
          }
          .cxc-print-area,
          .cxc-print-area * {
            visibility: visible;
          }
          .cxc-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          /* Forzar 4 columnas para KPIs en impresión */
          .cxc-print-kpis {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
          .cxc-print-footer {
            position: fixed;
            bottom: 8mm;
            left: 12mm;
            right: 12mm;
            font-size: 10px;
            color: #666;
          }
        }
      `}</style>

      <div className="flex items-center justify-between no-print">
        <h1 className="text-2xl font-semibold tracking-tight">
          Cuentas por Cobrar
        </h1>
        <div className="flex gap-2 no-print">
          <Button
            variant="outline"
            onClick={exportarCSV}
            disabled={loading || items.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="no-print">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <DatePickerWithRange
                value={rangoFechas}
                onChange={setRangoFechas}
              />
              <div className="text-xs text-muted-foreground mt-1">
                Rango por fecha (
                {tipoFecha === "envio" ? "registro de envío" : "pago"})
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Tipo de fecha
              </label>
              <Select value={tipoFecha} onValueChange={(v) => setTipoFecha(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="envio">Registro de envío</SelectItem>
                  <SelectItem value="pago">Fecha de pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Sucursal Origen
              </label>
              <Select
                value={sucursalOrigenId || "all"}
                onValueChange={(v) => {
                  setSucursalOrigenId(v === "all" ? null : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {sucursales.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Sucursal Destino
              </label>
              <Select
                value={sucursalDestinoId || "all"}
                onValueChange={(v) => {
                  setSucursalDestinoId(v === "all" ? null : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {sucursales.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground">
                Búsqueda de cliente
              </label>
              <div className="mt-1">
                <InputGroup>
                  <InputGroupInput
                    placeholder="Nombre, razón social o documento"
                    value={busquedaCliente || ""}
                    onChange={(e) => {
                      setBusquedaCliente(e.target.value || null);
                      setPage(1);
                    }}
                  />
                  <InputGroupAddon>
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    {busquedaCliente && (
                      <InputGroupButton
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => {
                          setBusquedaCliente(null);
                          setPage(1);
                        }}
                        title="Limpiar"
                      >
                        <X className="h-4 w-4" />
                      </InputGroupButton>
                    )}
                  </InputGroupAddon>
                </InputGroup>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Método de Pago
              </label>
              <Select
                value={metodoPago || "all"}
                onValueChange={(v) => {
                  setMetodoPago(v === "all" ? null : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {metodosPago.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Estado</label>
              <Select
                value={estadoEnvio || "all"}
                onValueChange={(v) => {
                  setEstadoEnvio(v === "all" ? null : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="REGISTRADO">Registrado</SelectItem>
                  <SelectItem value="EN_BODEGA">En Bodega</SelectItem>
                  <SelectItem value="EN_AGENCIA_ORIGEN">En Agencia Origen</SelectItem>
                  <SelectItem value="EN_TRANSITO">En Tránsito</SelectItem>
                  <SelectItem value="EN_AGENCIA_DESTINO">En Agencia Destino</SelectItem>
                  <SelectItem value="EN_REPARTO">En Reparto</SelectItem>
                  <SelectItem value="ENTREGADO">Entregado</SelectItem>
                  <SelectItem value="DEVUELTO">Devuelto</SelectItem>
                  <SelectItem value="ANULADO">Anulado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={limpiar} variant="outline">
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total saldo por cobrar</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            S/ {resumen.totalSaldo?.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total pagado en periodo</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            S/ {resumen.totalPagado?.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Envíos con saldo</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {resumen.enviosConSaldo}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Envíos totales</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {resumen.totalEnvios}
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card className="print-avoid-break">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guía</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Sucursal Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right no-print">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-6">
                      Cargando…
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-6">
                      Sin resultados
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((i) => (
                    <TableRow key={i.id} className="print-avoid-break">
                      <TableCell>{i.guia}</TableCell>
                      <TableCell>{i.clienteNombre}</TableCell>
                      <TableCell>{i.sucursalOrigenNombre}</TableCell>
                      <TableCell>{i.sucursalDestinoNombre}</TableCell>
                      <TableCell>{i.estado}</TableCell>
                      <TableCell>
                        {i.fechaRegistro
                          ? new Date(i.fechaRegistro).toLocaleDateString()
                          : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(i.total).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(i.pagado).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {Number(i.saldo).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right no-print">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={Number(i.saldo) <= 0}
                          onClick={() => {
                            setPagoModal({
                              open: true,
                              guia: i.guia,
                              saldo: Number(i.saldo),
                              monto: Number(i.saldo).toFixed(2),
                              metodo: "EFECTIVO",
                              referencia: "",
                              fecha: todayISO(),
                            });
                          }}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pagar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Pago */}
      <Dialog
        open={pagoModal.open}
        onOpenChange={(open) => setPagoModal({ ...pagoModal, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago - {pagoModal.guia}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Saldo pendiente</label>
              <div className="text-lg font-semibold">
                S/ {pagoModal.saldo.toFixed(2)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Monto a pagar</label>
              <Input
                type="number"
                step="0.01"
                value={pagoModal.monto}
                onChange={(e) =>
                  setPagoModal({ ...pagoModal, monto: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Método de pago</label>
              <Select
                value={pagoModal.metodo}
                onValueChange={(v) => setPagoModal({ ...pagoModal, metodo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metodosPago.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Referencia</label>
              <Input
                value={pagoModal.referencia}
                onChange={(e) =>
                  setPagoModal({ ...pagoModal, referencia: e.target.value })
                }
                placeholder="Número de operación, voucher, etc."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha de pago</label>
              <Input
                type="date"
                value={pagoModal.fecha}
                onChange={(e) =>
                  setPagoModal({ ...pagoModal, fecha: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPagoModal({ ...pagoModal, open: false })}
            >
              Cancelar
            </Button>
            <Button onClick={registrarPagoHandler}>Registrar Pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
