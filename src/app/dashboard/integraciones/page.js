"use client";
import { useState, useEffect } from "react";
import {
  Plug,
  Settings,
  Globe,
  Key,
  Webhook,
  Database,
  Cloud,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Activity,
  Zap,
  Link,
  Code,
  FileText,
  Download,
  Upload,
  Clock,
  Users,
  Package,
  CreditCard,
  Truck,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";
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
export default function IntegracionesPage() {
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState({});
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [integrations, setIntegrations] = useState([
    {
      id: "sunat",
      name: "SUNAT",
      description: "Integración con el sistema tributario peruano",
      category: "government",
      status: "active",
      icon: FileText,
      lastSync: "2024-01-15 14:30",
      config: {
        ruc: "20123456789",
        usuario: "COALCARGO01",
        clave: "••••••••",
        endpoint: "https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService",
      },
      features: [
        "Facturación electrónica",
        "Consulta RUC",
        "Validación de comprobantes",
      ],
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      description: "Notificaciones y comunicación con clientes",
      category: "communication",
      status: "active",
      icon: MessageSquare,
      lastSync: "2024-01-15 16:45",
      config: {
        phoneNumberId: "123456789012345",
        accessToken: "••••••••••••••••••••",
        webhookUrl: "https://api.coalcargo.pe/webhooks/whatsapp",
      },
      features: [
        "Notificaciones de envío",
        "Confirmaciones de entrega",
        "Soporte al cliente",
      ],
    },
    {
      id: "google-maps",
      name: "Google Maps",
      description: "Servicios de geolocalización y rutas",
      category: "logistics",
      status: "active",
      icon: Globe,
      lastSync: "2024-01-15 17:20",
      config: {
        apiKey: "••••••••••••••••••••••••••••••••••••••••",
        services: ["Geocoding", "Directions", "Distance Matrix"],
      },
      features: [
        "Cálculo de rutas",
        "Geocodificación",
        "Estimación de tiempos",
      ],
    },
    {
      id: "mercadopago",
      name: "Mercado Pago",
      description: "Procesamiento de pagos online",
      category: "payment",
      status: "inactive",
      icon: CreditCard,
      lastSync: "2024-01-10 09:15",
      config: {
        publicKey: "••••••••••••••••••••••••••••••••",
        accessToken: "••••••••••••••••••••••••••••••••••••••••••••••••••••",
        webhookUrl: "https://api.coalcargo.pe/webhooks/mercadopago",
      },
      features: ["Pagos con tarjeta", "Transferencias", "Suscripciones"],
    },
    {
      id: "aws-s3",
      name: "Amazon S3",
      description: "Almacenamiento de archivos en la nube",
      category: "storage",
      status: "active",
      icon: Cloud,
      lastSync: "2024-01-15 18:00",
      config: {
        accessKeyId: "••••••••••••••••••••",
        secretAccessKey: "••••••••••••••••••••••••••••••••••••••••",
        bucket: "coalcargo-documents",
        region: "us-east-1",
      },
      features: [
        "Backup de documentos",
        "Almacenamiento de imágenes",
        "Archivos de reportes",
      ],
    },
    {
      id: "smtp",
      name: "Servidor SMTP",
      description: "Envío de correos electrónicos",
      category: "communication",
      status: "active",
      icon: Mail,
      lastSync: "2024-01-15 17:55",
      config: {
        host: "smtp.gmail.com",
        port: "587",
        username: "noreply@coalcargo.pe",
        password: "••••••••••••••••",
      },
      features: [
        "Notificaciones por email",
        "Reportes automáticos",
        "Confirmaciones",
      ],
    },
  ]);
  const [webhooks, setWebhooks] = useState([
    {
      id: "shipment-updates",
      name: "Actualizaciones de Envío",
      url: "https://api.coalcargo.pe/webhooks/shipments",
      events: ["shipment.created", "shipment.updated", "shipment.delivered"],
      status: "active",
      lastTriggered: "2024-01-15 16:30",
      successRate: 98.5,
    },
    {
      id: "payment-notifications",
      name: "Notificaciones de Pago",
      url: "https://api.coalcargo.pe/webhooks/payments",
      events: ["payment.completed", "payment.failed", "payment.refunded"],
      status: "active",
      lastTriggered: "2024-01-15 14:20",
      successRate: 99.2,
    },
    {
      id: "customer-feedback",
      name: "Comentarios de Clientes",
      url: "https://api.coalcargo.pe/webhooks/feedback",
      events: ["feedback.created", "rating.updated"],
      status: "inactive",
      lastTriggered: "2024-01-12 10:15",
      successRate: 95.8,
    },
  ]);
  const categories = [
    {
      id: "government",
      name: "Gubernamental",
      icon: Shield,
      color: "bg-red-100 text-red-800",
    },
    {
      id: "communication",
      name: "Comunicación",
      icon: MessageSquare,
      color: "bg-blue-100 text-blue-800",
    },
    {
      id: "logistics",
      name: "Logística",
      icon: Truck,
      color: "bg-green-100 text-green-800",
    },
    {
      id: "payment",
      name: "Pagos",
      icon: CreditCard,
      color: "bg-purple-100 text-purple-800",
    },
    {
      id: "storage",
      name: "Almacenamiento",
      icon: Database,
      color: "bg-orange-100 text-orange-800",
    },
  ];
  const getStatusBadge = (status) => {
    const config = {
      active: { label: "Activo", color: "bg-green-100 text-green-800" },
      inactive: { label: "Inactivo", color: "bg-gray-100 text-gray-800" },
      error: { label: "Error", color: "bg-red-100 text-red-800" },
      pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
    };
    return (
      <Badge className={config[status].color}> {config[status].label} </Badge>
    );
  };
  const getCategoryBadge = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return null;
    return (
      <Badge className={category.color}>
        <category.icon className="mr-1 h-3 w-3" /> {category.name}
      </Badge>
    );
  };
  const toggleApiKeyVisibility = (integrationId, field) => {
    setShowApiKey((prev) => ({
      ...prev,
      [`${integrationId}-${field}`]: !prev[`${integrationId}-${field}`],
    }));
  };
  const handleToggleIntegration = (integrationId) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === integrationId
          ? {
              ...integration,
              status: integration.status === "active" ? "inactive" : "active",
            }
          : integration
      )
    );
  };
  const handleTestConnection = async (integrationId) => {
    setLoading(true); // Simular prueba de conexió n
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };
  const handleSyncNow = async (integrationId) => {
    setLoading(true); // Simular sincronizació n
    setTimeout(() => {
      setLoading(false);
      setIntegrations((prev) =>
        prev.map((integration) =>
          integration.id === integrationId
            ? { ...integration, lastSync: new Date().toLocaleString() }
            : integration
        )
      );
    }, 1500);
  };
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };
  const handleEditIntegration = (integration) => {
    setSelectedIntegration(integration);
    setIsDialogOpen(true);
  };
  const handleSaveIntegration = () => {
    // Lógica para guardar la integració n
    setIsDialogOpen(false);
    setSelectedIntegration(null);
  };
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Integraciones</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Exportar Configuración
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Nueva Integración
          </Button>
        </div>
      </div>
      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => {
              const IntegrationIcon = integration.icon;
              return (
                <Card key={integration.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <IntegrationIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {integration.name}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={integration.status === "active"}
                        onCheckedChange={() =>
                          handleToggleIntegration(integration.id)
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      {getCategoryBadge(integration.category)}
                      {getStatusBadge(integration.status)}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Última sincronización: {integration.lastSync}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">
                          Características:
                        </Label>
                        <div className="flex flex-wrap gap-1">
                          {integration.features
                            .slice(0, 2)
                            .map((feature, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {feature}
                              </Badge>
                            ))}
                          {integration.features.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{integration.features.length - 2} más
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditIntegration(integration)}
                      >
                        <Settings className="mr-2 h-4 w-4" /> Configurar
                      </Button>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(integration.id)}
                          disabled={loading || integration.status !== "active"}
                        >
                          <Activity className="mr-2 h-4 w-4" /> Probar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncNow(integration.id)}
                          disabled={loading || integration.status !== "active"}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Webhooks Configurados</CardTitle>
                  <CardDescription>
                    Gestiona los webhooks para recibir notificaciones en tiempo
                    real
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead> <TableHead>URL</TableHead>
                    <TableHead>Eventos</TableHead> <TableHead>Estado</TableHead>
                    <TableHead>Éxito</TableHead>
                    <TableHead>Última activación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell className="font-medium">
                        {webhook.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {webhook.url}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.slice(0, 2).map((event, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {event}
                            </Badge>
                          ))}
                          {webhook.events.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{webhook.events.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(webhook.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          {webhook.successRate}%
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {webhook.lastTriggered}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Activity className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
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
        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de API Keys</CardTitle>
              <CardDescription>
                Administra las claves de API para acceso a servicios externos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {integrations
                .filter((i) => i.config)
                .map((integration) => (
                  <div key={integration.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <integration.icon className="h-5 w-5" />
                        <h4 className="font-medium">{integration.name}</h4>
                      </div>
                      {getStatusBadge(integration.status)}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {Object.entries(integration.config).map(
                        ([key, value]) => (
                          <div key={key} className="space-y-2">
                            <Label className="text-sm font-medium capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type={
                                  showApiKey[`${integration.id}-${key}`]
                                    ? "text"
                                    : "password"
                                }
                                value={value}
                                readOnly
                                className="font-mono text-sm"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  toggleApiKeyVisibility(integration.id, key)
                                }
                              >
                                {showApiKey[`${integration.id}-${key}`] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(value)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Integración</CardTitle>
              <CardDescription>
                Historial de actividad y errores de las integraciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Logs del Sistema</h3>
                <p className="text-muted-foreground mb-4">
                  Aquí se mostrarán los logs detallados de todas las
                  integraciones y sus actividades.
                </p>
                <Button>
                  <Activity className="mr-2 h-4 w-4" /> Ver Logs Detallados
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Dialog para editar integración */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              Modifica la configuración de la integración
            </DialogDescription>
          </DialogHeader>
          {selectedIntegration && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(selectedIntegration.config).map(
                  ([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label className="capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </Label>
                      <Input
                        type={
                          key.toLowerCase().includes("password") ||
                          key.toLowerCase().includes("token") ||
                          key.toLowerCase().includes("key")
                            ? "password"
                            : "text"
                        }
                        defaultValue={value}
                        className="font-mono text-sm"
                      />
                    </div>
                  )
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Características habilitadas</Label>
                <div className="space-y-2">
                  {selectedIntegration.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Switch defaultChecked />
                      <Label className="text-sm">{feature}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveIntegration}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
