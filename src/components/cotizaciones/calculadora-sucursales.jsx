"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Calculator,
  Package,
  Clock,
  Truck,
  AlertCircle,
  CheckCircle,
  Loader2,
  Building2,
  ArrowRight,
  User,
  Home,
  Zap,
  DollarSign,
  InfoIcon,
  TrendingUp,
} from "lucide-react";
import { calcularPrecioEnvio } from "@/lib/actions/cotizaciones";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatSoles } from "@/lib/utils/formatters";

const calculadoraSchema = z.object({
  sucursalOrigenId: z.string().min(1, "Selecciona la sucursal de origen"),
  sucursalDestinoId: z.string().min(1, "Selecciona la sucursal de destino"),
  peso: z.coerce.number().min(0.1, "El peso debe ser mayor a 0.1 kg"),
  alto: z.coerce.number().optional(),
  ancho: z.coerce.number().optional(),
  profundo: z.coerce.number().optional(),
  tipoServicio: z.enum(["NORMAL", "EXPRESS", "OVERNIGHT", "ECONOMICO"]),
  modalidad: z.enum([
    "SUCURSAL_SUCURSAL",
    "SUCURSAL_DOMICILIO",
    "DOMICILIO_SUCURSAL",
    "DOMICILIO_DOMICILIO",
  ]),
  direccionEntrega: z.string().optional(),
  nombreCliente: z.string().optional(),
  telefonoCliente: z.string().optional(),
});

