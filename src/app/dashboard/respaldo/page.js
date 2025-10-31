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
import { Button } from "@/components/ui/button";
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
export default function RespaldoPage() {
  const {
    estadisticas,
    historial,
    configuracion,
    loading,
    error,
    pagination,
    crearRespaldo,
    restaurarRespaldo,
    eliminarRespaldo,
    actualizarConfiguracion,
    cargarHistorial,
    refrescar,
    formatBytes,
    formatDuration,
    getStatusColor,
    getStatusBadgeColor,
  } = useRespaldos();
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
  const [backupHistory, setBackupHistory] = useState([
    {
      id: "backup_20240115_020000",
      name: "Respaldo Automático Diario",
      type: "automatic",
      status: "completed",
      size: "2.4 GB",
      duration: "12 min",
      createdAt: "2024-01-15 02:00:00",
      location: "local+cloud",
      encrypted: true,
      tables: ["users", "shipments", "invoices", "customers", "routes"],
      checksum: "sha256:a1b2c3d4e5f6...",
    },
    {
      id: "backup_20240114_020000",
      name: "Respaldo Automático Diario",
      type: "automatic",
      status: "completed",
      size: "2.3 GB",
      duration: "11 min",
      createdAt: "2024-01-14 02:00:00",
      location: "local+cloud",
      encrypted: true,
      tables: ["users", "shipments", "invoices", "customers", "routes"],
      checksum: "sha256:b2c3d4e5f6a1...",
    },
    {
      id: "backup_20240113_143000",
      name: "Respaldo Manual Pre-Actualización",
      type: "manual",
      status: "completed",
      size: "2.3 GB",
      duration: "10 min",
      createdAt: "2024-01-13 14:30:00",
      location: "local",
      encrypted: true,
      tables: ["users", "shipments", "invoices", "customers", "routes"],
      checksum: "sha256:c3d4e5f6a1b2...",
    },
    {
      id: "backup_20240112_020000",
      name: "Respaldo Automático Diario",
      type: "automatic",
      status: "failed",
      size: "0 GB",
      duration: "0 min",
      createdAt: "2024-01-12 02:00:00",
      location: "none",
      encrypted: false,
      tables: [],
      error: "Error de conexión con el almacenamiento en la nube",
    },
  ]);
  const [systemStatus, setSystemStatus] = useState({
    database: {
      status: "healthy",
      size: "15.2 GB",
      lastBackup: "2024-01-15 02:00:00",
      nextBackup: "2024-01-16 02:00:00",
    },
    storage: {
      local: { available: "45.8 GB", used: "12.2 GB", total: "58.0 GB" },
      cloud: { available: "∞", used: "8.7 GB", total: "100 GB" },
    },
    performance: { avgBackupTime: "11 min", successRate: 95.2, lastMonth: 28 },
  });
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
      setBackupProgress(0); // Crear respaldo usando la Server Actio n
      const respaldoData = {
        nombre: "Respaldo Manual",
        descripcion: "Respaldo creado manualmente desde la interfaz",
        tipo: "MANUAL",
        incluyeArchivos: false,
        tablasIncluidas: [],
      };
      await crearRespaldo(respaldoData); // Simular progreso del backup para la U I
      const interval = setInterval(() => {
        setBackupProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsBackupRunning(false);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 500);
    } catch (error) {
      setIsBackupRunning(false);
      setBackupProgress(0);
    }
  };
  const handleRestoreBackup = (backup) => {
    setSelectedBackup(backup);
    setIsRestoreDialogOpen(true);
  };
  const confirmRestore = async () => {
    setLoading(true); // Simular restauració n
    setTimeout(() => {
      setLoading(false);
      setIsRestoreDialogOpen(false);
      setSelectedBackup(null);
    }, 3000);
  };
  const handleDeleteBackup = (backupId) => {
    setBackupHistory((prev) => prev.filter((backup) => backup.id !== backupId));
  };
  const handleDownloadBackup = (backup) => {};
  const formatFileSize = (bytes) => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
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
                  {getHealthStatus(systemStatus.database.status)}
                  <p className="text-xs text-muted-foreground">
                    Tamaño: {systemStatus.database.size}
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
                <div className="text-2xl font-bold text-green-600">Exitoso</div>
                <p className="text-xs text-muted-foreground">
                  {systemStatus.database.lastBackup}
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
                  {systemStatus.database.nextBackup}
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
                  {systemStatus.performance.successRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Últimos {systemStatus.performance.lastMonth} respaldos
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
                    <span>{systemStatus.storage.local.used}</span>
                  </div>
                  <Progress
                    value={
                      (parseFloat(systemStatus.storage.local.used) /
                        parseFloat(systemStatus.storage.local.total)) *
                      100
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Disponible: {systemStatus.storage.local.available}
                    </span>
                    <span>Total: {systemStatus.storage.local.total}</span>
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
                    <span>{systemStatus.storage.cloud.used}</span>
                  </div>
                  <Progress
                    value={
                      (parseFloat(systemStatus.storage.cloud.used) /
                        parseFloat(systemStatus.storage.cloud.total)) *
                      100
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Disponible: {systemStatus.storage.cloud.available}
                    </span>
                    <span>Total: {systemStatus.storage.cloud.total}</span>
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
                    <TableHead>Nombre</TableHead> <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead> <TableHead>Tamaño</TableHead>
                    <TableHead>Duración</TableHead> <TableHead>Fecha</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backupHistory.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {backup.encrypted && (
                            <Lock className="mr-2 h-4 w-4 text-green-600" />
                          )}
                          {backup.name}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(backup.type)}</TableCell>
                      <TableCell>{getStatusBadge(backup.status)}</TableCell>
                      <TableCell>{backup.size}</TableCell>
                      <TableCell>{backup.duration}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {backup.createdAt}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {backup.location.includes("local") && (
                            <Badge variant="outline" className="text-xs">
                              <HardDrive className="mr-1 h-3 w-3" /> Local
                            </Badge>
                          )}
                          {backup.location.includes("cloud") && (
                            <Badge variant="outline" className="text-xs">
                              <Cloud className="mr-1 h-3 w-3" /> Nube
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {backup.status === "completed" && (
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
                  ))}
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
            <Button onClick={confirmRestore} disabled={loading}>
              {loading ? "Restaurando..." : "Confirmar Restauración"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
