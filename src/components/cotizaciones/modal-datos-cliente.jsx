"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatSoles } from "@/lib/utils/formatters";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Package,
  MapPin,
  ArrowRight,
  CheckCircle,
  Search,
  User,
  Phone,
  Mail,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { getClienteByDocumento } from "@/lib/actions/clientes";
const clienteSchema = z.object({
  destinatarioNombre: z
    .string()
    .min(2, "El nombre del destinatario debe tener al menos 2 caracteres"),
  destinatarioTelefono: z
    .string()
    .min(9, "El teléfono debe tener al menos 9 dígitos"),
  destinatarioEmail: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  destinatarioDireccion: z.string().optional(),
  remitenteNombre: z.string().optional(),
  remitenteTelefono: z.string().optional(),
  remitenteEmail: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  tipoDocumento: z
    .enum(["DNI", "RUC", "PASAPORTE", "CARNET_EXTRANJERIA"])
    .default("DNI"),
  numeroDocumento: z
    .string()
    .min(8, "El número de documento debe tener al menos 8 caracteres"),
  incluirResponsableRecojo: z.boolean().default(false),
  responsableRecojo: z
    .object({
      nombre: z.string().optional(),
      apellidos: z.string().optional(),
      tipoDocumento: z
        .enum(["DNI", "RUC", "PASAPORTE", "CARNET_EXTRANJERIA"])
        .optional(),
      numeroDocumento: z.string().optional(),
      telefono: z.string().optional(),
      email: z.string().email("Email inválido").optional().or(z.literal("")),
      direccion: z.string().optional(),
      empresa: z.string().optional(),
      cargo: z.string().optional(),
    })
    .optional()
    .default({}),
});
export default function ModalDatosCliente({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  cotizacion = null,
}) {
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [autoRelleno, setAutoRelleno] = useState(false);
  const form = useForm({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      destinatarioNombre: cotizacion?.nombreCliente || "",
      destinatarioTelefono: cotizacion?.telefonoCliente || "",
      destinatarioEmail: cotizacion?.emailCliente || "",
      destinatarioDireccion: cotizacion?.direccionEntrega || "",
      remitenteNombre: "",
      remitenteTelefono: "",
      remitenteEmail: "",
      tipoDocumento: "DNI",
      numeroDocumento: "",
      incluirResponsableRecojo: false,
      responsableRecojo: {
        nombre: "",
        apellidos: "",
        tipoDocumento: "DNI",
        numeroDocumento: "",
        telefono: "",
        email: "",
        direccion: "",
        empresa: "",
        cargo: "",
      },
    },
  });
  const tipoDocumento = form.watch("tipoDocumento");
  const numeroDocumento = form.watch("numeroDocumento");
  const destinatarioNombreWatch = form.watch("destinatarioNombre");
  const incluirResponsableRecojoWatch = form.watch("incluirResponsableRecojo");
  const clearDestinatarioFields = () => {
    form.setValue("destinatarioNombre", "");
    form.setValue("destinatarioTelefono", "");
    form.setValue("destinatarioEmail", "");
    form.setValue("destinatarioDireccion", "");
  }; // Buscar cliente automáticamente cuando el número está complet o
  useEffect(() => {
    if (!numeroDocumento) {
      if (clienteEncontrado || autoRelleno) {
        clearDestinatarioFields();
      }
      setClienteEncontrado(null);
      setAutoRelleno(false);
      return;
    }

    const clean = numeroDocumento.replace(/\D/g, "");
    const expectedLength = tipoDocumento === "RUC" ? 11 : 8;
    if (clean.length < expectedLength) {
      if (clienteEncontrado || autoRelleno) {
        clearDestinatarioFields();
      }
      setClienteEncontrado(null);
      setAutoRelleno(false);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setBuscandoCliente(true);
        const res = await getClienteByDocumento(clean);
        if (res?.success && res.data) {
          setClienteEncontrado(res.data); // Autocompletar campo s
          const nombreAutocompletar =
            tipoDocumento === "RUC" ||
            res.data.esEmpresa ||
            !!res.data.razonSocial
              ? res.data.razonSocial || res.data.nombre || ""
              : [res.data.nombre, res.data.apellidos].filter(Boolean).join(" ");
          form.setValue("destinatarioNombre", nombreAutocompletar);
          if (res.data.telefono)
            form.setValue("destinatarioTelefono", res.data.telefono);
          if (res.data.email)
            form.setValue("destinatarioEmail", res.data.email);
          if (res.data.direccion)
            form.setValue("destinatarioDireccion", res.data.direccion); // Si es empresa, activar responsable de recojo por defecto y autocompletar empres a
          if (
            tipoDocumento === "RUC" ||
            res.data.esEmpresa ||
            !!res.data.razonSocial
          ) {
            form.setValue("incluirResponsableRecojo", true);
            form.setValue(
              "responsableRecojo.empresa",
              res.data.razonSocial || nombreAutocompletar
            );
          }
          setAutoRelleno(true);
        } else {
          setClienteEncontrado(null);
          clearDestinatarioFields();
          setAutoRelleno(false);
          toast.info(
            "Documento no encontrado. Ingrese datos para registrar nuevo cliente."
          );
        }
      } catch (e) {
        setClienteEncontrado(null);
        clearDestinatarioFields();
        setAutoRelleno(false);
      } finally {
        setBuscandoCliente(false);
      }
    }, 350); // debounce suav e

    return () => clearTimeout(handler);
  }, [numeroDocumento, tipoDocumento]); // Activar/desactivar responsable de recojo automáticamente cuando cambia el tipo de document o
  useEffect(() => {
    const isEmpresa = tipoDocumento === "RUC";
    form.setValue("incluirResponsableRecojo", isEmpresa);
    if (isEmpresa) {
      const nombreEmpresa = form.getValues("destinatarioNombre");
      if (nombreEmpresa) {
        form.setValue("responsableRecojo.empresa", nombreEmpresa);
      }
    }
  }, [tipoDocumento]); // Si cambia el nombre del destinatario y es empresa, mantener empresa sincronizad a
  useEffect(() => {
    if (
      form.getValues("tipoDocumento") === "RUC" &&
      incluirResponsableRecojoWatch
    ) {
      if (!form.getValues("responsableRecojo.empresa")) {
        form.setValue(
          "responsableRecojo.empresa",
          destinatarioNombreWatch || ""
        );
      }
    }
  }, [destinatarioNombreWatch, incluirResponsableRecojoWatch]);

  const handleSubmit = async (data) => {
    console.log("🚀 Enviando formulario con datos:", data);

    // Transformar los datos al formato esperado por el backend
    const datosTransformados = {
      // Campos principales (formato esperado por convertirCotizacionAEnvio)
      nombre: data.destinatarioNombre,
      telefono: data.destinatarioTelefono,
      email: data.destinatarioEmail,
      direccion: data.destinatarioDireccion,
      tipoDocumento: data.tipoDocumento,
      numeroDocumento: data.numeroDocumento,

      // ✅ Campos del remitente (CRÍTICOS)
      remitenteNombre: data.remitenteNombre,
      remitenteTelefono: data.remitenteTelefono,
      remitenteEmail: data.remitenteEmail,

      // Campos del nuevo esquema (para compatibilidad futura)
      destinatarioNombre: data.destinatarioNombre,
      destinatarioTelefono: data.destinatarioTelefono,
      destinatarioEmail: data.destinatarioEmail,
      destinatarioDireccion: data.destinatarioDireccion,

      // ✅ Responsable de Recojo
      incluirResponsableRecojo:
        data.incluirResponsableRecojo || data.tipoDocumento === "RUC" || false,
      responsableRecojo:
        data.incluirResponsableRecojo || data.tipoDocumento === "RUC"
          ? {
              nombre: data.responsableRecojo?.nombre || "",
              apellidos: data.responsableRecojo?.apellidos || "",
              tipoDocumento: data.responsableRecojo?.tipoDocumento || "DNI",
              numeroDocumento: data.responsableRecojo?.numeroDocumento || "",
              telefono: data.responsableRecojo?.telefono || "",
              email: data.responsableRecojo?.email || "",
              direccion: data.responsableRecojo?.direccion || "",
              empresa:
                data.responsableRecojo?.empresa ||
                data.destinatarioNombre ||
                "",
              cargo: data.responsableRecojo?.cargo || "",
            }
          : null,
    };

    console.log("📦 Datos transformados:", datosTransformados);

    // Enviar al padre y limpiar formulario luego
    try {
      console.log("📤 Llamando onSubmit...");
      await onSubmit(datosTransformados);
      console.log("✅ onSubmit completado");
    } catch (error) {
      console.error("❌ Error en onSubmit:", error);
      throw error;
    } finally {
      form.reset({
        destinatarioNombre: "",
        destinatarioTelefono: "",
        destinatarioEmail: "",
        destinatarioDireccion: "",
        remitenteNombre: "",
        remitenteTelefono: "",
        remitenteEmail: "",
        tipoDocumento: "DNI",
        numeroDocumento: "",
        incluirResponsableRecojo: false,
        responsableRecojo: {
          nombre: "",
          apellidos: "",
          tipoDocumento: "DNI",
          numeroDocumento: "",
          telefono: "",
          email: "",
          direccion: "",
          empresa: "",
          cargo: "",
        },
      });
      setClienteEncontrado(null);
      setAutoRelleno(false);
      setBuscandoCliente(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="border-b bg-muted px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-xl">Convertir a Envío</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Complete los datos para crear el envío
              </p>
            </div>
          </div>
        </DialogHeader>
        <div className="grid lg:grid-cols-[280px_1fr] overflow-hidden">
          {/* Sidebar - Resumen compacto */}
          {cotizacion && (
            <div className="border-r bg-muted/50 p-4 overflow-y-auto max-h-[calc(90vh-85px)]">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Resumen
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Origen</p>
                      <p className="font-medium truncate">
                        {cotizacion.sucursalOrigen?.nombre || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-center py-1">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Destino</p>
                      <p className="font-medium truncate">
                        {cotizacion.sucursalDestino?.nombre || "N/A"}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-muted-foreground">Peso</span>
                    <span className="font-medium">{cotizacion.peso} kg</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center py-2 bg-primary/5 -mx-2 px-2 rounded">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-lg font-bold">
                      {formatSoles(cotizacion.precioFinal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Main form - Compact layout */}
          <div className="overflow-y-auto max-h-[calc(90vh-85px)] p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit, (errors) => {
                  console.error("❌ Errores de validación:", errors);
                  toast.error(
                    "Por favor, complete todos los campos obligatorios"
                  );
                })}
                className="space-y-5"
              >
                {/* Paso 1: Documento */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      1
                    </div>
                    <h3 className="text-base font-semibold">Documento</h3>
                    <span className="text-xs text-destructive ml-auto">
                      * Obligatorio
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="tipoDocumento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            Tipo de Documento
                          </FormLabel>
                          <Select
                            onValueChange={(v) => {
                              field.onChange(v);
                              setClienteEncontrado(null);
                              clearDestinatarioFields();
                              setAutoRelleno(false);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="DNI">DNI</SelectItem>
                              <SelectItem value="RUC">RUC</SelectItem>
                              <SelectItem value="PASAPORTE">
                                Pasaporte
                              </SelectItem>
                              <SelectItem value="CARNET_EXTRANJERIA">
                                Carnet de Extranjería
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numeroDocumento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm flex items-center gap-2">
                            Número de Documento *
                            {buscandoCliente && (
                              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Buscando...
                              </span>
                            )}
                            {clienteEncontrado && !buscandoCliente && (
                              <span className="text-xs text-green-600 inline-flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Cliente
                                encontrado
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={
                                tipoDocumento === "RUC"
                                  ? "20123456789"
                                  : "12345678"
                              }
                              className={`h-9 ${
                                clienteEncontrado
                                  ? "border-green-500 bg-green-50"
                                  : ""
                              }`}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={
                                tipoDocumento === "RUC"
                                  ? 11
                                  : tipoDocumento === "DNI"
                                  ? 8
                                  : undefined
                              }
                              {...field}
                              onChange={(e) => {
                                const digits = e.target.value.replace(
                                  /\D/g,
                                  ""
                                );
                                const limit =
                                  tipoDocumento === "RUC"
                                    ? 11
                                    : tipoDocumento === "DNI"
                                    ? 8
                                    : digits.length;
                                field.onChange(digits.slice(0, limit));
                              }}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <Separator /> {/* Paso 2: Destinatario */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      2
                    </div>
                    <h3 className="text-base font-semibold">Destinatario</h3>
                    <span className="text-xs text-destructive ml-auto">
                      * Obligatorio
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <FormField
                        control={form.control}
                        name="destinatarioNombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">
                              Nombre Completo *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: Juan Carlos Pérez López"
                                className="h-8"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="destinatarioTelefono"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Teléfono *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="999 123 456"
                              className="h-9"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="destinatarioEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="cliente@ejemplo.com"
                              className="h-9"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <div className="sm:col-span-2">
                      <FormField
                        control={form.control}
                        name="destinatarioDireccion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">
                              Dirección de Entrega
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Dirección completa donde se entregará el paquete"
                                className="resize-none h-16 text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                <Separator />
                {/* Paso 3: Responsable de Recojo (visible con toggle, auto ON para RUC) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      3
                    </div>
                    <h3 className="text-base font-semibold">
                      Responsable de Recojo
                    </h3>
                    <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch
                        checked={
                          form.getValues("tipoDocumento") === "RUC"
                            ? true
                            : incluirResponsableRecojoWatch
                        }
                        disabled={form.getValues("tipoDocumento") === "RUC"}
                        onCheckedChange={(val) =>
                          form.setValue("incluirResponsableRecojo", val)
                        }
                      />
                      <span>
                        {form.getValues("tipoDocumento") === "RUC"
                          ? "Incluido por RUC"
                          : "Incluir datos"}
                      </span>
                    </div>
                  </div>
                  {(incluirResponsableRecojoWatch ||
                    form.getValues("tipoDocumento") === "RUC") && (
                    <div className="space-y-3 p-3 border rounded-md ">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="responsableRecojo.nombre"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm flex items-center gap-2">
                                <User className="h-4 w-4" /> Nombre
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ej: Juan Carlos"
                                  className="h-9"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="responsableRecojo.apellidos"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Apellidos
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ej: Pérez García"
                                  className="h-9"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="responsableRecojo.tipoDocumento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Tipo de Documento
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="DNI">DNI</SelectItem>
                                  <SelectItem value="RUC">RUC</SelectItem>
                                  <SelectItem value="PASAPORTE">
                                    Pasaporte
                                  </SelectItem>
                                  <SelectItem value="CARNET_EXTRANJERIA">
                                    Carnet de Extranjería
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="responsableRecojo.numeroDocumento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Número de Documento
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={
                                    form.watch(
                                      "responsableRecojo.tipoDocumento"
                                    ) === "RUC"
                                      ? "20123456789"
                                      : "12345678"
                                  }
                                  className="h-9"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  maxLength={
                                    form.watch(
                                      "responsableRecojo.tipoDocumento"
                                    ) === "RUC"
                                      ? 11
                                      : form.watch(
                                          "responsableRecojo.tipoDocumento"
                                        ) === "DNI"
                                      ? 8
                                      : undefined
                                  }
                                  {...field}
                                  onChange={(e) => {
                                    const tipo = form.watch(
                                      "responsableRecojo.tipoDocumento"
                                    );
                                    const digits = e.target.value.replace(
                                      /\D/g,
                                      ""
                                    );
                                    const limit =
                                      tipo === "RUC"
                                        ? 11
                                        : tipo === "DNI"
                                        ? 8
                                        : digits.length;
                                    field.onChange(digits.slice(0, limit));
                                  }}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="responsableRecojo.telefono"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm flex items-center gap-2">
                                <Phone className="h-4 w-4" /> Teléfono
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="999 123 456"
                                  className="h-9"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="responsableRecojo.email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm flex items-center gap-2">
                                <Mail className="h-4 w-4" /> Email
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="responsable@empresa.com"
                                  className="h-9"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="responsableRecojo.empresa"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm flex items-center gap-2">
                                <Building className="h-4 w-4" /> Empresa
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nombre de la empresa"
                                  className="h-9"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="responsableRecojo.cargo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Cargo</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ej: Gerente de Logística"
                                  className="h-9"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="responsableRecojo.direccion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm flex items-center gap-2">
                              <MapPin className="h-4 w-4" /> Dirección
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Dirección completa del responsable"
                                className="resize-none h-16 text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
                <Separator /> {/* Paso 4: Remitente */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      4
                    </div>
                    <h3 className="text-base font-semibold">Remitente</h3>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Opcional
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="remitenteNombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Nombre</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nombre del remitente"
                              className="h-9"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="remitenteTelefono"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Teléfono</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="999 123 456"
                              className="h-9"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="remitenteEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="remitente@ejemplo.com"
                              className="h-9"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="h-9 bg-transparent"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      "Crear Envío"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