export default function CalculadoraSucursales({ onCotizacionCreada }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [sucursales, setSucursales] = useState([]);

  const form = useForm({
    resolver: zodResolver(calculadoraSchema),
    defaultValues: {
      peso: 1,
      tipoServicio: "NORMAL",
      modalidad: "SUCURSAL_SUCURSAL",
    },
  });

  const modalidad = form.watch("modalidad");

  useEffect(() => {
    loadSucursales();
  }, []);

  const loadSucursales = async () => {
    try {
      const { getSucursales } = await import("@/lib/actions/sucursales");
      const result = await getSucursales();
      if (result.success) {
        setSucursales(result.data);
      }
    } catch (error) {
      // Error silencioso
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setResultado(null);
      const result = await calcularPrecioEnvio(data);
      if (result.success) {
        setResultado(result.data);
        toast.success("Precio calculado correctamente");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al calcular el precio");
    } finally {
      setLoading(false);
    }
  };

  const requiereInfoCliente =
    modalidad === "SUCURSAL_DOMICILIO" || modalidad === "DOMICILIO_DOMICILIO";

  const getServiceIcon = (tipo) => {
    switch (tipo) {
      case "OVERNIGHT":
        return <Zap className="h-4 w-4" />;
      case "EXPRESS":
        return <Truck className="h-4 w-4" />;
      case "ECONOMICO":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="h-fit">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-4 w-4" />
            Calculadora de Envíos
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Completa los datos para obtener una cotización instantánea
          </p>
        </CardHeader>
        <CardContent className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                    1
                  </div>
                  <span>Ruta de Envío</span>
                </div>
                <div className="pl-7 grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sucursalOrigenId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Origen
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue placeholder="Selecciona sucursal de origen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sucursales.map((sucursal) => (
                              <SelectItem key={sucursal.id} value={sucursal.id}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {sucursal.nombre}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {sucursal.provincia}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sucursalDestinoId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Destino
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue placeholder="Selecciona sucursal de destino" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sucursales.map((sucursal) => (
                              <SelectItem key={sucursal.id} value={sucursal.id}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {sucursal.nombre}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {sucursal.provincia}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                    2
                  </div>
                  <span>Tipo de Servicio</span>
                </div>
                <div className="pl-7 grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="modalidad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Modalidad de Entrega
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SUCURSAL_SUCURSAL">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span>Sucursal a Sucursal</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="SUCURSAL_DOMICILIO">
                              <div className="flex items-center gap-2">
                                <Home className="h-4 w-4" />
                                <span>Sucursal a Domicilio</span>
                                <Badge
                                  variant="secondary"
                                  className="ml-auto text-xs"
                                >
                                  +15%
                                </Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="DOMICILIO_SUCURSAL">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span>Domicilio a Sucursal</span>
                                <Badge
                                  variant="secondary"
                                  className="ml-auto text-xs"
                                >
                                  +10%
                                </Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="DOMICILIO_DOMICILIO">
                              <div className="flex items-center gap-2">
                                <Home className="h-4 w-4" />
                                <span>Domicilio a Domicilio</span>
                                <Badge
                                  variant="secondary"
                                  className="ml-auto text-xs"
                                >
                                  +25%
                                </Badge>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tipoServicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Velocidad de Entrega
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ECONOMICO">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                <span>Económico</span>
                                <Badge
                                  variant="secondary"
                                  className="ml-auto text-xs"
                                >
                                  -20%
                                </Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="NORMAL">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                <span>Normal</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="EXPRESS">
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4" />
                                <span>Express</span>
                                <Badge
                                  variant="secondary"
                                  className="ml-auto text-xs"
                                >
                                  +50%
                                </Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="OVERNIGHT">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                <span>Overnight</span>
                                <Badge
                                  variant="secondary"
                                  className="ml-auto text-xs"
                                >
                                  +100%
                                </Badge>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {requiereInfoCliente && (
                <>
                  <Separator />
                  <div className="space-y-3 animate-in fade-in-50 duration-300">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-3 w-3" />
                      </div>
                      <span>Datos del Cliente</span>
                    </div>
                    <div className="space-y-2 pl-7">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="nombreCliente"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">
                                Nombre Completo
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ej: Juan Pérez"
                                  className="h-9"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="telefonoCliente"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">
                                Teléfono
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ej: 999 123 456"
                                  className="h-9"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="direccionEntrega"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">
                              Dirección de Entrega
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Dirección completa con referencias"
                                className="resize-none h-16"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                    {requiereInfoCliente ? "4" : "3"}
                  </div>
                  <span>Dimensiones del Paquete</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="w-80">
                      <p className="text-xs text-pretty">
                        Las dimensiones son opcionales. Se usarán para calcular
                        el peso volumétrico.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <FormField
                    control={form.control}
                    name="peso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Peso (kg) *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="1.0"
                            className="h-9"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="alto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Alto (cm)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="20"
                            className="h-9"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ancho"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Ancho (cm)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="15"
                            className="h-9"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="profundo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Prof. (cm)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            className="h-9"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-9"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculando precio...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calcular Precio de Envío
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="h-fit lg:sticky lg:top-6">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-4 w-4" />
            Cotización
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Resultado del cálculo de envío
          </p>
        </CardHeader>
        <CardContent className="p-4">
          {resultado ? (
            <div className="space-y-3">
              {/* Precio total destacado */}
              <div className="text-center p-5 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-xs font-medium text-muted-foreground mb-0.5">
                  Costo Total
                </div>
                <div className="text-3xl font-bold tracking-tight">
                  {formatSoles(resultado.precioFinal)}
                </div>
                <Badge variant="outline" className="mt-2 text-xs">
                  {resultado.tipoTarifa}
                </Badge>
              </div>

              {/* Ruta de envío */}
              <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                <div className="flex flex-col items-start">
                  <span className="text-xs text-muted-foreground">Origen</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium text-xs">
                      {resultado.tarifa.sucursalOrigen}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mx-2" />
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground">Destino</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-medium text-xs">
                      {resultado.tarifa.sucursalDestino}
                    </span>
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Desglose del precio */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  Desglose del Precio
                </h4>
                <div className="space-y-0.5 text-xs bg-muted/30 rounded-lg p-2.5">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">Precio base</span>
                    <span className="font-medium">
                      {formatSoles(resultado.precioBase)}
                    </span>
                  </div>
                  {(resultado.multiplicadorServicio !== 1 ||
                    resultado.multiplicadorModalidad !== 1) && (
                    <>
                      <div className="border-t pt-1 mt-1">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <TrendingUp className="h-3 w-3" />
                          <span className="font-medium">Ajustes aplicados</span>
                        </div>
                      </div>
                      {resultado.multiplicadorServicio !== 1 && (
                        <div className="flex justify-between items-center py-1 pl-4">
                          <span className="text-muted-foreground">
                            Por servicio
                          </span>
                          <span className="font-medium">
                            ×{resultado.multiplicadorServicio}
                          </span>
                        </div>
                      )}
                      {resultado.multiplicadorModalidad !== 1 && (
                        <div className="flex justify-between items-center py-1 pl-4">
                          <span className="text-muted-foreground">
                            Por modalidad
                          </span>
                          <span className="font-medium">
                            ×{resultado.multiplicadorModalidad}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {resultado.volumen && (
                    <div className="flex justify-between items-center py-1 border-t mt-1 pt-1">
                      <span className="text-muted-foreground">Volumen</span>
                      <span className="font-medium">
                        {resultado.volumen} m³
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Información adicional */}
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
                  <Clock className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs">Tiempo estimado</div>
                    <div className="text-xs text-muted-foreground">
                      {resultado.tarifa.tiempoEstimado} día(s) hábiles
                    </div>
                  </div>
                </div>
                {resultado.tarifa.observaciones && (
                  <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-900 dark:text-amber-100 flex-1">
                      {resultado.tarifa.observaciones}
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de acción */}
              {onCotizacionCreada && (
                <Button
                  onClick={() =>
                    onCotizacionCreada(form.getValues(), resultado)
                  }
                  className="w-full h-9"
                >
                  <Truck className="mr-2 h-3.5 w-3.5" />
                  Crear Cotización Formal
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted mb-2.5">
                <Calculator className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium mb-1">Esperando cálculo</h3>
              <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                Completa el formulario y presiona "Calcular Precio"
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
