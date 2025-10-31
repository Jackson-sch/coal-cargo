"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Shield,
  Server,
  FileText,
  Search,
  Calendar,
  User,
  AlertTriangle,
  Info,
  AlertCircle,
  XCircle,
  Loader2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  getLogsAuditoria,
  getUsuariosParaFiltros,
  exportarLogsCSV,
} from "@/lib/actions/auditoria";

const CATEGORIAS = [
  { value: "SISTEMA", label: "Sistema", icon: Server },
  { value: "SEGURIDAD", label: "Seguridad", icon: Shield },
  { value: "USUARIOS", label: "Usuarios", icon: User },
  { value: "ENVIOS", label: "Envíos", icon: Activity },
  { value: "CLIENTES", label: "Clientes", icon: User },
  { value: "FACTURACION", label: "Facturación", icon: FileText },
  { value: "CONFIGURACION", label: "Configuración", icon: Server },
  { value: "BACKUP", label: "Respaldos", icon: FileText },
  { value: "AUDITORIA", label: "Auditoría", icon: Shield },
];

const SEVERIDADES = [
  {
    value: "INFO",
    label: "Información",
    color: "bg-blue-100 text-blue-800",
    icon: Info,
  },
  {
    value: "WARNING",
    label: "Advertencia",
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertTriangle,
  },
  {
    value: "ERROR",
    label: "Error",
    color: "bg-red-100 text-red-800",
    icon: AlertCircle,
  },
  {
    value: "CRITICAL",
    label: "Crítico",
    color: "bg-red-100 text-red-900",
    icon: XCircle,
  },
];

