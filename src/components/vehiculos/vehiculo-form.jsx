"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { VehiculoCreateSchema } from "@/lib/validaciones-zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Car,
  Loader2,
  AlertCircle,
  Calendar,
  Building2,
  User,
  Info,
} from "lucide-react";
import { createVehiculo, updateVehiculo } from "@/lib/actions/vehiculos";
import { getSucursales } from "@/lib/actions/sucursales";
import { getConductoresDisponibles } from "@/lib/actions/vehiculos";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";

const TIPOS_VEHICULO = [
  { value: "CAMION_PEQUENO", label: "Camión Pequeño" },
  { value: "CAMION_MEDIANO", label: "Camión Mediano" },
  { value: "CAMION_GRANDE", label: "Camión Grande" },
  { value: "TRAILER", label: "Trailer" },
  { value: "FURGONETA", label: "Furgoneta" },
  { value: "MOTOCICLETA", label: "Motocicleta" },
];

const ESTADOS_VEHICULO = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "EN_RUTA", label: "En Ruta" },
  { value: "MANTENIMIENTO", label: "Mantenimiento" },
  { value: "INACTIVO", label: "Inactivo" },
];

export default function VehiculoForm({ vehiculo, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const isEditing = !!vehiculo;

  const form = useForm({
    resolver: zodResolver(VehiculoCreateSchema),
    defaultValues: {
      placa: vehiculo?.placa || "",
      marca: vehiculo?.marca || "",
      modelo: vehiculo?.modelo || "",
      año: vehiculo?.año || undefined,
      pesoMaximo: vehiculo?.pesoMaximo || vehiculo?.capacidad || 1000,
      volumenMaximo: vehiculo?.volumenMaximo || undefined,
      tipoVehiculo: vehiculo?.tipoVehiculo || undefined,
      estado: vehiculo?.estado || "DISPONIBLE",
      sucursalId: vehiculo?.sucursalId || null,
      conductorId: vehiculo?.conductorId || null,
      soat: vehiculo?.soat ? new Date(vehiculo.soat) : null,
      revision: vehiculo?.revision ? new Date(vehiculo.revision) : null,
      observaciones: vehiculo?.observaciones || "",
    },
  });

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [sucursalesResult, conductoresResult] = await Promise.all([
          getSucursales(),
          getConductoresDisponibles(vehiculo?.id),
        ]);

        if (sucursalesResult.success) {
          setSucursales(sucursalesResult.data || []);
        }

        if (conductoresResult.success) {
          // El resultado ya incluye el conductor actual si estamos editando
          setConductores(conductoresResult.data || []);
        }
      } catch (error) {
        toast.error("Error al cargar datos del formulario");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [vehiculo]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Convertir fechas vacías a null
      const formData = {
        ...data,
        soat: data.soat ? data.soat : null,
        revision: data.revision ? data.revision : null,
        sucursalId: data.sucursalId || null,
        conductorId: data.conductorId || null,
        marca: data.marca || null,
        modelo: data.modelo || null,
        año: data.año || null,
        volumenMaximo: data.volumenMaximo || null,
        tipoVehiculo: data.tipoVehiculo || null,
        observaciones: data.observaciones || null,
      };

      let result;
      if (isEditing) {
        result = await updateVehiculo(vehiculo.id, formData);
      } else {
        result = await createVehiculo(formData);
      }

      if (result.success) {
        toast.success(result.message || "Vehículo guardado correctamente");
        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        toast.error(result.error || "Error al guardar el vehículo");
        if (result.field) {
          form.setError(result.field, {
            type: "manual",
            message: result.error,
          });
        }
      }
    } catch (error) {
      toast.error("Error inesperado al guardar el vehículo");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Los campos marcados con * son obligatorios.
          </AlertDescription>
        </Alert>

        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-5 w-5" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="placa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Placa <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="ABC123"
                        className="uppercase"
                        maxLength={6}
                        onChange={(e) => {
                          // Solo permitir letras y números, convertir a mayúsculas
                          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                          if (value.length <= 6) {
                            field.onChange(value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Placa del vehículo (6 caracteres: letras y números)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Toyota" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Hiace" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="año"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="2020"
                        min="1990"
                        max={new Date().getFullYear() + 1}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseInt(value) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipoVehiculo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Vehículo</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value === "none" ? null : value);
                      }}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin especificar</SelectItem>
                        {TIPOS_VEHICULO.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
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
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Estado <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ESTADOS_VEHICULO.map((estado) => (
                          <SelectItem key={estado.value} value={estado.value}>
                            {estado.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Capacidades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capacidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pesoMaximo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Peso Máximo (kg) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="5000"
                        min="100"
                        max="50000"
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseFloat(value) : 100);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Capacidad máxima de peso en kilogramos
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="volumenMaximo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volumen Máximo (m³)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="20"
                        min="1"
                        max="1000"
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseFloat(value) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Capacidad máxima de volumen en metros cúbicos
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Asignación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Asignación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sucursalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value === "none" ? null : value);
                      }}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una sucursal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {sucursales.map((sucursal) => (
                          <SelectItem key={sucursal.id} value={sucursal.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{sucursal.nombre}</span>
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
                name="conductorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conductor</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value === "none" ? null : value);
                      }}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un conductor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {conductores.map((conductor) => (
                          <SelectItem key={conductor.id} value={conductor.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{conductor.name}</span>
                              {conductor.sucursal && (
                                <span className="text-xs text-muted-foreground">
                                  ({conductor.sucursal.nombre})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Solo se muestran conductores disponibles
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Documentos y Fechas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Documentos y Fechas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="soat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimiento SOAT</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={(date) => {
                          field.onChange(date);
                        }}
                        placeholder="dd/mm/aaaa"
                      />
                    </FormControl>
                    <FormDescription>
                      Fecha de vencimiento del SOAT
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="revision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próxima Revisión Técnica</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={(date) => {
                          field.onChange(date);
                        }}
                        placeholder="dd/mm/aaaa"
                      />
                    </FormControl>
                    <FormDescription>
                      Fecha de próxima revisión técnica
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Observaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Observaciones adicionales sobre el vehículo..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={loading}
          >
            Limpiar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Actualizar" : "Crear"} Vehículo
          </Button>
        </div>
      </form>
    </Form>
  );
}

