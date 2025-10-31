"use client";
import { useState, useEffect, useCallback } from "react";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RefreshCw,
  Download,
  Package,
  CheckCircle,
  Clock,
  MapPin,
  FileDown,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";
import { getEnvios } from "@/lib/actions/envios";
import { useEmpresaConfig } from "@/hooks/use-empresa-config";
import Paginator from "@/components/ui/paginator";
import { formatSoles } from "@/lib/utils/formatters";
const ITEMS_PER_PAGE = 10;
export default function ReportesPage() {
  const [loading, setLoading] = useState(true);
  const [envios, setEnvios] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { empresaConfig } = useEmpresaConfig();
  const [searchQuery, setSearchQuery] = useState("");
  const [estado, setEstado] = useState("todos");
  const [fechaFiltro, setFechaFiltro] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const formatEstadoLabel = (val) => {
    if (!val || val === "todos") return "Todos";
    return val
      .toString()
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };
  const fetchEnvios = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: ITEMS_PER_PAGE };
      if (searchQuery) params.guia = searchQuery;
      if (estado !== "todos") params.estado = estado;
      if (fechaFiltro !== "todos") {
        const hoy = new Date();
        let fechaDesde, fechaHasta;
        switch (fechaFiltro) {
          case "hoy":
            fechaDesde = startOfDay(hoy);
            fechaHasta = endOfDay(hoy);
            break;
          case "semana":
            fechaDesde = startOfDay(subDays(hoy, 7));
            fechaHasta = endOfDay(hoy);
            break;
          case "mes":
            fechaDesde = startOfDay(subDays(hoy, 30));
            fechaHasta = endOfDay(hoy);
            break;
        }
        if (fechaDesde) params.fechaDesde = fechaDesde.toISOString();
        if (fechaHasta) params.fechaHasta = fechaHasta.toISOString();
      }

      const result = await getEnvios(params);
      if (result.success) {
        setEnvios(result.data.envios);
        setTotal(result.data.pagination.total);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        toast.error(result.error || "Error al cargar reportes de envíos");
      }
    } catch (err) {
      toast.error("Error al cargar reportes de envíos");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, estado, fechaFiltro]);
  useEffect(() => {
    fetchEnvios();
  }, [fetchEnvios]);
  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };
  const handleEstado = (value) => {
    setEstado(value);
    setCurrentPage(1);
  };
  const handleFechaFiltro = (value) => {
    setFechaFiltro(value);
    setCurrentPage(1);
  };
  const exportToExcel = () => {
    try {
      const data = envios.map((e) => ({
        Guia: e.guia,
        Estado: formatEstadoLabel(e.estado),
        "Sucursal Origen": e.sucursalOrigen?.nombre || "",
        "Sucursal Destino": e.sucursalDestino?.nombre || "",
        Remitente: e.remitenteNombre || "",
        Destinatario: e.destinatarioNombre || "",
        "Fecha Registro": e.fechaRegistro
          ? format(new Date(e.fechaRegistro), "dd/MM/yyyy HH:mm", {
              locale: es,
            })
          : "",
        "Fecha Entrega": e.fechaEntrega
          ? format(new Date(e.fechaEntrega), "dd/MM/yyyy HH:mm", { locale: es })
          : "",
        Total: e.total ?? 0,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Envios");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const ts = new Date().toISOString().split("T")[0];
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `reportes_envios_${ts}.xlsx`;
      a.click();
      toast.success("Reporte exportado correctamente");
    } catch (err) {
      toast.error("Error al exportar reporte");
    }
  };
  const buildExportParams = () => {
    const params = { page: 1 };
    if (searchQuery) params.guia = searchQuery;
    if (estado !== "todos") params.estado = estado;
    if (fechaFiltro !== "todos") {
      const hoy = new Date();
      let fechaDesde, fechaHasta;
      switch (fechaFiltro) {
        case "hoy":
          fechaDesde = startOfDay(hoy);
          fechaHasta = endOfDay(hoy);
          break;
        case "semana":
          fechaDesde = startOfDay(subDays(hoy, 7));
          fechaHasta = endOfDay(hoy);
          break;
        case "mes":
          fechaDesde = startOfDay(subDays(hoy, 30));
          fechaHasta = endOfDay(hoy);
          break;
      }
      if (fechaDesde) params.fechaDesde = fechaDesde.toISOString();
      if (fechaHasta) params.fechaHasta = fechaHasta.toISOString();
    }
    return params;
  };
  const exportAllToExcel = async () => {
    try {
      const params = buildExportParams();
      params.limit = total || 10000;
      const result = await getEnvios(params);
      if (!result.success)
        throw new Error(result.error || "Error obteniendo datos");
      const allEnvios = result.data.envios;
      const data = allEnvios.map((e) => ({
        Guia: e.guia,
        Estado: formatEstadoLabel(e.estado),
        "Sucursal Origen": e.sucursalOrigen?.nombre || "",
        "Sucursal Destino": e.sucursalDestino?.nombre || "",
        Remitente: e.remitenteNombre || "",
        Destinatario: e.destinatarioNombre || "",
        "Fecha Registro": e.fechaRegistro
          ? format(new Date(e.fechaRegistro), "dd/MM/yyyy HH:mm", {
              locale: es,
            })
          : "",
        "Fecha Entrega": e.fechaEntrega
          ? format(new Date(e.fechaEntrega), "dd/MM/yyyy HH:mm", { locale: es })
          : "",
        Total: e.total ?? 0,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Envios");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const ts = new Date().toISOString().split("T")[0];
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `reportes_envios_todo_${ts}.xlsx`;
      a.click();
      toast.success("Reporte completo exportado correctamente");
    } catch (err) {
      toast.error("Error al exportar reporte completo");
    }
  };
  const exportToCSV = () => {
    try {
      const headers = [
        "Guia",
        "Estado",
        "Sucursal Origen",
        "Sucursal Destino",
        "Remitente",
        "Destinatario",
        "Fecha Registro",
        "Fecha Entrega",
        "Total",
      ];
      const rows = envios.map((e) => [
        e.guia,
        formatEstadoLabel(e.estado),
        e.sucursalOrigen?.nombre || "",
        e.sucursalDestino?.nombre || "",
        e.remitenteNombre || "",
        e.destinatarioNombre || "",
        e.fechaRegistro
          ? format(new Date(e.fechaRegistro), "dd/MM/yyyy HH:mm", {
              locale: es,
            })
          : "",
        e.fechaEntrega
          ? format(new Date(e.fechaEntrega), "dd/MM/yyyy HH:mm", { locale: es })
          : "",
        e.total ?? 0,
      ]);
      const csvContent = [headers, ...rows]
        .map((r) =>
          r.map((v) => `${String(v).replaceAll('"', '""')}`).join(",")
        )
        .join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const ts = new Date().toISOString().split("T")[0];
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `reportes_envios_${ts}.csv`;
      a.click();
      toast.success("CSV exportado correctamente");
    } catch (err) {
      toast.error("Error al exportar CSV");
    }
  };
  const exportToPDF = () => {
    try {
      const win = window.open("", "_blank");
      if (!win) throw new Error("No se pudo abrir ventana de impresión");
      const ts = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });
      const totalPage = envios.reduce((acc, e) => acc + (e.total || 0), 0);
      const rows = envios
        .map(
          (e) =>
            ` <tr> <td>${e.guia || "-"}</td> <td>${
              formatEstadoLabel(e.estado) || "-"
            }</td> <td>${e.remitenteNombre || "-"}</td> <td>${
              e.destinatarioNombre || "-"
            }</td> <td>${e.sucursalOrigen?.nombre || "-"}</td> <td>${
              e.sucursalDestino?.nombre || "-"
            }</td> <td>${
              e.fechaRegistro
                ? format(new Date(e.fechaRegistro), "dd/MM/yyyy HH:mm", {
                    locale: es,
                  })
                : "-"
            }</td> <td>${
              e.fechaEntrega
                ? format(new Date(e.fechaEntrega), "dd/MM/yyyy HH:mm", {
                    locale: es,
                  })
                : "-"
            }</td> <td>${formatSoles(e.total || 0)}</td> </tr>`
        )
        .join("");
      const empresaNombre = (empresaConfig?.nombre || "Mi Empresa").replace(
        /</g,
        "&lt;"
      );
      const empresaRuc = (
        empresaConfig?.ruc ? `RUC ${empresaConfig.ruc}` : ""
      ).replace(/</g, "&lt;");
      const empresaDireccion = (empresaConfig?.direccion || "").replace(
        /</g,
        "&lt;"
      );
      const empresaTelefono = (
        empresaConfig?.telefono ? `Tel: ${empresaConfig.telefono}` : ""
      ).replace(/</g, "&lt;");
      const html = ` <html> <head> <title>Reporte de Envíos</title> <style> body { font-family: Arial, sans-serif; padding: 20px; color: #222; } .header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; } .header .logo { height: 48px; width: auto; object-fit: contain; } .header .empresa { line-height: 1.2; } .empresa .nombre { font-size: 18px; font-weight: 700; } .empresa .meta { font-size: 12px; color: #555; } h1 { font-size: 16px; margin: 16px 0 6px 0; } .sub { color: #555; margin-bottom: 12px; font-size: 12px; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; } th { background: #f5f5f5; text-align: left; } th:last-child, td:last-child { text-align: right; } thead { display: table-header-group; } tfoot { display: table-row-group; } tr { page-break-inside: avoid; } .hr { height: 1px; background: #e5e7eb; border: 0; margin: 8px 0 12px; } tfoot td { font-weight: 700; background: #fafafa; } .footer { position: fixed; left: 0; right: 0; bottom: 0; font-size: 12px; color: #555; display: flex; justify-content: flex-end; align-items: center; border-top: 1px solid #e5e7eb; padding: 6px 20px; background: #ffffff; } body { padding-bottom: 42px; } .pagenum:before { content: counter(page); } .pagecount:before { content: counter(pages); } @media print { .no-print { display: none; } body { padding: 12mm; } }
            </style> </head> <body> <div class="header"> <img src="/logo.png" class="logo" alt="Logo" onerror="this.style.display='none'" /> <div class="empresa"> <div class="nombre">${empresaNombre}</div> <div class="meta">${empresaRuc}</div> ${
        empresaDireccion ? `<div class="meta">${empresaDireccion}</div>` : ""
      } ${
        empresaTelefono ? `<div class="meta">${empresaTelefono}</div>` : ""
      } </div> </div> <hr class="hr" /> <h1>Reporte de Envíos</h1> <div class="sub">Generado: ${ts} — Filtros: Estado=${formatEstadoLabel(
        estado
      )}, Fecha=${formatEstadoLabel(
        fechaFiltro
      )}</div> <table> <thead> <tr> <th>Guía</th> <th>Estado</th> <th>Remitente</th> <th>Destinatario</th> <th>Origen</th> <th>Destino</th> <th>Registro</th> <th>Entrega</th> <th>Total</th> </tr> </thead> <tbody> ${rows} </tbody> <tfoot> <tr> <td colspan="8" style="text-align:right">Total</td> <td>${formatSoles(
        totalPage
      )}</td> </tr> </tfoot> </table> <div class="footer">Página <span class="pagenum"></span> de <span class="pagecount"></span></div> <script> // Lanzar impresión al carga r
              window.onload = () => setTimeout(() => { window.print(); }, 250); // Cerrar la ventana cuando termine la impresió n
              window.onafterprint = () => { try { window.close(); } catch (e) {} }; // Fallback para navegadores que usan media query de prin t
              try { const mql = window.matchMedia('print'); if (mql && mql.addEventListener) { mql.addEventListener('change', (e) => { if (!e.matches) { setTimeout(() => { try { window.close(); } catch (e) {} }, 150); }
                  }); }
              } catch (_) {} // Fallback adicional por si no se dispara afterprin t
              setTimeout(() => { try { window.close(); } catch (e) {} }, 5000); </script> </body> </html>`;
      win.document.write(html);
      win.document.close();
    } catch (err) {
      toast.error("Error al generar PDF");
    }
  };
  const totalPagina = envios.reduce((acc, e) => acc + (e.total || 0), 0);
  const entregadosPagina = envios.filter(
    (e) => e.estado === "ENTREGADO"
  ).length;
  const pendientesPagina = envios.filter(
    (e) => e.estado !== "ENTREGADO"
  ).length;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">
            Genera reportes de envíos con filtros y exportación
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Excel (página)
          </Button>
          <Button onClick={exportAllToExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Excel (todo)
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button onClick={exportToPDF} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button onClick={fetchEnvios} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
          </Button>
        </div>
      </div>
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total resultados
            </CardTitle>
            <Package className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              Envíos según filtros
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Entregados (página)
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {entregadosPagina}
            </div>
            <p className="text-xs text-muted-foreground">
              Cantidad en esta página
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendientes (página)
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {pendientesPagina}
            </div>
            <p className="text-xs text-muted-foreground">
              Cantidad en esta página
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total (página)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSoles(totalPagina)}</div>
            <p className="text-xs text-muted-foreground">Suma de esta página</p>
          </CardContent>
        </Card>
      </div>
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Busca y filtra para generar reportes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número de guía..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full sm:w-60">
              <Select value={estado} onValueChange={handleEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="REGISTRADO">
                    {formatEstadoLabel("REGISTRADO")}
                  </SelectItem>
                  <SelectItem value="EN_BODEGA">
                    {formatEstadoLabel("EN_BODEGA")}
                  </SelectItem>
                  <SelectItem value="EN_TRANSITO">
                    {formatEstadoLabel("EN_TRANSITO")}
                  </SelectItem>
                  <SelectItem value="EN_REPARTO">
                    {formatEstadoLabel("EN_REPARTO")}
                  </SelectItem>
                  <SelectItem value="ENTREGADO">
                    {formatEstadoLabel("ENTREGADO")}
                  </SelectItem>
                  <SelectItem value="DEVUELTO">
                    {formatEstadoLabel("DEVUELTO")}
                  </SelectItem>
                  <SelectItem value="ANULADO">
                    {formatEstadoLabel("ANULADO")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={fechaFiltro} onValueChange={handleFechaFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="hoy">Hoy</SelectItem>
                  <SelectItem value="semana">Última semana</SelectItem>
                  <SelectItem value="mes">Último mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados ({total})</CardTitle>
          <CardDescription>Lista según filtros aplicados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : envios.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                No hay resultados
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajusta los filtros para encontrar datos
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guía</TableHead> 
                    <TableHead>Estado</TableHead>
                    <TableHead>Remitente / Destinatario</TableHead>
                    <TableHead>Origen → Destino</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Entrega</TableHead> 
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {envios.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.guia}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{e.estado}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Remitente
                          </div>
                          <div className="font-medium text-sm capitalize">
                            {e.remitenteNombre || "-"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Destinatario
                          </div>
                          <div className="font-medium text-sm capitalize">
                            {e.destinatarioNombre || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {e.sucursalOrigen?.nombre}
                          </div>
                          <div className="text-muted-foreground">↓</div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {e.sucursalDestino?.nombre}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {e.fechaRegistro
                          ? format(
                              new Date(e.fechaRegistro),
                              "dd/MM/yyyy HH:mm",
                              { locale: es }
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {e.fechaEntrega
                          ? format(
                              new Date(e.fechaEntrega),
                              "dd/MM/yyyy HH:mm",
                              { locale: es }
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatSoles(e.total || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {/* Paginación */}
          <div className="py-4">
            <Paginator
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              total={total}
              entityLabel="resultados"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
