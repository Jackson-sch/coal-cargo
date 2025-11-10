"use client";
import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  FileText,
  PieChart,
  LineChart,
  Users,
  Package,
  DollarSign,
  Truck,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { TimePicker, TimeInput } from "@/components/ui/time-picker";

export default function ReportesAvanzadosPage() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(2024, 0, 1),
    to: new Date(),
  });
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [reportTime, setReportTime] = useState(null);
  const [selectedReport, setSelectedReport] = useState("performance");
  const [reportData, setReportData] = useState({}); // Datos simulados para los reportes
  const performanceMetrics = {
    totalShipments: 1247,
    onTimeDelivery: 94.2,
    customerSatisfaction: 4.7,
    averageDeliveryTime: 2.3,
    revenueGrowth: 15.8,
    costEfficiency: 87.5,
  };
  const customReports = [
    {
      id: 1,
      name: "Análisis de Rentabilidad por Cliente",
      description: "Reporte detallado de ingresos y costos por cliente",
      lastGenerated: "2024-01-15",
      status: "ready",
      type: "financial",
    },
    {
      id: 2,
      name: "Eficiencia de Rutas de Entrega",
      description: "Análisis de optimización de rutas y tiempos",
      lastGenerated: "2024-01-14",
      status: "generating",
      type: "operational",
    },
    {
      id: 3,
      name: "Tendencias de Demanda Regional",
      description: "Patrones de demanda por ubicación geográfica",
      lastGenerated: "2024-01-13",
      status: "ready",
      type: "market",
    },
    {
      id: 4,
      name: "Análisis de Costos Operativos",
      description: "Desglose detallado de costos por categoría",
      lastGenerated: "2024-01-12",
      status: "error",
      type: "financial",
    },
  ];
  const kpiData = [
    {
      name: "Entregas a Tiempo",
      value: 94.2,
      target: 95,
      trend: "up",
      color: "green",
    },
    {
      name: "Satisfacción del Cliente",
      value: 4.7,
      target: 4.5,
      trend: "up",
      color: "green",
    },
    {
      name: "Tiempo Promedio de Entrega",
      value: 2.3,
      target: 2.0,
      trend: "down",
      color: "yellow",
    },
    {
      name: "Eficiencia de Costos",
      value: 87.5,
      target: 90,
      trend: "up",
      color: "yellow",
    },
    {
      name: "Tasa de Incidencias",
      value: 2.1,
      target: 1.5,
      trend: "down",
      color: "red",
    },
    {
      name: "Utilización de Flota",
      value: 78.9,
      target: 85,
      trend: "up",
      color: "green",
    },
  ];

  useEffect(() => {
    // Simular carga de datos
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [dateRange, selectedReport]);
  const handleGenerateReport = async (reportId) => {
    setLoading(true);
    // Simular generación de reporte
    setTimeout(() => {
      setLoading(false);
      // Actualizar estado del reporte
    }, 2000);
  };

  const handleExportReport = (format) => {
    // Simular exportación
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ready: { label: "Listo", variant: "default", icon: CheckCircle },
      generating: { label: "Generando", variant: "secondary", icon: Clock },
      error: { label: "Error", variant: "destructive", icon: AlertCircle },
    };
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" /> {config.label}
      </Badge>
    );
  };
  const getTypeIcon = (type) => {
    const icons = {
      financial: DollarSign,
      operational: Truck,
      market: TrendingUp,
    };
    return icons[type] || FileText;
  };
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Reportes Avanzados
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button>
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>
      {/* Filtros de fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateRange">Rango de Fechas</Label>
              <DatePickerWithRange
                date={dateRange}
                setDate={setDateRange}
                placeholder="Seleccionar período de análisis"
              />
            </div>
            <div>
              <Label htmlFor="selectedTime">Hora de Inicio</Label>
              <TimePicker
                time={selectedTime}
                setTime={setSelectedTime}
                placeholder="Seleccionar hora de inicio"
                format24h={true}
              />
            </div>
            <div>
              <Label htmlFor="reportTime">Hora de Reporte (12h)</Label>
              <TimePicker
                time={reportTime}
                setTime={setReportTime}
                placeholder="Hora del reporte"
                format24h={false}
              />
            </div>
            <div>
              <Label htmlFor="timeInput">Entrada Simple</Label>
              <TimeInput
                time={selectedTime}
                setTime={setSelectedTime}
                placeholder="HH:MM"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Tabs
        value={selectedReport}
        onValueChange={setSelectedReport}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="performance">Análisis de Rendimiento</TabsTrigger>
          <TabsTrigger value="custom">Reportes Personalizados</TabsTrigger>
          <TabsTrigger value="kpi">KPIs y Métricas</TabsTrigger>
          <TabsTrigger value="trends">Análisis de Tendencias</TabsTrigger>
        </TabsList>
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Envíos
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics.totalShipments.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12% desde el mes pasado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Entregas a Tiempo
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics.onTimeDelivery}%
                </div>
                <p className="text-xs text-muted-foreground">
                  +2.1% desde el mes pasado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Satisfacción Cliente
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics.customerSatisfaction}/5
                </div>
                <p className="text-xs text-muted-foreground">
                  +0.3 desde el mes pasado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Crecimiento Ingresos
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  +{performanceMetrics.revenueGrowth}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Comparado con el año anterior
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento Mensual</CardTitle>
                <CardDescription>
                  Comparación de métricas clave por mes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Gráfico de rendimiento mensual</p>
                    <p className="text-sm">Datos de los últimos 12 meses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Entregas</CardTitle>
                <CardDescription>Por tipo de servicio y región</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Gráfico de distribución</p>
                    <p className="text-sm">Análisis por categorías</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="custom" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Reportes Personalizados</h3>
              <p className="text-sm text-muted-foreground">
                Crea y gestiona reportes específicos para tu negocio
              </p>
            </div>
            <Button>
              <FileText className="mr-2 h-4 w-4" /> Nuevo Reporte
            </Button>
          </div>
          <div className="grid gap-4">
            {customReports.map((report) => {
              const TypeIcon = getTypeIcon(report.type);
              return (
                <Card key={report.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-muted rounded-lg">
                          <TypeIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{report.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {report.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Última generación: {report.lastGenerated}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(report.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateReport(report.id)}
                          disabled={report.status === "generating"}
                        >
                          {report.status === "generating"
                            ? "Generando..."
                            : "Generar"}
                        </Button>
                        {report.status === "ready" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportReport("pdf")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="kpi" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">
              Indicadores Clave de Rendimiento
            </h3>
            <p className="text-sm text-muted-foreground">
              Monitoreo en tiempo real de métricas críticas del negocio
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {kpiData.map((kpi, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">{kpi.name}</h4>
                    <Badge
                      variant={
                        kpi.color === "green"
                          ? "default"
                          : kpi.color === "yellow"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {kpi.trend === "up" ? "↗" : "↘"}
                      {kpi.trend === "up" ? "Mejorando" : "Requiere atención"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {kpi.value}
                        {kpi.name.includes("Satisfacción") ? "/5" : "%"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Meta: {kpi.target}
                        {kpi.name.includes("Satisfacción") ? "/5" : "%"}
                      </span>
                    </div>
                    <Progress
                      value={
                        kpi.name.includes("Satisfacción")
                          ? (kpi.value / 5) * 100
                          : kpi.value
                      }
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="trends" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Análisis de Tendencias</h3>
            <p className="text-sm text-muted-foreground">
              Identificación de patrones y proyecciones futuras
            </p>
          </div>
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendencias de Crecimiento</CardTitle>
                <CardDescription>
                  Análisis predictivo basado en datos históricos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <LineChart className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg font-medium">Gráfico de Tendencias</p>
                    <p className="text-sm">
                      Proyecciones para los próximos 6 meses
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Crecimiento Proyectado</p>
                        <p className="text-green-600">+18.5%</p>
                      </div>
                      <div>
                        <p className="font-medium">Demanda Estacional</p>
                        <p className="text-blue-600">Pico en Q4</p>
                      </div>
                      <div>
                        <p className="font-medium">Eficiencia Operativa</p>
                        <p className="text-orange-600">+12.3%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
