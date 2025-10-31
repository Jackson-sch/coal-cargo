"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Users,
  Truck,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
} from "lucide-react";
import { formatSoles } from "@/lib/utils/formatters";

export default function EstadisticasPage() {
  const [loading, setLoading] = useState(false);
  const [fechaRango, setFechaRango] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [periodo, setPeriodo] = useState("mes");
  // Estado para estadísticas reales;
  const [estadisticas, setEstadisticas] = useState({
    resumen: {
      totalEnvios: 0,
      ingresosTotales: 0,
      clientesActivos: 0,
      enviosEnTransito: 0,
    },
    enviosPorEstado: [],
    ingresosPorMes: [],
    topClientes: [],
    rutasPopulares: [],
  });

  // Configuración de colores para los gráficos
  const chartConfig = {
    // Claves que coinciden con los valores reales de "estado" para que el ChartLegend muestre texto
    ENTREGADO: { label: "Entregado", color: "#22c55e" },
    EN_TRANSITO: { label: "En Tránsito", color: "#3b82f6" },
    EN_REPARTO: { label: "En Reparto", color: "#3b82f6" },
    EN_BODEGA: { label: "En bodega", color: "#6b7280" },
    PENDIENTE: { label: "Pendiente", color: "#f59e0b" },
    REGISTRADO: { label: "Registrado", color: "#f59e0b" },
    ANULADO: { label: "Anulado", color: "#ef4444" },
    DEVUELTO: { label: "Devuelto", color: "#ef4444" },
    ingresos: {
      label: "Ingresos",
      color: "#8b5cf6",
    },
    envios: {
      label: "Envíos",
      color: "#06b6d4",
    },
  };

  const periodos = [
    { value: "semana", label: "Última Semana" },
    { value: "mes", label: "Último Mes" },
    { value: "trimestre", label: "Último Trimestre" },
    { value: "año", label: "Último Año" },
    { value: "personalizado", label: "Personalizado" },
  ];

  useEffect(() => {
    cargarEstadisticas();
  }, [fechaRango, periodo]);

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        periodo,
        ...(fechaRango?.from
          ? { fechaDesde: fechaRango.from.toISOString() }
          : {}),
        ...(fechaRango?.to ? { fechaHasta: fechaRango.to.toISOString() } : {}),
      });
      const res = await fetch(`/api/estadisticas?${params.toString()}`);
      const result = await res.json();
      if (result?.success) {
        const estadoColor = (estado) => {
          switch (estado) {
            case "ENTREGADO":
              return "#22c55e";
            case "EN_TRANSITO":
            case "EN_REPARTO":
              return "#3b82f6";
            case "EN_BODEGA":
              return "#6b7280";
            case "PENDIENTE":
            case "REGISTRADO":
              return "#f59e0b";
            case "ANULADO":
            case "DEVUELTO":
              return "#ef4444";
            default:
              return "#6b7280";
          }
        };
        setEstadisticas({
          ...result.data,
          enviosPorEstado: result.data.enviosPorEstado.map((e) => ({
            ...e,
            color: estadoColor(e.estado),
          })),
        });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Función para aplicar filtros;
  const aplicarFiltros = () => {
    setLoading(true);

    // Simular llamada a API con filtros;
    setTimeout(() => {
      // Aquí normalmente harías una llamada a la API con los filtros aplicados// Por ahora mantenemos los datos mock;
      setLoading(false);
    }, 1000);
  };

  // Función para limpiar filtros;
  const limpiarFiltros = () => {
    setFechaRango({ from: null, to: null });
    setPeriodo("mes");
    aplicarFiltros();
  };

  // Aplicar filtros cuando cambien;
  useEffect(() => {
    aplicarFiltros();
  }, [fechaRango, periodo]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
          <p className="text-muted-foreground">
            Análisis detallado del rendimiento de tu negocio
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DatePickerWithRange
            date={fechaRango}
            setDate={setFechaRango}
            placeholder="Seleccionar rango de fechas"
            className="w-[300px]"
          />

          <div className="flex gap-2">
            <Button onClick={aplicarFiltros} disabled={loading} size="sm">
              {loading ? "Aplicando..." : "Aplicar"}
            </Button>
            <Button
              variant="outline"
              onClick={limpiarFiltros}
              disabled={loading}
              size="sm"
            >
              Limpiar
            </Button>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Envíos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estadisticas?.resumen?.totalEnvios?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +12% desde el período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatSoles(estadisticas?.resumen?.ingresosTotales || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +8% desde el período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estadisticas.resumen.clientesActivos}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +5% desde el período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Tránsito</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estadisticas.resumen.enviosEnTransito}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 text-red-500" />
              -3% desde el período anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Ingresos por Mes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Ingresos por Mes
            </CardTitle>
            <CardDescription>
              Evolución de ingresos y cantidad de envíos mensuales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart
                accessibilityLayer
                data={estadisticas.ingresosPorMes}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="mes"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v) => formatSoles(v)}
                  width={60}
                />
                <YAxis yAxisId="right" orientation="right" width={40} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item) => (
                        <div className="flex flex-1 justify-between items-center leading-none">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="text-foreground font-mono font-medium tabular-nums">
                            {item?.dataKey === "ingresos"
                              ? formatSoles(value)
                              : value?.toLocaleString?.() || value}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  yAxisId="left"
                  dataKey="ingresos"
                  name="Ingresos"
                  fill="var(--color-ingresos)"
                  radius={4}
                />
                <Bar
                  yAxisId="right"
                  dataKey="envios"
                  name="Envíos"
                  fill="var(--color-envios)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Envíos por Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Envíos por Estado
            </CardTitle>
            <CardDescription>
              Distribución de envíos según su estado actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent labelKey="estado" nameKey="estado" />
                  }
                />
                <Pie
                  data={estadisticas.enviosPorEstado}
                  dataKey="cantidad"
                  nameKey="estado"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  {estadisticas.enviosPorEstado.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="estado" />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Tendencias */}
      <div className="grid gap-6 md:grid-cols-3 items-stretch">
        {/* Tendencia de Envíos */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Tendencia de Envíos
            </CardTitle>
            <CardDescription>
              Evolución mensual de la cantidad de envíos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <AreaChart
                accessibilityLayer
                data={estadisticas.ingresosPorMes}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="mes"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis width={36} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div className="flex flex-1 justify-between items-center leading-none">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="text-foreground font-mono font-medium tabular-nums">
                            {value?.toLocaleString?.() || value}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <defs>
                  <linearGradient id="fillEnvios" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-envios)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-envios)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="envios"
                  type="natural"
                  fill="url(#fillEnvios)"
                  fillOpacity={0.4}
                  stroke="var(--color-envios)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Tendencia de Ingresos */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tendencia de Ingresos
            </CardTitle>
            <CardDescription>
              Evolución mensual del monto de ingresos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <AreaChart
                accessibilityLayer
                data={estadisticas.ingresosPorMes}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="mes"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis width={56} tickFormatter={(v) => formatSoles(v)} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item) => (
                        <div className="flex flex-1 justify-between items-center leading-none">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="text-foreground font-mono font-medium tabular-nums">
                            {item?.dataKey === "ingresos"
                              ? formatSoles(value)
                              : value?.toLocaleString?.() || value}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <defs>
                  <linearGradient id="fillIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-ingresos)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-ingresos)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="ingresos"
                  type="natural"
                  fill="url(#fillIngresos)"
                  fillOpacity={0.4}
                  stroke="var(--color-ingresos)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gráfico Financiero Adicional - Comparación de Ingresos vs Costos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Análisis Financiero
            </CardTitle>
            <CardDescription>
              Comparación de ingresos vs costos operativos mensuales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                ...chartConfig,
                costos: { label: "Costos", color: "#ef4444" },
              }}
            >
              <AreaChart
                accessibilityLayer
                data={estadisticas.ingresosPorMes.map((item) => ({
                  ...item,
                  costos: Math.round(item.ingresos * 0.7),
                }))}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="mes"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <defs>
                  <linearGradient
                    id="fillIngresosFin"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-ingresos)"
                      stopOpacity={0.85}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-ingresos)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="fillCostosFin"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-costos)"
                      stopOpacity={0.7}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-costos)"
                      stopOpacity={0.08}
                    />
                  </linearGradient>
                </defs>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item) => (
                        <div className="flex flex-1 justify-between items-center leading-none">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="text-foreground font-mono font-medium tabular-nums">
                            {formatSoles(value)}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Area
                  dataKey="ingresos"
                  type="monotone"
                  fill="url(#fillIngresosFin)"
                  fillOpacity={0.4}
                  stroke="var(--color-ingresos)"
                  strokeWidth={1.6}
                  dot={false}
                />
                <Area
                  dataKey="costos"
                  type="monotone"
                  fill="url(#fillCostosFin)"
                  fillOpacity={0.35}
                  stroke="var(--color-costos)"
                  strokeWidth={1.6}
                  dot={false}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tablas de Datos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Clientes
            </CardTitle>
            <CardDescription>
              Clientes con mayor volumen de envíos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {estadisticas.topClientes.map((cliente, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{cliente.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {cliente.envios} envíos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatSoles(cliente?.ingresos || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">ingresos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rutas Populares */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Rutas Populares
            </CardTitle>
            <CardDescription>Rutas con mayor demanda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {estadisticas.rutasPopulares.map((ruta, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {ruta.origen} → {ruta.destino}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {ruta.envios} envíos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatSoles(ruta?.ingresos || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">ingresos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
