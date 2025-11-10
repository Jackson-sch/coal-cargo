"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RutaCreateSchema } from "@/lib/validaciones-zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  MapPin,
  Loader2,
  Info,
  DollarSign,
  Truck,
  Clock,
  FileText,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { createRuta, updateRuta } from "@/lib/actions/rutas";
import { getSucursalesList } from "@/lib/actions/sucursales";

const TIPOS_RUTA = [
  { value: "URBANA", label: "Urbana" },
  { value: "INTERURBANA", label: "Interurbana" },
  { value: "INTERPROVINCIAL", label: "Interprovincial" },
  { value: "INTERDEPARTAMENTAL", label: "Interdepartamental" },
];

const TIPOS_VEHICULO = [
  { value: "CAMION_PEQUENO", label: "Camión Pequeño" },
  { value: "CAMION_MEDIANO", label: "Camión Mediano" },
  { value: "CAMION_GRANDE", label: "Camión Grande" },
  { value: "TRAILER", label: "Trailer" },
  { value: "FURGONETA", label: "Furgoneta" },
  { value: "MOTOCICLETA", label: "Motocicleta" },
];

function CompactSectionCard({ icon: Icon, title, children }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-lg bg-primary/10 p-1.5">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function CostSummary({ costoBase, costoPeajes, costoCombustible }) {
  const total =
    Number.parseFloat(costoBase || 0) +
    Number.parseFloat(costoPeajes || 0) +
    Number.parseFloat(costoCombustible || 0);

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">Total</span>
        <span className="text-lg font-bold text-primary">
          S/ {total.toFixed(2)}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <p className="text-muted-foreground">Base</p>
          <p className="font-semibold">
            S/ {Number.parseFloat(costoBase || 0).toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Peajes</p>
          <p className="font-semibold">
            S/ {Number.parseFloat(costoPeajes || 0).toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Combust.</p>
          <p className="font-semibold">
            S/ {Number.parseFloat(costoCombustible || 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RutaForm({ ruta, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    observaciones: false,
  });

  const isEditing = !!ruta;

  const form = useForm({
    resolver: zodResolver(RutaCreateSchema),
    defaultValues: {
      nombre: ruta?.nombre || "",
      codigo: ruta?.codigo || "",
      tipo: ruta?.tipo || "URBANA",
      descripcion: ruta?.descripcion || "",
      activo: ruta?.activo !== undefined ? ruta.activo : true,
      sucursalOrigenId: ruta?.sucursalOrigenId || "",
      sucursalDestinoId: ruta?.sucursalDestinoId || "",
      distancia: ruta?.distancia || undefined,
      tiempoEstimado: ruta?.tiempoEstimado || undefined,
      costoBase: ruta?.costoBase || 0,
      costoPeajes: ruta?.costoPeajes || 0,
      costoCombustible: ruta?.costoCombustible || 0,
      tipoVehiculo: ruta?.tipoVehiculo || undefined,
      capacidadMaxima: ruta?.capacidadMaxima || undefined,
      observaciones: ruta?.observaciones || "",
    },
  });

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const sucursalesResult = await getSucursalesList();

        if (sucursalesResult.success) {
          setSucursales(sucursalesResult.data || []);
        } else {
          toast.error(sucursalesResult.error || "Error al cargar sucursales");
        }
      } catch (error) {
        toast.error("Error al cargar datos del formulario");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [ruta]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = {
        ...data,
        descripcion: data.descripcion || null,
        observaciones: data.observaciones || null,
        tipoVehiculo: data.tipoVehiculo || null,
        distancia: data.distancia || null,
        tiempoEstimado: data.tiempoEstimado || null,
        capacidadMaxima: data.capacidadMaxima || null,
      };

      let result;
      if (isEditing) {
        result = await updateRuta(ruta.id, formData);
      } else {
        result = await createRuta(formData);
      }

      if (result.success) {
        toast.success(result.message || "Ruta guardada correctamente");
        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        toast.error(result.error || "Error al guardar la ruta");
        if (result.field) {
          form.setError(result.field, {
            type: "manual",
            message: result.error,
          });
        }
      }
    } catch (error) {
      console.error("Error al guardar ruta:", error);
      toast.error("Error inesperado al guardar la ruta");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-4xl"
      >
        <div className="pb-3 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "Editar Ruta" : "Nueva Ruta"}
          </h1>
        </div>

        <CompactSectionCard icon={Info} title="Información Básica">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Nombre *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Lima - Arequipa"
                      className="h-8 text-sm"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Código *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="LIMA-AQP-01"
                      className="h-8 text-sm"
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().trim();
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPOS_RUTA.map((tipo) => (
                        <SelectItem
                          key={tipo.value}
                          value={tipo.value}
                          className="text-sm"
                        >
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="activo"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-md border border-border p-2 bg-muted/30">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm">Ruta Activa</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Detalles..."
                    className="resize-none text-sm h-12"
                    rows={2}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </CompactSectionCard>

        <CompactSectionCard icon={MapPin} title="Puntos de Ruta">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="sucursalOrigenId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Origen *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sucursales.length > 0 ? (
                        sucursales.map((sucursal) => (
                          <SelectItem
                            key={sucursal.id}
                            value={sucursal.id}
                            className="text-sm"
                          >
                            {sucursal.nombre}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem
                          value="loading"
                          disabled
                          className="text-xs"
                        >
                          No disponible
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sucursalDestinoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Destino *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sucursales.length > 0 ? (
                        sucursales.map((sucursal) => (
                          <SelectItem
                            key={sucursal.id}
                            value={sucursal.id}
                            className="text-sm"
                          >
                            {sucursal.nombre}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem
                          value="loading"
                          disabled
                          className="text-xs"
                        >
                          No disponible
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </CompactSectionCard>

        <CompactSectionCard icon={Clock} title="Distancia, Tiempo y Vehículo">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="distancia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Distancia (km)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      className="h-8 text-sm"
                      value={field.value || ""}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? undefined
                            : Number.parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tiempoEstimado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Tiempo (min)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="120"
                      className="h-8 text-sm"
                      value={field.value || ""}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? undefined
                            : Number.parseInt(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipoVehiculo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Tipo de Vehículo</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : value)
                    }
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none" className="text-sm">
                        <span className="text-muted-foreground">Ninguno</span>
                      </SelectItem>
                      {TIPOS_VEHICULO.map((tipo) => (
                        <SelectItem
                          key={tipo.value}
                          value={tipo.value}
                          className="text-sm"
                        >
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </CompactSectionCard>

        <CompactSectionCard icon={Truck} title="Capacidad">
          <FormField
            control={form.control}
            name="capacidadMaxima"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Capacidad Máxima (kg)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    className="h-8 text-sm"
                    value={field.value || ""}
                    onChange={(e) => {
                      const value =
                        e.target.value === ""
                          ? undefined
                          : Number.parseFloat(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </CompactSectionCard>

        <CompactSectionCard icon={DollarSign} title="Estructura de Costos">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <FormField
              control={form.control}
              name="costoBase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Costo Base</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="h-8 text-sm"
                      value={field.value || 0}
                      onChange={(e) => {
                        field.onChange(Number.parseFloat(e.target.value) || 0);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="costoPeajes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Peajes</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="h-8 text-sm"
                      value={field.value || 0}
                      onChange={(e) => {
                        field.onChange(Number.parseFloat(e.target.value) || 0);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="costoCombustible"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Combustible</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="h-8 text-sm"
                      value={field.value || 0}
                      onChange={(e) => {
                        field.onChange(Number.parseFloat(e.target.value) || 0);
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          <CostSummary
            costoBase={form.watch("costoBase")}
            costoPeajes={form.watch("costoPeajes")}
            costoCombustible={form.watch("costoCombustible")}
          />
        </CompactSectionCard>

        <CompactSectionCard icon={Truck} title="Capacidad">
          <FormField
            control={form.control}
            name="capacidadMaxima"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Capacidad Máxima (kg)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    className="h-8 text-sm"
                    value={field.value || ""}
                    onChange={(e) => {
                      const value =
                        e.target.value === ""
                          ? undefined
                          : Number.parseFloat(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </CompactSectionCard>

        <Collapsible
          open={expandedSections.observaciones}
          onOpenChange={(open) =>
            setExpandedSections({ ...expandedSections, observaciones: open })
          }
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 p-4 border border-border rounded-lg w-full hover:bg-muted/50 transition-colors"
            >
              <div className="rounded-lg bg-primary/10 p-1.5">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">
                Observaciones Adicionales
              </h3>
              <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto transition-transform" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 border-t border-border mt-3">
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Información adicional..."
                      className="resize-none text-sm h-16"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="text-sm bg-transparent"
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="min-w-[140px] text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Actualizando..." : "Creando..."}
              </>
            ) : (
              <>
                {isEditing ? "Actualizar" : "Crear"} Ruta
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
