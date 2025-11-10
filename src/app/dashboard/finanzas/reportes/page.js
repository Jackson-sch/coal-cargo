"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  TrendingUp,
  DollarSign,
  CreditCard,
  Calendar,
  Printer,
  RefreshCcw,
} from "lucide-react";
import {
  getResumenPagos,
  getResumenPagosPorMetodo,
  getResumenPagosPorSucursal,
  getResumenPagosPorCliente,
  getResumenPagosPorEstado,
  getSeriePagosPorDia,
} from "@/lib/actions/pagos";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getSucursales } from "@/lib/actions/sucursales";
import { getClientes } from "@/lib/actions/clientes";
import { useFechaDesde, useFechaHasta } from "@/hooks/useQueryParams";

export default function ReportesFinancierosPage() {
  const [loading, setLoading] = useState(false);

  // Query params con nuqs (sincronizados con URL)
  const [fechaDesde, setFechaDesde] = useFechaDesde(null);
  const [fechaHasta, setFechaHasta] = useFechaHasta(null);

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
  const [resumen, setResumen] = useState({
    totalPagos: 0,
    totalEnvios: 0,
    saldoPorCobrar: 0,
    porcentajeCobrado: 0,
    ticketPromedio: 0,
    cantidadPagos: 0,
  });
  const [porMetodo, setPorMetodo] = useState([]);
  const [porSucursal, setPorSucursal] = useState([]);
  const [porCliente, setPorCliente] = useState([]);
  const [porEstado, setPorEstado] = useState([]);
  const [serieDia, setSerieDia] = useState([]);
  const [filtros, setFiltros] = useState({
    metodo: "",
    sucursalOrigenId: "",
    clienteId: "",
    estadoEnvio: "",
  });
  const [sucursales, setSucursales] = useState([]);
  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteOptions, setClienteOptions] = useState([]);

  // Los query params ahora se sincronizan automáticamente con nuqs

  // Cargar listas auxiliares
  useEffect(() => {
    async function cargarAux() {
      try {
        const res = await getSucursales();
        if (res?.success) setSucursales(res.data || []);
      } catch {}
    }
    cargarAux();
  }, []);

  // Cargar datos de reportes
  useEffect(() => {
    async function cargar() {
      setLoading(true);
      try {
        let fechaDesde, fechaHasta;
        if (rangoFechas?.from) {
          const f = rangoFechas.from;
          const t = rangoFechas.to || rangoFechas.from;
          const fmt = (d) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
              2,
              "0"
            )}-${String(d.getDate()).padStart(2, "0")}`;
          fechaDesde = fmt(f);
          fechaHasta = fmt(t);
        }

        const common = {
          fechaDesde,
          fechaHasta,
          metodo: filtros.metodo || undefined,
          sucursalOrigenId: filtros.sucursalOrigenId || undefined,
          clienteId: filtros.clienteId || undefined,
          estadoEnvio: filtros.estadoEnvio || undefined,
        };

        const [res1, res2, res3, res4, res5, res6] = await Promise.all([
          getResumenPagos(common),
          getResumenPagosPorMetodo(common),
          getResumenPagosPorSucursal(common),
          getResumenPagosPorCliente(common),
          getResumenPagosPorEstado(common),
          getSeriePagosPorDia(common),
        ]);

        if (res1?.success)
          setResumen(
            res1.data || {
              totalPagos: 0,
              totalEnvios: 0,
              saldoPorCobrar: 0,
              porcentajeCobrado: 0,
              ticketPromedio: 0,
              cantidadPagos: 0,
            }
          );
        if (res2?.success) setPorMetodo(res2.data || []);
        if (res3?.success) setPorSucursal(res3.data || []);
        if (res4?.success) setPorCliente(res4.data || []);
        if (res5?.success) setPorEstado(res5.data || []);
        if (res6?.success) setSerieDia(res6.data || []);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [rangoFechas, filtros]);

  const imprimir = () => {
    try {
      window.print();
    } catch {}
  };

  const limpiarRango = () => setRangoFechas(undefined);

  // Presets de fecha
  const setHoy = () => {
    const d = new Date();
    setRangoFechas({ from: d, to: d });
  };

  const setUltimos7 = () => {
    const t = new Date();
    const f = new Date();
    f.setDate(f.getDate() - 6);
    setRangoFechas({ from: f, to: t });
  };

  const setMesActual = () => {
    const now = new Date();
    const f = new Date(now.getFullYear(), now.getMonth(), 1);
    const t = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setRangoFechas({ from: f, to: t });
  };

  // Buscar clientes
  const buscarClientes = async () => {
    try {
      const res = await getClientes({ busqueda: clienteQuery, limit: 10 });
      if (res?.success)
        setClienteOptions(
          (res.data || []).map((c) => ({
            id: c.id,
            nombre: c.razonSocial || c.nombre,
          }))
        );
    } catch {}
  };

  // Export CSV util (UTF-8 con BOM y escape correcto)
  const downloadCSV = (filename, rows) => {
    const delimiter = ";"; // Usar punto y coma (Excel en es-PE suele preferirlo)
    const esc = (v) => {
      const s = String(v ?? "");
      const clean = s.replace(/\r?\n/g, " ");
      return `"${clean.replace(/"/g, '""')}"`;
    };
    const csv = rows.map((r) => r.map(esc).join(delimiter)).join("\n");
    const BOM = "\ufeff"; // BOM UTF-8 para que Excel respete acentos
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportResumen = () => {
    const rows = [
      [
        "Total Pagos",
        "Total Envíos",
        "Saldo por Cobrar",
        "% Cobrado",
        "Ticket Promedio",
        "Cantidad Pagos",
      ],
      [
        resumen.totalPagos,
        resumen.totalEnvios,
        resumen.saldoPorCobrar,
        resumen.porcentajeCobrado.toFixed(2),
        resumen.ticketPromedio.toFixed(2),
        resumen.cantidadPagos,
      ],
    ];
    downloadCSV("resumen_finanzas.csv", rows);
  };

  const exportPorMetodo = () => {
    const rows = [
      ["Método", "Cantidad", "Total"],
      ...porMetodo.map((m) => [m.metodo, m.cantidad, m.total]),
    ];
    downloadCSV("totales_por_metodo.csv", rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Reportes Financieros
          </h1>
          <p className="text-muted-foreground">
            Análisis de ingresos y pagos por período
          </p>
        </div>
        <div className="no-print flex items-center gap-2">
          <Button variant="outline" onClick={imprimir}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Cabecera de impresión */}
      <div className="hidden print:block text-sm mb-2">
        <div>
          Rango:
          {rangoFechas?.from
            ? `${rangoFechas.from.toLocaleDateString()} al ${(
                rangoFechas.to || rangoFechas.from
              ).toLocaleDateString()}`
            : "Todos"}
        </div>
        <div>
          Filtros: Método {filtros.metodo || "Todos"} | Sucursal
          {sucursales.find((s) => s.id === filtros.sucursalOrigenId)?.nombre ||
            "Todas"}
          | Cliente
          {clienteOptions.find((c) => c.id === filtros.clienteId)?.nombre ||
            "Todos"}
          | Estado {filtros.estadoEnvio || "Todos"}
        </div>
      </div>

      {/* Filtros */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <DatePickerWithRange
                  date={rangoFechas}
                  setDate={setRangoFechas}
                  placeholder="Seleccionar rango de fechas"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={limpiarRango}
                  aria-label="Limpiar rango"
                  disabled={!rangoFechas?.from}
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={setHoy}>
                  Hoy
                </Button>
                <Button variant="outline" size="sm" onClick={setUltimos7}>
                  Últimos 7 días
                </Button>
                <Button variant="outline" size="sm" onClick={setMesActual}>
                  Mes en curso
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Método</label>
                <Select
                  value={filtros.metodo}
                  onValueChange={(v) =>
                    setFiltros((f) => ({ ...f, metodo: v === "ALL" ? "" : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="EFECTIVO">EFECTIVO</SelectItem>
                    <SelectItem value="TRANSFERENCIA">TRANSFERENCIA</SelectItem>
                    <SelectItem value="TARJETA">TARJETA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Sucursal Origen
                </label>
                <Select
                  value={filtros.sucursalOrigenId}
                  onValueChange={(v) =>
                    setFiltros((f) => ({
                      ...f,
                      sucursalOrigenId: v === "ALL" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas</SelectItem>
                    {sucursales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Estado Envío
                </label>
                <Select
                  value={filtros.estadoEnvio}
                  onValueChange={(v) =>
                    setFiltros((f) => ({
                      ...f,
                      estadoEnvio: v === "ALL" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
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
              <div>
                <label className="text-sm text-muted-foreground">Cliente</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={clienteQuery}
                    onChange={(e) => setClienteQuery(e.target.value)}
                    placeholder="Buscar cliente"
                  />
                  <Button variant="outline" size="sm" onClick={buscarClientes}>
                    Buscar
                  </Button>
                </div>
                <Select
                  value={filtros.clienteId}
                  onValueChange={(v) =>
                    setFiltros((f) => ({
                      ...f,
                      clienteId: v === "ALL" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    {clienteOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen (solo pantalla) */}
      <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Total Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {Number(resumen.totalPagos || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              En el período seleccionado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Total Envíos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {Number(resumen.totalEnvios || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Suma de totales de envíos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Saldo por Cobrar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {Number(resumen.saldoPorCobrar || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total envíos - total pagos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPIs adicionales (solo pantalla) */}
      <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />% Cobrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(resumen.porcentajeCobrado || 0).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Total pagos / total envíos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Ticket Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {Number(resumen.ticketPromedio || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Promedio por pago</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Cantidad Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(resumen.cantidadPagos || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Pagos registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones de Exportación */}
      <div className="no-print flex items-center gap-2">
        <Button variant="outline" onClick={exportResumen}>
          Exportar Resumen CSV
        </Button>
        <Button variant="outline" onClick={exportPorMetodo}>
          Exportar Método CSV
        </Button>
      </div>

      {/* Resumen compacto (solo impresión) */}
      <div className="hidden print:block mb-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Total Pagos</TableHead>
              <TableHead>Total Envíos</TableHead>
              <TableHead>Saldo por Cobrar</TableHead>
              <TableHead>% Cobrado</TableHead>
              <TableHead>Ticket Promedio</TableHead>
              <TableHead>Cantidad Pagos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                S/ {Number(resumen.totalPagos || 0).toFixed(2)}
              </TableCell>
              <TableCell>
                S/ {Number(resumen.totalEnvios || 0).toFixed(2)}
              </TableCell>
              <TableCell>
                S/ {Number(resumen.saldoPorCobrar || 0).toFixed(2)}
              </TableCell>
              <TableCell>
                {Number(resumen.porcentajeCobrado || 0).toFixed(2)}%
              </TableCell>
              <TableCell>
                S/ {Number(resumen.ticketPromedio || 0).toFixed(2)}
              </TableCell>
              <TableCell>{Number(resumen.cantidadPagos || 0)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Totales por Método */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Totales por Método
          </CardTitle>
        </CardHeader>
        <CardContent className="print-table avoid-break">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porMetodo.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    {loading ? "Cargando..." : "Sin datos en el período"}
                  </TableCell>
                </TableRow>
              )}
              {porMetodo.map((m) => (
                <TableRow key={m.metodo}>
                  <TableCell className="font-medium">{m.metodo}</TableCell>
                  <TableCell className="text-right">{m.cantidad}</TableCell>
                  <TableCell className="text-right">
                    S/ {Number(m.total || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totales por Sucursal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Totales por Sucursal Origen
          </CardTitle>
        </CardHeader>
        <CardContent className="print-table avoid-break">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sucursal</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porSucursal.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    {loading ? "Cargando..." : "Sin datos"}
                  </TableCell>
                </TableRow>
              )}
              {porSucursal.map((s) => (
                <TableRow key={s.sucursalId}>
                  <TableCell className="font-medium">
                    {s.sucursalNombre}
                  </TableCell>
                  <TableCell className="text-right">{s.cantidad}</TableCell>
                  <TableCell className="text-right">
                    S/ {Number(s.total || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Top Clientes
          </CardTitle>
        </CardHeader>
        <CardContent className="print-table avoid-break">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porCliente.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    {loading ? "Cargando..." : "Sin datos"}
                  </TableCell>
                </TableRow>
              )}
              {porCliente.map((c) => (
                <TableRow key={c.clienteId}>
                  <TableCell className="font-medium">
                    {c.clienteNombre}
                  </TableCell>
                  <TableCell className="text-right">{c.cantidad}</TableCell>
                  <TableCell className="text-right">
                    S/ {Number(c.total || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totales por Estado de Envío */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Totales por Estado de Envío
          </CardTitle>
        </CardHeader>
        <CardContent className="print-table avoid-break">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porEstado.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    {loading ? "Cargando..." : "Sin datos"}
                  </TableCell>
                </TableRow>
              )}
              {porEstado.map((e) => (
                <TableRow key={e.estado}>
                  <TableCell className="font-medium">{e.estado}</TableCell>
                  <TableCell className="text-right">{e.cantidad}</TableCell>
                  <TableCell className="text-right">
                    S/ {Number(e.total || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Serie por día */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Serie de Pagos por Día
          </CardTitle>
        </CardHeader>
        <CardContent className="print-table avoid-break">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serieDia.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    {loading ? "Cargando..." : "Sin datos"}
                  </TableCell>
                </TableRow>
              )}
              {serieDia.map((d) => (
                <TableRow key={d.fecha}>
                  <TableCell className="font-medium">{d.fecha}</TableCell>
                  <TableCell className="text-right">{d.cantidad}</TableCell>
                  <TableCell className="text-right">
                    S/ {Number(d.total || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
