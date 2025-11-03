"use client";

import { useCallback, useState, useEffect } from "react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEnvioForm } from "@/hooks/useEnvioForm";
import PaqueteTab from "@/components/envios/sections/PaqueteTab";
import RutaServicioTab from "./sections/RutaServicioTab";
import DestinatarioTab from "./sections/DestinatarioTab";
import RemitenteTab from "./sections/RemitenteTab";
import RecojoTab from "./sections/RecojoTab";
import FacturacionTab from "./sections/FacturacionTab";

export default function FormularioEnvioV2({
  cotizacion = null,
  onSubmit: onSubmitProp,
}) {
  const {
    form,
    sucursales,
    incluirRemitente,
    incluirResponsableRecojo,
    incluirClienteFacturacion,
    setIncluirRemitente,
    setIncluirResponsableRecojo,
    setIncluirClienteFacturacion,
  } = useEnvioForm(cotizacion);

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    "ruta",
    "paquete",
    "destinatario",
    "remitente",
    "recojo",
    "facturacion",
    "resumen",
  ];

  // ----------------------
  // Resumen de costo arriba
  // ----------------------
  const [resumenCargando, setResumenCargando] = useState(false);
  const [resumenTotal, setResumenTotal] = useState(null);
  const [resumenError, setResumenError] = useState(null);
  const [resumenInfo, setResumenInfo] = useState(null);

  const origenId = form.watch("sucursalOrigenId");
  const destinoId = form.watch("sucursalDestinoId");
  const tipoServicio = form.watch("tipoServicio");
  const modalidad = form.watch("modalidad");
  const peso = form.watch("paquete.peso");
  const alto = form.watch("paquete.alto");
  const ancho = form.watch("paquete.ancho");
  const profundo = form.watch("paquete.profundo");
  const valorDeclarado = form.watch("paquete.valorDeclarado");

  useEffect(() => {
    // Requisitos mínimos
    if (!origenId || !destinoId || !peso || Number(peso) <= 0) {
      setResumenTotal(null);
      setResumenError(null);
      setResumenInfo(null);
      return;
    }

    if (origenId === destinoId) {
      setResumenTotal(null);
      setResumenError("Origen y destino no pueden ser iguales");
      setResumenInfo(null);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setResumenCargando(true);
        setResumenError(null);

        // Import dinámico del cálculo
        const { calcularCotizacionSucursal } = await import(
          "@/lib/actions/cotizacion-sucursales"
        );
        const result = await calcularCotizacionSucursal({
          sucursalOrigenId: origenId,
          sucursalDestinoId: destinoId,
          peso: parseFloat(peso),
          tipoServicio,
          modalidad,
          valorDeclarado: valorDeclarado
            ? parseFloat(valorDeclarado)
            : undefined,
          largo: profundo ? parseFloat(profundo) : undefined,
          ancho: ancho ? parseFloat(ancho) : undefined,
          alto: alto ? parseFloat(alto) : undefined,
        });

        if (result?.success && result.data?.detalles?.total != null) {
          setResumenTotal(parseFloat(result.data.detalles.total));
          setResumenInfo(result.data);
        } else {
          setResumenTotal(null);
          setResumenError(result?.error || "No se pudo calcular el costo");
          setResumenInfo(null);
        }
      } catch (e) {
        setResumenTotal(null);
        setResumenError("Error calculando el costo");
        setResumenInfo(null);
      } finally {
        setResumenCargando(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [
    origenId,
    destinoId,
    tipoServicio,
    modalidad,
    peso,
    alto,
    ancho,
    profundo,
    valorDeclarado,
  ]);

  const goNext = useCallback(() => {
    setCurrentStep((prev) => {
      const nextStep = prev + 1;
      const maxStep = steps.length - 1;
      return Math.min(nextStep, maxStep);
    });
  }, [steps.length]);

  const goPrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Manejador de errores del formulario para enfocar el paso con errores y notificar
  const handleFormError = useCallback((errors) => {
    try {
      toast.error("Por favor corrige los errores en el formulario");

      if (
        errors?.sucursalOrigenId ||
        errors?.sucursalDestinoId ||
        errors?.tipoServicio ||
        errors?.modalidad
      ) {
        setCurrentStep(0);
        return;
      }

      if (
        errors?.paquete ||
        errors?.["paquete.peso"] ||
        errors?.["paquete.descripcion"]
      ) {
        setCurrentStep(1);
        return;
      }

      if (
        errors?.destinatario ||
        errors?.direccionEntrega ||
        errors?.distritoEntregaId ||
        errors?.instruccionesEspeciales
      ) {
        setCurrentStep(2);
        return;
      }

      if (errors?.remitente) {
        setCurrentStep(3);
        return;
      }

      if (errors?.responsableRecojo) {
        setCurrentStep(4);
        return;
      }

      if (errors?.clienteFacturacion) {
        setCurrentStep(5);
        return;
      }
    } catch {}
  }, []);

  const handleSubmit = useCallback(
    async (values) => {
      try {
        // Validación previa del lado cliente
        const erroresValidacion = [];

        // Validar sucursales
        if (!values.sucursalOrigenId) {
          erroresValidacion.push("Debe seleccionar una sucursal de origen");
        }
        if (!values.sucursalDestinoId) {
          erroresValidacion.push("Debe seleccionar una sucursal de destino");
        }

        // Validar paquete
        if (!values.paquete?.peso || values.paquete.peso <= 0) {
          erroresValidacion.push("El peso del paquete debe ser mayor a 0");
        }
        if (!values.paquete?.descripcion?.trim()) {
          erroresValidacion.push("Debe ingresar una descripción del paquete");
        }

        // Validar destinatario
        if (!values.destinatario?.nombre?.trim()) {
          erroresValidacion.push("El nombre del destinatario es requerido");
        }

        // Validar remitente SOLO si el switch está activado
        if (incluirRemitente === true) {
          if (!values.remitente?.nombre?.trim()) {
            erroresValidacion.push("El nombre del remitente es requerido");
          }
          if (!values.remitente?.telefono?.trim()) {
            erroresValidacion.push("El teléfono del remitente es requerido");
          }
        }

        // Si no se incluye remitente, validar que el destinatario tenga teléfono
        if (incluirRemitente === false) {
          if (!values.destinatario?.telefono?.trim()) {
            erroresValidacion.push("El teléfono del destinatario es requerido");
          }
        }

        // Debug: mostrar estado del switch
        console.log("incluirRemitente:", incluirRemitente);
        console.log("values.remitente:", values.remitente);

        // Si hay errores de validación, mostrarlos
        if (erroresValidacion.length > 0) {
          const errorMessage =
            "Faltan datos requeridos:\n" +
            erroresValidacion.map((error) => `• ${error}`).join("\n");
          toast.error(errorMessage, {
            duration: 8000,
            style: {
              whiteSpace: "pre-line",
            },
          });
          return;
        }

        setLoading(true);

        const paquete = values.paquete || {};
        const pesoFinal = paquete.peso || 0;
        const altoFinal = paquete.alto || undefined;
        const anchoFinal = paquete.ancho || undefined;
        const largoFinal = paquete.profundo || undefined;
        const descripcionFinal = paquete.descripcion || "";
        const valorDeclaradoFinal = paquete.valorDeclarado || undefined;

        const payload = {
          clienteId: null,
          sucursalOrigenId: values.sucursalOrigenId,
          sucursalDestinoId: values.sucursalDestinoId,
          peso: pesoFinal,
          alto: altoFinal,
          ancho: anchoFinal,
          largo: largoFinal,
          descripcion: descripcionFinal,
          valorDeclarado: valorDeclaradoFinal,
          tipoServicio: values.tipoServicio,
          modalidad: values.modalidad,

          // Controles de pago y facturación
          quienPaga: values.quienPaga,
          facturarA: values.facturarA,
          instruccionesEspeciales: values.instruccionesEspeciales || "",
          requiereConfirmacion: !!values.requiereConfirmacion,
          direccionEntrega: values.direccionEntrega || null,
          distritoEntregaId: values.distritoEntregaId || null,

          // Estados de inclusión
          incluirRemitente: incluirRemitente,
          incluirResponsableRecojo: incluirResponsableRecojo,
          incluirClienteFacturacion: incluirClienteFacturacion,

          // Bloques de contacto
          remitenteNombre: values.remitente?.nombre || null,
          remitenteTelefono: values.remitente?.telefono || null,
          remitenteEmail: values.remitente?.email || null,
          remitenteDireccion: values.remitente?.direccion || null,

          // Datos completos del remitente para registro automático
          remitente: incluirRemitente
            ? {
                nombre: values.remitente?.nombre || null,
                telefono: values.remitente?.telefono || null,
                email: values.remitente?.email || null,
                direccion: values.remitente?.direccion || null,
                tipoDocumento: values.remitente?.tipoDocumento || null,
                numeroDocumento: values.remitente?.numeroDocumento || null,
              }
            : null,

          destinatarioNombre: values.destinatario?.nombre || null,
          destinatarioTelefono: values.destinatario?.telefono || null,
          destinatarioEmail: values.destinatario?.email || null,
          destinatarioDireccion: values.destinatario?.direccion || null,

          // Documento del destinatario
          tipoDocumento: values.destinatario?.tipoDocumento || null,
          numeroDocumento: values.destinatario?.numeroDocumento || null,

          // Facturación extendida
          incluirResponsableRecojo: !!values.incluirResponsableRecojo,
          incluirClienteFacturacion: !!values.incluirClienteFacturacion,
          responsableRecojo: values.responsableRecojo || null,
          clienteFacturacion: values.clienteFacturacion || null,
        };

        if (onSubmitProp) {
          // Debug temporal - mostrar datos que se envían
          console.log("incluirRemitente:", incluirRemitente);
          console.log("values.remitente:", values.remitente);
          console.log("payload.remitente:", payload.remitente);

          const result = await onSubmitProp(payload);

          if (result && result.success === false) {
            // Mostrar errores específicos si están disponibles
            if (result.details && Array.isArray(result.details)) {
              const errorMessage =
                result.error +
                "\n" +
                result.details.map((detail) => `• ${detail}`).join("\n");
              toast.error(errorMessage, {
                duration: 8000,
                style: {
                  whiteSpace: "pre-line",
                },
              });
            } else if (result.fieldErrors) {
              Object.entries(result.fieldErrors).forEach(([name, message]) => {
                try {
                  form.setError(name, { type: "manual", message });
                } catch (_) {}
              });
              toast.error(result.error || "Hay errores en los campos");
            } else {
              toast.error(result.error || "No se pudo crear el envío");
            }
            return;
          }

          toast.success("Envío creado correctamente");

          // Opcional: reiniciar y volver al primer paso
          try {
            form.reset();
            setCurrentStep(0);
          } catch {}
        } else {
          // Import dinámico para evitar bundling del server action
          const { createEnvio } = await import("@/lib/actions/envios");
          const result = await createEnvio(payload);

          if (result?.success) {
            toast.success("Envío creado correctamente");
            try {
              form.reset();
              setCurrentStep(0);
            } catch {}
          } else {
            toast.error(result?.error || "Error al crear el envío");
          }
        }
      } catch (error) {
        toast.error("Error interno al crear el envío");
      } finally {
        setLoading(false);
      }
    },
    [
      form,
      onSubmitProp,
      incluirRemitente,
      incluirResponsableRecojo,
      incluirClienteFacturacion,
    ]
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit, handleFormError)}
        onKeyDown={(e) => {
          // Prevenir submit con Enter si no estamos en el último paso
          if (e.key === "Enter" && currentStep < steps.length - 1) {
            e.preventDefault();
          }
        }}
        className="space-y-6"
      >
        <div className="flex items-center gap-2 pb-2 border-b">
          <Package className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Nuevo Envío (v2)</h2>
          <div className="ml-auto text-sm text-muted-foreground">
            Paso {currentStep + 1} de {steps.length}
          </div>
        </div>

        <Progress value={((currentStep + 1) / steps.length) * 100} />

        {/* Resumen arriba */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm">Resumen de envío</CardTitle>
          </CardHeader>
          <CardContent className="text-sm grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span className="text-muted-foreground">Origen:</span>
              <div className="font-medium">
                {sucursales.find((s) => s.id === origenId)?.nombre || "—"}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground">Destino:</span>
              <div className="font-medium">
                {sucursales.find((s) => s.id === destinoId)?.nombre || "—"}
              </div>
            </div>

            <div className="text-right md:text-left">
              <span className="text-muted-foreground">Costo estimado:</span>
              <div className="font-bold text-lg">
                {resumenCargando ? (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculando…
                  </span>
                ) : resumenError ? (
                  <span className="text-amber-600">{resumenError}</span>
                ) : resumenTotal != null ? (
                  <>S/ {resumenTotal.toFixed(2)}</>
                ) : (
                  <span className="text-muted-foreground">
                    Completa ruta y peso
                  </span>
                )}
              </div>
              {resumenTotal != null && !resumenCargando && !resumenError && (
                <div className="text-xs text-muted-foreground">Incluye IGV</div>
              )}
            </div>

            {/* Datos del paquete */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t mt-1 text-xs">
              <div>
                <span className="text-muted-foreground">Peso:</span>
                <div className="font-medium">
                  {peso ? `${parseFloat(peso)} kg` : "—"}
                  {resumenInfo?.parametros?.pesoFacturado &&
                    parseFloat(peso || 0) > 0 &&
                    resumenInfo.parametros.pesoFacturado > parseFloat(peso) && (
                      <span className="ml-1 text-muted-foreground">
                        (Facturado:
                        {Number(resumenInfo.parametros.pesoFacturado).toFixed(
                          2
                        )}
                        kg)
                      </span>
                    )}
                </div>
              </div>

              <div>
                <span className="text-muted-foreground">Dimensiones:</span>
                <div className="font-medium">
                  {alto && ancho && profundo
                    ? `${parseFloat(ancho)}×${parseFloat(alto)}×${parseFloat(
                        profundo
                      )} cm`
                    : "—"}
                </div>
              </div>

              <div>
                <span className="text-muted-foreground">Servicio:</span>
                <div className="font-medium">
                  {(tipoServicio || "—") + " · " + (modalidad || "—")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenido del paso actual */}
        {currentStep === 0 && (
          <div className="pt-4">
            <RutaServicioTab form={form} sucursales={sucursales} />
          </div>
        )}

        {currentStep === 1 && (
          <div className="pt-4">
            <PaqueteTab form={form} />
          </div>
        )}

        {currentStep === 2 && (
          <div className="pt-4">
            <DestinatarioTab form={form} />
          </div>
        )}

        {currentStep === 3 && (
          <div className="pt-4">
            <div className="flex items-center gap-3 mb-4">
              <Switch
                checked={incluirRemitente}
                onCheckedChange={(checked) => {
                  console.log("Switch remitente cambiado a:", checked);
                  setIncluirRemitente(checked);
                  form.setValue("incluirRemitente", checked);

                  // Si se desactiva, limpiar los datos del remitente
                  if (!checked) {
                    form.setValue("remitente.nombre", "");
                    form.setValue("remitente.telefono", "");
                    form.setValue("remitente.email", "");
                    form.setValue("remitente.direccion", "");
                    form.setValue("remitente.tipoDocumento", "DNI");
                    form.setValue("remitente.numeroDocumento", "");
                  }
                }}
              />
              <span className="text-sm">Incluir datos del remitente</span>
            </div>
            {incluirRemitente && <RemitenteTab form={form} />}
          </div>
        )}

        {currentStep === 4 && (
          <div className="pt-4">
            <div className="flex items-center gap-3 mb-4">
              <Switch
                checked={incluirResponsableRecojo}
                onCheckedChange={(checked) => {
                  setIncluirResponsableRecojo(checked);
                  form.setValue("incluirResponsableRecojo", checked);
                }}
              />
              <span className="text-sm">Incluir responsable de recojo</span>
            </div>
            {incluirResponsableRecojo && <RecojoTab form={form} />}
          </div>
        )}

        {currentStep === 5 && (
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quienPaga"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quién paga</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REMITENTE">Remitente</SelectItem>
                          <SelectItem value="DESTINATARIO">
                            Destinatario
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="facturarA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facturar a</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REMITENTE">Remitente</SelectItem>
                          <SelectItem value="DESTINATARIO">
                            Destinatario
                          </SelectItem>
                          <SelectItem value="TERCERO">Tercero</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-3 mb-4">
              <Switch
                checked={incluirClienteFacturacion}
                onCheckedChange={(checked) => {
                  setIncluirClienteFacturacion(checked);
                  form.setValue("incluirClienteFacturacion", checked);
                }}
              />
              <span className="text-sm">Incluir cliente de facturación</span>
            </div>

            {incluirClienteFacturacion && <FacturacionTab form={form} />}
          </div>
        )}

        {currentStep === 6 && (
          <div className="pt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen del Envío</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Ruta y Servicio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Ruta</h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Origen:</span>{" "}
                        {sucursales.find(
                          (s) => s.id === form.watch("sucursalOrigenId")
                        )?.nombre || "—"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Destino:</span>{" "}
                        {sucursales.find(
                          (s) => s.id === form.watch("sucursalDestinoId")
                        )?.nombre || "—"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Servicio:</span>{" "}
                        {form.watch("tipoServicio")} · {form.watch("modalidad")}
                      </p>
                    </div>
                  </div>

                  {/* Costo */}
                  <div>
                    <h4 className="font-semibold mb-2">Costo</h4>
                    <div className="text-sm space-y-1">
                      {resumenTotal != null ? (
                        <p className="text-2xl font-bold text-primary">
                          S/ {resumenTotal.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-muted-foreground">No calculado</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Paquete */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Paquete</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <span className="text-muted-foreground">Peso:</span>{" "}
                        {form.watch("paquete.peso")} kg
                      </p>
                      {form.watch("paquete.alto") &&
                        form.watch("paquete.ancho") &&
                        form.watch("paquete.profundo") && (
                          <p>
                            <span className="text-muted-foreground">
                              Dimensiones:
                            </span>{" "}
                            {form.watch("paquete.ancho")} ×{" "}
                            {form.watch("paquete.alto")} ×{" "}
                            {form.watch("paquete.profundo")} cm
                          </p>
                        )}
                      {form.watch("paquete.valorDeclarado") && (
                        <p>
                          <span className="text-muted-foreground">
                            Valor declarado:
                          </span>{" "}
                          S/{" "}
                          {parseFloat(
                            form.watch("paquete.valorDeclarado")
                          ).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Descripción:</p>
                      <p>{form.watch("paquete.descripcion")}</p>
                    </div>
                  </div>
                </div>

                {/* Destinatario */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Destinatario</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <span className="text-muted-foreground">Nombre:</span>{" "}
                        {form.watch("destinatario.nombre")}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Teléfono:</span>{" "}
                        {form.watch("destinatario.telefono")}
                      </p>
                      {form.watch("destinatario.email") && (
                        <p>
                          <span className="text-muted-foreground">Email:</span>{" "}
                          {form.watch("destinatario.email")}
                        </p>
                      )}
                    </div>
                    {(form.watch("destinatario.direccion") ||
                      form.watch("direccionEntrega")) && (
                      <div>
                        <p className="text-muted-foreground mb-1">Dirección:</p>
                        <p>
                          {form.watch("destinatario.direccion") ||
                            form.watch("direccionEntrega")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Remitente (si está incluido) */}
                {incluirRemitente && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Remitente</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p>
                          <span className="text-muted-foreground">Nombre:</span>{" "}
                          {form.watch("remitente.nombre")}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Teléfono:
                          </span>{" "}
                          {form.watch("remitente.telefono")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Facturación */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Facturación</h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Quién paga:</span>{" "}
                      {form.watch("quienPaga") === "REMITENTE"
                        ? "Remitente"
                        : "Destinatario"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Facturar a:</span>{" "}
                      {form.watch("facturarA") === "REMITENTE"
                        ? "Remitente"
                        : form.watch("facturarA") === "DESTINATARIO"
                        ? "Destinatario"
                        : "Tercero"}
                    </p>
                  </div>
                </div>

                {/* Instrucciones especiales (si hay) */}
                {form.watch("instruccionesEspeciales") && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">
                      Instrucciones especiales
                    </h4>
                    <p className="text-sm">
                      {form.watch("instruccionesEspeciales")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navegación */}
        <div className="flex items-center gap-3 justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={goPrev}
            disabled={currentStep === 0 || loading}
          >
            Anterior
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={goNext} disabled={loading}>
              Siguiente
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Crear Envío"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