export default function AuditoriaClient({ initialEstadisticas, initialLogs }) {
  const [estadisticas, setEstadisticas] = useState(initialEstadisticas);
  const [logs, setLogs] = useState(
    Array.isArray(initialLogs) ? initialLogs : []
  );
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState({
    buscar: "",
    categoria: "TODAS",
    severidad: "TODAS",
    usuarioId: "TODOS",
    fechaDesde: "",
    fechaHasta: "",
    page: 1,
    limit: 50,
  });

  // Cargar usuarios para filtros
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const result = await getUsuariosParaFiltros();
        if (result.success) {
          setUsuarios(result.data);
        }
      } catch (error) {}
    };
    cargarUsuarios();
  }, []);

  // Aplicar filtros
  const aplicarFiltros = async (nuevosFiltros = filtros) => {
    setLoading(true);
    try {
      const result = await getLogsAuditoria(nuevosFiltros);
      if (result.success) {
        setLogs(result.data.logs);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al cargar logs");
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    const nuevosFiltros = {
      ...filtros,
      [campo]: valor,
      page: 1, // Resetear página al cambiar filtros
    };
    setFiltros(nuevosFiltros);
    aplicarFiltros(nuevosFiltros);
  };

  const limpiarFiltros = () => {
    const filtrosLimpios = {
      buscar: "",
      categoria: "TODAS",
      severidad: "TODAS",
      usuarioId: "TODOS",
      fechaDesde: "",
      fechaHasta: "",
      page: 1,
      limit: 50,
    };
    setFiltros(filtrosLimpios);
    aplicarFiltros(filtrosLimpios);
  };

  const exportarCSV = async () => {
    setExporting(true);
    try {
      const result = await exportarLogsCSV(filtros);
      if (result.success) {
        // Crear y descargar CSV
        const csvContent = convertirACSV(result.data);
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `logs_auditoria_${new Date().toISOString().split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Logs exportados exitosamente");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al exportar logs");
    } finally {
      setExporting(false);
    }
  };

  const convertirACSV = (logs) => {
    const headers = [
      "Fecha/Hora",
      "Usuario",
      "Acción",
      "Recurso",
      "Categoría",
      "Severidad",
      "Detalles",
    ];
    const rows = logs.map((log) => [
      new Date(log.fechaHora).toLocaleString(),
      log.usuario?.name || "Sistema",
      log.accion,
      log.recurso,
      log.categoria,
      log.severidad,
      log.detalles || "",
    ]);
    return [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
  };

  const getSeveridadBadge = (severidad) => {
    const config = SEVERIDADES.find((s) => s.value === severidad);
    if (!config) return <Badge variant="outline">{severidad}</Badge>;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getCategoriaBadge = (categoria) => {
    const config = CATEGORIAS.find((c) => c.value === categoria);
    if (!config) return <Badge variant="outline">{categoria}</Badge>;
    return <Badge variant="outline">{config.label}</Badge>;
  };
  return (
    <div className="space-y-6">
      {/* Métricas de Resumen */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estadisticas.totalLogs.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Registros totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.logsHoy}</div>
            <p className="text-xs text-muted-foreground">Logs de hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Logins Fallidos
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {estadisticas.loginsFallidos}
            </div>
            <p className="text-xs text-muted-foreground">Últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Actividad Sospechosa
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {estadisticas.actividadSospechosa}
            </div>
            <p className="text-xs text-muted-foreground">Requiere revisión</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Errores Sistema
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {estadisticas.erroresSistema}
            </div>
            <p className="text-xs text-muted-foreground">Últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Respaldos</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {estadisticas.respaldos}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas */}
      <Tabs defaultValue="actividad" className="space-y-4">
        <TabsList>
          <TabsTrigger value="actividad" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Logs de Actividad
          </TabsTrigger>
          <TabsTrigger value="seguridad" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="reportes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reportes de Auditoría
          </TabsTrigger>
        </TabsList>

        <TabsContent value="actividad" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Búsqueda</CardTitle>
              <CardDescription>
                Filtra los logs por diferentes criterios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar en logs..."
                      value={filtros.buscar}
                      onChange={(e) =>
                        handleFiltroChange("buscar", e.target.value)
                      }
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Log</Label>
                  <Select
                    value={filtros.categoria}
                    onValueChange={(value) =>
                      handleFiltroChange("categoria", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS">
                        Todas las categorías
                      </SelectItem>
                      {CATEGORIAS.map((categoria) => (
                        <SelectItem
                          key={categoria.value}
                          value={categoria.value}
                        >
                          {categoria.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Usuario</Label>
                  <Select
                    value={filtros.usuarioId}
                    onValueChange={(value) =>
                      handleFiltroChange("usuarioId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los usuarios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos los usuarios</SelectItem>
                      {usuarios.map((usuario) => (
                        <SelectItem key={usuario.id} value={usuario.id}>
                          {usuario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Severidad</Label>
                  <Select
                    value={filtros.severidad}
                    onValueChange={(value) =>
                      handleFiltroChange("severidad", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las severidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS">
                        Todas las severidades
                      </SelectItem>
                      {SEVERIDADES.map((severidad) => (
                        <SelectItem
                          key={severidad.value}
                          value={severidad.value}
                        >
                          {severidad.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <Button variant="outline" onClick={limpiarFiltros}>
                  Limpiar Filtros
                </Button>
                <Button onClick={exportarCSV} disabled={exporting}>
                  {exporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Tabla de Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Registro de Actividades</CardTitle>
              <CardDescription>
                Mostrando los {logs.length} registros más recientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Severidad</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(logs) &&
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(log.fechaHora).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(log.fechaHora).toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.usuario ? (
                              <div>
                                <div className="font-medium">
                                  {log.usuario.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {log.usuario.email}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="outline">Sistema</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {log.accion}
                            </code>
                          </TableCell>
                          <TableCell>{log.recurso}</TableCell>
                          <TableCell>
                            {getCategoriaBadge(log.categoria)}
                          </TableCell>
                          <TableCell>
                            {getSeveridadBadge(log.severidad)}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              Ver Detalles
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguridad">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Seguridad</CardTitle>
              <CardDescription>
                Eventos relacionados con la seguridad del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta sección mostrará específicamente los logs de seguridad,
                intentos de acceso, cambios de permisos, etc.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema">
          <Card>
            <CardHeader>
              <CardTitle>Logs del Sistema</CardTitle>
              <CardDescription>
                Eventos del sistema, errores y operaciones internas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta sección mostrará logs del sistema, errores, operaciones de
                mantenimiento, etc.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reportes">
          <Card>
            <CardHeader>
              <CardTitle>Reportes de Auditoría</CardTitle>
              <CardDescription>
                Reportes consolidados y análisis de auditoría
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta sección incluirá reportes consolidados, análisis de
                tendencias y alertas de auditoría.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
