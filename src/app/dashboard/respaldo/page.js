"use client";
import { useState, useEffect } from "react";
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Calendar,
  Clock,
  HardDrive,
  Cloud,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Play,
  Pause,
  RotateCcw,
  FileText,
  Archive,
  Trash2,
  Eye,
  Copy,
  Server,
  Activity,
  Zap,
  Timer,
  Gauge,
  FolderOpen,
  Lock,
  Unlock,
} from "lucide-react";
import { useRespaldos } from "@/hooks/use-respaldos";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { obtenerHistorialRespaldos } from "@/lib/actions/respaldos";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import RouteProtection from "@/components/auth/route-protection";

export default function RespaldoPage() {
  return (
    <RouteProtection
      allowedRoles="SUPER_ADMIN"
      customMessage="Solo los Super Administradores pueden gestionar respaldos del sistema."
    >
      <RespaldoPageContent />
    </RouteProtection>
  );
}

function RespaldoPageContent() {
  const {
    loading,
    crearRespaldo,
    historial,
    estadisticas,
    refrescar,
    formatBytes,
    formatDuration,
    getStatusBadgeColor,
    eliminarRespaldo,
    restaurarRespaldo,
  } = useRespaldos();
  const { handleError } = useErrorHandler();
  const [localLoading, setLocalLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupSettings, setBackupSettings] = useState({
    automatic: {
      enabled: true,
      frequency: "daily",
      time: "02:00",
      retention: 30,
    },
    storage: { local: true, cloud: true, encryption: true },
    notifications: {
      success: true,
      failure: true,
      email: "admin@coalcargo.pe",
    },
  });
  // Usar datos reales del hook en lugar de datos hardcodeados
  const backupHistory = historial || [];
  const systemStatus = estadisticas?.sistema || {
    estado: "warning",
    tamanoBD: "N/A",
    ultimoRespaldo: null,
    proximoRespaldo: null,
  };
  const storageStatus = estadisticas?.almacenamiento || {
    local: { usado: "0 GB", disponible: "N/A", total: "N/A" },
    nube: { usado: "0 GB", disponible: "N/A", total: "N/A" },
  };
  const performanceStats = estadisticas?.estadisticas || {
    totalRespaldos: 0,
    respaldosExitosos: 0,
    respaldosFallidos: 0,
    tasaExito: 0,
    tiempoPromedio: 0,
  };
  const getStatusBadge = (status) => {
    const config = {
      completed: {
        label: "Completado",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      failed: {
        label: "Fallido",
        color: "bg-red-100 text-red-800",
        icon: XCircle,
      },
      running: {
        label: "En progreso",
        color: "bg-blue-100 text-blue-800",
        icon: RefreshCw,
      },
      pending: {
        label: "Pendiente",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
    };
    const StatusIcon = config[status]?.icon || Clock;
    return (
      <Badge className={config[status]?.color || "bg-gray-100 text-gray-800"}>
        <StatusIcon className="mr-1 h-3 w-3" />
        {config[status]?.label || status}
      </Badge>
    );
  };
  const getTypeBadge = (type) => {
    const config = {
      automatic: { label: "Automático", color: "bg-blue-100 text-blue-800" },
      manual: { label: "Manual", color: "bg-purple-100 text-purple-800" },
      scheduled: {
        label: "Programado",
        color: "bg-orange-100 text-orange-800",
      },
    };
    return (
      <Badge className={config[type]?.color || "bg-gray-100 text-gray-800"}>
        {config[type]?.label || type}
      </Badge>
    );
  };
  const handleStartBackup = async () => {
    try {
      setIsBackupRunning(true);
      setBackupProgress(0);
      setLocalLoading(true);

      // Verificar sistema antes de crear respaldo (opcional, pero recomendado)
      try {
        const verificacion = await fetch("/api/respaldos/verificar");
        const verificacionData = await verificacion.json();

        if (!verificacionData.todoOk) {
          const problemas = [];
          if (!verificacionData.verificaciones.pgDump.disponible) {
            problemas.push(verificacionData.verificaciones.pgDump.mensaje);
          }
          if (!verificacionData.verificaciones.databaseUrl.valida) {
            problemas.push(verificacionData.verificaciones.databaseUrl.mensaje);
          }
          if (!verificacionData.verificaciones.permisos.tienePermisos) {
            problemas.push(verificacionData.verificaciones.permisos.mensaje);
          }

          toast.error(
            `No se puede crear el respaldo. Problemas detectados:\n${problemas.join(
              "\n"
            )}`,
            { duration: 10000 }
          );
          setIsBackupRunning(false);
          setLocalLoading(false);
          return;
        }
      } catch (error) {
        console.warn(
          "No se pudo verificar el sistema, continuando de todas formas:",
          error
        );
        // Continuar de todas formas, la verificación es opcional
      }

      // Crear respaldo usando la Server Action
      const respaldoData = {
        nombre: `Respaldo Manual - ${new Date().toLocaleString("es-PE")}`,
        descripcion: "Respaldo creado manualmente desde la interfaz",
        tipo: "MANUAL",
        incluyeArchivos: false,
        tablasIncluidas: [],
      };

      const result = await crearRespaldo(respaldoData);

      if (result) {
        // El respaldo se inició correctamente
        setBackupProgress(10);
        toast.success(
          "Respaldo iniciado correctamente. Se ejecutará en segundo plano."
        );

        const respaldoId = result.id;
        let progressInterval;

        // Función para verificar el progreso usando el hook
        const verificarProgreso = async () => {
          try {
            // Refrescar datos para obtener el progreso real
            await refrescar();

            // Esperar un momento para que se actualice el estado
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Obtener el historial actualizado directamente desde el hook
            // Usamos obtenerHistorialRespaldos para obtener datos frescos
            const historialActualizado = await obtenerHistorialRespaldos(
              1,
              100
            );

            if (historialActualizado?.success) {
              const respaldoReciente = historialActualizado.data.respaldos.find(
                (r) => r.id === respaldoId
              );

              if (respaldoReciente) {
                const progreso = respaldoReciente.progreso || 0;
                setBackupProgress(progreso);

                // Si está completado o fallido, detener el intervalo
                if (
                  respaldoReciente.estado === "COMPLETADO" ||
                  respaldoReciente.estado === "FALLIDO"
                ) {
                  if (progressInterval) {
                    clearInterval(progressInterval);
                  }
                  setIsBackupRunning(false);
                  setBackupProgress(
                    respaldoReciente.estado === "COMPLETADO" ? 100 : 0
                  );

                  if (respaldoReciente.estado === "COMPLETADO") {
                    toast.success("Respaldo completado exitosamente");
                  } else {
                    toast.error(
                      `Respaldo falló: ${
                        respaldoReciente.mensajeError || "Error desconocido"
                      }`
                    );
                  }

                  // Refrescar datos finales
                  await refrescar();
                  return true; // Indicar que se completó
                }
              } else {
                // Si no encontramos el respaldo, puede que aún no se haya creado en BD
                // Continuar verificando
              }
            }
            return false; // Continuar verificando
          } catch (error) {
            console.error("Error al verificar progreso:", error);
            return false;
          }
        };

        // Verificar progreso inmediatamente y luego cada 3 segundos
        verificarProgreso(); // Primera verificación inmediata
        progressInterval = setInterval(async () => {
          const completado = await verificarProgreso();
          if (completado && progressInterval) {
            clearInterval(progressInterval);
          }
        }, 3000);

        // Timeout de seguridad (30 minutos)
        setTimeout(() => {
          if (progressInterval) {
            clearInterval(progressInterval);
          }
          if (isBackupRunning) {
            setIsBackupRunning(false);
            toast.warning(
              "El respaldo está tomando más tiempo del esperado. Verifica el estado en el historial."
            );
          }
        }, 30 * 60 * 1000);
      }
    } catch (error) {
      handleError(error, {
        context: { action: "crearRespaldo" },
        defaultMessage: "Error al crear respaldo",
      });
      setIsBackupRunning(false);
      setBackupProgress(0);
    } finally {
      setLocalLoading(false);
    }
  };
  const handleRestoreBackup = (backup) => {
    setSelectedBackup(backup);
    setIsRestoreDialogOpen(true);
  };
  const confirmRestore = async () => {
    if (!selectedBackup) return;

    try {
      setLocalLoading(true);
      await restaurarRespaldo(selectedBackup.id, {
        crearRespaldoAntes: true,
        restaurarCompleto: true,
        sobrescribirDatos: false,
      });
      setIsRestoreDialogOpen(false);
      setSelectedBackup(null);
      await refrescar();
    } catch (error) {
      handleError(error, {
        context: { action: "restaurarRespaldo", backupId: selectedBackup.id },
        defaultMessage: "Error al restaurar respaldo",
      });
    } finally {
      setLocalLoading(false);
    }
  };
  const handleDeleteBackup = async (backupId) => {
    try {
      if (confirm("¿Estás seguro de que deseas eliminar este respaldo?")) {
        await eliminarRespaldo(backupId);
        await refrescar();
      }
    } catch (error) {
      handleError(error, {
        context: { action: "eliminarRespaldo", backupId },
        defaultMessage: "Error al eliminar respaldo",
      });
    }
  };
  const handleDownloadBackup = () => {};
  const getHealthStatus = (status) => {
    const config = {
      healthy: { color: "text-green-600", icon: CheckCircle },
      warning: { color: "text-yellow-600", icon: AlertTriangle },
      error: { color: "text-red-600", icon: XCircle },
    };
    const StatusIcon = config[status]?.icon || AlertTriangle;
    return (
      <div className={`flex items-center ${config[status]?.color}`}>
        <StatusIcon className="mr-2 h-4 w-4" />
        <span className="capitalize">{status}</span>
      </div>
    );
  };
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Respaldo y Recuperación
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" /> Configuración
          </Button>
          <Button
            size="sm"
            onClick={handleStartBackup}
            disabled={isBackupRunning}
          >
            {isBackupRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Respaldando...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" /> Crear Respaldo
              </>
            )}
          </Button>
        </div>
      </div>
      {/* Progreso del backup si está en ejecución */}
      {isBackupRunning && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertTitle>Respaldo en progreso</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              <Progress value={backupProgress} className="w-full" />
              <p className="text-sm">Progreso: {Math.round(backupProgress)}%</p>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="backups">Historial</TabsTrigger>
          <TabsTrigger value="schedule">Programación</TabsTrigger>
          <TabsTrigger value="storage">Almacenamiento</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Estado del Sistema
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getHealthStatus(systemStatus.estado || "warning")}
                  <p className="text-xs text-muted-foreground">
                    Tamaño: {systemStatus.tamanoBD || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Último Respaldo
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    systemStatus.ultimoRespaldo?.estado === "COMPLETADO"
                      ? "text-green-600"
                      : systemStatus.ultimoRespaldo?.estado === "FALLIDO"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {systemStatus.ultimoRespaldo?.estado === "COMPLETADO"
                    ? "Exitoso"
                    : systemStatus.ultimoRespaldo?.estado === "FALLIDO"
                    ? "Fallido"
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {systemStatus.ultimoRespaldo?.fecha
                    ? new Date(
                        systemStatus.ultimoRespaldo.fecha
                      ).toLocaleString("es-PE")
                    : "Sin respaldos"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Próximo Respaldo
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Programado</div>
                <p className="text-xs text-muted-foreground">
                  {systemStatus.proximoRespaldo
                    ? new Date(systemStatus.proximoRespaldo).toLocaleString(
                        "es-PE"
                      )
                    : "No programado"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tasa de Éxito
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceStats.tasaExito?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {performanceStats.totalRespaldos || 0} respaldos totales
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HardDrive className="mr-2 h-5 w-5" /> Almacenamiento Local
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Usado</span>
                    <span>{storageStatus.local.usado || "0 GB"}</span>
                  </div>
                  <Progress value={50} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Disponible: {storageStatus.local.disponible || "N/A"}
                    </span>
                    <span>Total: {storageStatus.local.total || "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cloud className="mr-2 h-5 w-5" /> Almacenamiento en la Nube
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Usado</span>
                    <span>{storageStatus.nube.usado || "0 GB"}</span>
                  </div>
                  <Progress value={10} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Disponible: {storageStatus.nube.disponible || "N/A"}
                    </span>
                    <span>Total: {storageStatus.nube.total || "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Respaldos</CardTitle>
              <CardDescription>
                Lista completa de todos los respaldos realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tamaño</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-muted-foreground">
                          Cargando respaldos...
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : backupHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          No hay respaldos registrados
                        </p>
                        <Button
                          className="mt-4"
                          onClick={handleStartBackup}
                          disabled={isBackupRunning}
                        >
                          <Database className="mr-2 h-4 w-4" /> Crear primer
                          respaldo
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    backupHistory.map((backup) => {
                      const StatusIcon =
                        backup.estado === "COMPLETADO"
                          ? CheckCircle
                          : backup.estado === "FALLIDO"
                          ? XCircle
                          : backup.estado === "EN_PROGRESO"
                          ? RefreshCw
                          : Clock;

                      return (
                        <TableRow key={backup.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {backup.encriptado && (
                                <Lock className="mr-2 h-4 w-4 text-green-600" />
                              )}
                              {backup.nombre}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                backup.tipo === "AUTOMATICO"
                                  ? "bg-blue-100 text-blue-800"
                                  : backup.tipo === "MANUAL"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {backup.tipo === "AUTOMATICO"
                                ? "Automático"
                                : backup.tipo === "MANUAL"
                                ? "Manual"
                                : backup.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getStatusBadgeColor(backup.estado)}
                            >
                              <StatusIcon
                                className={`mr-1 h-3 w-3 ${
                                  backup.estado === "EN_PROGRESO"
                                    ? "animate-spin"
                                    : ""
                                }`}
                              />
                              {backup.estado === "COMPLETADO"
                                ? "Completado"
                                : backup.estado === "FALLIDO"
                                ? "Fallido"
                                : backup.estado === "EN_PROGRESO"
                                ? "En progreso"
                                : backup.estado === "INICIADO"
                                ? "Iniciado"
                                : backup.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {backup.tamano
                              ? formatBytes(Number(backup.tamano))
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {backup.duracion
                              ? formatDuration(backup.duracion)
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {backup.fechaInicio
                              ? new Date(backup.fechaInicio).toLocaleString(
                                  "es-PE"
                                )
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {backup.almacenamientoLocal && (
                                <Badge variant="outline" className="text-xs">
                                  <HardDrive className="mr-1 h-3 w-3" /> Local
                                </Badge>
                              )}
                              {backup.almacenamientoNube && (
                                <Badge variant="outline" className="text-xs">
                                  <Cloud className="mr-1 h-3 w-3" /> Nube
                                </Badge>
                              )}
                              {!backup.almacenamientoLocal &&
                                !backup.almacenamientoNube && (
                                  <span className="text-xs text-muted-foreground">
                                    N/A
                                  </span>
                                )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {backup.estado === "COMPLETADO" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRestoreBackup(backup)}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadBackup(backup)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteBackup(backup.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="schedule" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Timer className="mr-2 h-5 w-5" /> Respaldos Automáticos
                </CardTitle>
                <CardDescription>
                  Configuración de respaldos programados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-backup">
                    Habilitar respaldos automáticos
                  </Label>
                  <Switch
                    id="auto-backup"
                    checked={backupSettings.automatic.enabled}
                    onCheckedChange={(checked) =>
                      setBackupSettings((prev) => ({
                        ...prev,
                        automatic: { ...prev.automatic, enabled: checked },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frecuencia</Label>
                  <Select
                    value={backupSettings.automatic.frequency}
                    onValueChange={(value) =>
                      setBackupSettings((prev) => ({
                        ...prev,
                        automatic: { ...prev.automatic, frequency: value },
                      }))
                    }
                    disabled={!backupSettings.automatic.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Cada hora</SelectItem>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-time">Hora de ejecución</Label>
                  <Input
                    id="backup-time"
                    type="time"
                    value={backupSettings.automatic.time}
                    onChange={(e) =>
                      setBackupSettings((prev) => ({
                        ...prev,
                        automatic: { ...prev.automatic, time: e.target.value },
                      }))
                    }
                    disabled={!backupSettings.automatic.enabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention">Retención (días)</Label>
                  <Input
                    id="retention"
                    type="number"
                    value={backupSettings.automatic.retention}
                    onChange={(e) =>
                      setBackupSettings((prev) => ({
                        ...prev,
                        automatic: {
                          ...prev.automatic,
                          retention: parseInt(e.target.value),
                        },
                      }))
                    }
                    disabled={!backupSettings.automatic.enabled}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" /> Configuración de Seguridad
                </CardTitle>
                <CardDescription>
                  Opciones de encriptación y almacenamiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="local-storage">Almacenamiento local</Label>
                  <Switch
                    id="local-storage"
                    checked={backupSettings.storage.local}
                    onCheckedChange={(checked) =>
                      setBackupSettings((prev) => ({
                        ...prev,
                        storage: { ...prev.storage, local: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="cloud-storage">
                    Almacenamiento en la nube
                  </Label>
                  <Switch
                    id="cloud-storage"
                    checked={backupSettings.storage.cloud}
                    onCheckedChange={(checked) =>
                      setBackupSettings((prev) => ({
                        ...prev,
                        storage: { ...prev.storage, cloud: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="encryption">Encriptación</Label>
                  <Switch
                    id="encryption"
                    checked={backupSettings.storage.encryption}
                    onCheckedChange={(checked) =>
                      setBackupSettings((prev) => ({
                        ...prev,
                        storage: { ...prev.storage, encryption: checked },
                      }))
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="notification-email">
                    Email para notificaciones
                  </Label>
                  <Input
                    id="notification-email"
                    type="email"
                    value={backupSettings.notifications.email}
                    onChange={(e) =>
                      setBackupSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          email: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-success">Notificar éxitos</Label>
                  <Switch
                    id="notify-success"
                    checked={backupSettings.notifications.success}
                    onCheckedChange={(checked) =>
                      setBackupSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          success: checked,
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-failure">Notificar fallos</Label>
                  <Switch
                    id="notify-failure"
                    checked={backupSettings.notifications.failure}
                    onCheckedChange={(checked) =>
                      setBackupSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          failure: checked,
                        },
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Almacenamiento</CardTitle>
              <CardDescription>
                Configuración y monitoreo del espacio de almacenamiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  Gestión Avanzada de Almacenamiento
                </h3>
                <p className="text-muted-foreground mb-4">
                  Configurar ubicaciones de almacenamiento, políticas de
                  retención y limpieza automática.
                </p>
                <Button>
                  <Settings className="mr-2 h-4 w-4" /> Configurar
                  Almacenamiento
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Dialog para confirmar restauración */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Restauración</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas restaurar este respaldo? Esta acción
              sobrescribirá los datos actuales.
            </DialogDescription>
          </DialogHeader>
          {selectedBackup && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>¡Advertencia!</AlertTitle>
                <AlertDescription>
                  Esta operación es irreversible. Se recomienda crear un
                  respaldo actual antes de proceder.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <p>
                  <strong>Respaldo:</strong> {selectedBackup.name}
                </p>
                <p>
                  <strong>Fecha:</strong> {selectedBackup.createdAt}
                </p>
                <p>
                  <strong>Tamaño:</strong> {selectedBackup.size}
                </p>
                <p>
                  <strong>Tablas incluidas:</strong>
                  {selectedBackup.tables.join(", ")}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRestoreDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={confirmRestore} disabled={localLoading || loading}>
              {localLoading || loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Restaurando...
                </>
              ) : (
                "Confirmar Restauración"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
