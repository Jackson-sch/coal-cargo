"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Building2,
  User,
  Phone,
  MapPin,
  FileText,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Info,
} from "lucide-react";
import { createCliente, updateCliente } from "@/lib/actions/clientes";
import {
  consultarDocumento,
  puedeConsultarDocumento,
} from "@/lib/services/document-api";
import { validarDocumentoPeruano } from "@/lib/utils/documentos.js";
import { validarTelefonoPeruano } from "@/lib/validaciones-zod";

// Schema de validación
const clienteSchema = z
  .object({
    tipoDocumento: z.enum(["DNI", "RUC", "PASAPORTE", "CARNET_EXTRANJERIA"], {
      required_error: "Selecciona un tipo de documento",
    }),
    numeroDocumento: z
      .string()
      .min(8, "Número de documento inválido")
      .max(11, "Número de documento inválido")
      .refine((val) => /^\d+$/.test(val), "Solo números"),
    nombre: z.string().min(2, "Nombre muy corto").max(100, "Nombre muy largo"),
    apellidos: z.string().max(100, "Apellidos muy largos").optional(),
    razonSocial: z.string().max(200, "Razón social muy larga").optional(),
    email: z
      .string()
      .email({ message: "Email inválido" })
      .optional()
      .or(z.literal("")),
    telefono: z
      .string()
      .min(9, "Teléfono inválido")
      .max(15, "Teléfono inválido")
      .refine(
        (val) => validarTelefonoPeruano(val),
        "Formato de teléfono inválido"
      ),
    direccion: z.string().max(500, "Dirección muy larga").optional(),
    distritoId: z.string().optional(),
    esEmpresa: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // Validaciones específicas por tipo de documento
      if (data.tipoDocumento === "DNI" || data.tipoDocumento === "RUC") {
        if (
          !validarDocumentoPeruano(data.tipoDocumento, data.numeroDocumento)
        ) {
          return false;
        }
      } else if (data.tipoDocumento === "CARNET_EXTRANJERIA") {
        if (data.numeroDocumento.length < 9) {
          return false;
        }
      }
      // Si es empresa, debe tener razón social
      if (data.esEmpresa && !data.razonSocial?.trim()) {
        return false;
      }

      // Si no es empresa, debe tener apellidos
      if (!data.esEmpresa && !data.apellidos?.trim()) {
        return false;
      }

      return true;
    },
    {
      message:
        "Datos inválidos para el tipo de documento o cliente seleccionado",
      path: ["numeroDocumento"],
    }
  );

export default function ClienteForm({ cliente, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [selectedDepartamento, setSelectedDepartamento] = useState("");
  const [selectedProvincia, setSelectedProvincia] = useState("");

  // Estados para autocompletado de documentos
  const [consultingDocument, setConsultingDocument] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [documentError, setDocumentError] = useState(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isEditing = !!cliente;
  const form = useForm({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipoDocumento: cliente?.tipoDocumento || "DNI",
      numeroDocumento: cliente?.numeroDocumento || "",
      nombre: cliente?.nombre || "",
      apellidos: cliente?.apellidos || "",
      razonSocial: cliente?.razonSocial || "",
      email: cliente?.email || "",
      telefono: cliente?.telefono || "",
      direccion: cliente?.direccion || "",
      distritoId: cliente?.distritoId || "",
      esEmpresa: cliente?.esEmpresa || false,
    },
  });

  const esEmpresa = form.watch("esEmpresa");
  const tipoDocumento = form.watch("tipoDocumento");
  const numeroDocumento = form.watch("numeroDocumento");

  useEffect(() => {
    fetchDepartamentos();
  }, []);

  // Cargar datos de ubicación cuando se está editando
  useEffect(() => {
    const loadClienteUbicacion = async () => {
      if (cliente?.distrito) {
        // Establecer los valores seleccionados
        const departamentoId = cliente.distrito.provincia.departamento.id;
        const provinciaId = cliente.distrito.provincia.id;
        const distritoId = cliente.distrito.id;

        // 1. Establecer departamento
        setSelectedDepartamento(departamentoId);

        // 2. Cargar provincias y esperar a que se carguen
        const provinciasCargadas = await fetchProvincias(departamentoId);
        if (provinciasCargadas && provinciasCargadas.length > 0) {
          // 3. Pequeño delay para asegurar que el estado se actualice
          await new Promise((resolve) => setTimeout(resolve, 100));

          // 4. Establecer provincia después de que se carguen
          setSelectedProvincia(provinciaId);

          // 5. Cargar distritos y esperar a que se carguen
          const distritosCargados = await fetchDistritos(provinciaId);
          if (distritosCargados && distritosCargados.length > 0) {
            // 6. Pequeño delay para asegurar que el estado se actualice
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 7. Establecer distrito en el formulario
            form.setValue("distritoId", distritoId);
          }
        }
      }
    };

    if (cliente && departamentos.length > 0) {
      loadClienteUbicacion();
    }
  }, [cliente, departamentos, form]);

  const fetchDepartamentos = async () => {
    try {
      const { getDepartamentos } = await import("@/lib/actions/ubicaciones");
      const result = await getDepartamentos();
      if (result.success) {
        setDepartamentos(result.data);
      }
    } catch (error) {}
  };

  const fetchProvincias = async (departamentoId) => {
    try {
      const { getProvincias } = await import("@/lib/actions/ubicaciones");
      const result = await getProvincias(departamentoId);
      if (result.success) {
        setProvincias(result.data);
        return result.data;
      }
    } catch (error) {}
    return [];
  };

  const fetchDistritos = async (provinciaId) => {
    try {
      const { getDistritos } = await import("@/lib/actions/ubicaciones");
      const result = await getDistritos(provinciaId);
      if (result.success) {
        setDistritos(result.data);
        return result.data;
      }
    } catch (error) {}
    return [];
  };

  const handleDepartamentoChange = (departamentoId) => {
    setSelectedDepartamento(departamentoId);
    setSelectedProvincia("");
    setProvincias([]);
    setDistritos([]);
    form.setValue("distritoId", "");
    if (departamentoId) {
      fetchProvincias(departamentoId);
    }
  };

  const handleProvinciaChange = (provinciaId) => {
    setSelectedProvincia(provinciaId);
    setDistritos([]);
    form.setValue("distritoId", "");
    if (provinciaId) {
      fetchDistritos(provinciaId);
    }
  };

  // Función auxiliar para normalizar nombres de ubicación
  const normalizarNombre = useCallback((nombre) => {
    return nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remover acentos
      .replace(/[^a-z0-9\s]/g, "") // Remover caracteres especiales
      .trim();
  }, []);

  // Función auxiliar para comparar nombres de ubicación
  const compararNombres = useCallback(
    (nombre1, nombre2) => {
      const norm1 = normalizarNombre(nombre1);
      const norm2 = normalizarNombre(nombre2);

      // Comparación exacta
      if (norm1 === norm2) return true;

      // Comparación de inclusión (uno contiene al otro)
      if (norm1.includes(norm2) || norm2.includes(norm1)) return true;

      // Comparación de palabras clave
      const palabras1 = norm1.split(/\s+/);
      const palabras2 = norm2.split(/\s+/);

      // Si al menos 2 palabras coinciden o si es una palabra y coincide
      const coincidencias = palabras1.filter((p1) =>
        palabras2.some((p2) => p1.includes(p2) || p2.includes(p1))
      );

      return (
        coincidencias.length >=
        Math.min(2, Math.min(palabras1.length, palabras2.length))
      );
    },
    [normalizarNombre]
  );

  // Función para autocompletar ubicación desde datos de SUNAT
  const autocompletarUbicacionSUNAT = useCallback(
    async (departamentoNombre, provinciaNombre, distritoNombre) => {
      try {
        // Verificar que tenemos departamentos cargados
        if (!departamentos || departamentos.length === 0) {
          return;
        }

        // 1. Buscar departamento por nombre
        // Búsqueda exacta (case insensitive)
        let departamentoEncontrado = departamentos.find(
          (dept) =>
            dept.nombre.toLowerCase() === departamentoNombre.toLowerCase()
        );

        // Si aún no encuentra, probar búsqueda por palabras clave
        if (!departamentoEncontrado) {
          departamentoEncontrado = departamentos.find((dept) => {
            const deptWords = dept.nombre.toLowerCase().split(/\s+/);
            const searchWords = departamentoNombre.toLowerCase().split(/\s+/);
            return searchWords.some((searchWord) =>
              deptWords.some(
                (deptWord) =>
                  deptWord.includes(searchWord) || searchWord.includes(deptWord)
              )
            );
          });
        }

        if (!departamentoEncontrado) {
          return;
        }
        setSelectedDepartamento(departamentoEncontrado.id);

        // 2. Cargar y buscar provincia
        const provinciasCargadas = await fetchProvincias(
          departamentoEncontrado.id
        );
        if (!provinciasCargadas || provinciasCargadas.length === 0) {
          return;
        }

        // Pequeño delay para asegurar que el estado se actualice
        await new Promise((resolve) => setTimeout(resolve, 200));

        let provinciaEncontrada = provinciasCargadas.find((prov) =>
          compararNombres(prov.nombre, provinciaNombre)
        );

        // Si no encuentra con la función de comparación, probar búsqueda simple
        if (!provinciaEncontrada) {
          provinciaEncontrada = provinciasCargadas.find(
            (prov) =>
              prov.nombre
                .toLowerCase()
                .includes(provinciaNombre.toLowerCase()) ||
              provinciaNombre.toLowerCase().includes(prov.nombre.toLowerCase())
          );
        }

        if (!provinciaEncontrada) {
          return;
        }
        setSelectedProvincia(provinciaEncontrada.id);

        // 3. Cargar y buscar distrito
        const distritosCargados = await fetchDistritos(provinciaEncontrada.id);
        if (!distritosCargados || distritosCargados.length === 0) {
          return;
        }

        // Pequeño delay para asegurar que el estado se actualice
        await new Promise((resolve) => setTimeout(resolve, 200));

        let distritoEncontrado = distritosCargados.find((dist) =>
          compararNombres(dist.nombre, distritoNombre)
        );

        // Si no encuentra con la función de comparación, probar búsqueda simple
        if (!distritoEncontrado) {
          distritoEncontrado = distritosCargados.find(
            (dist) =>
              dist.nombre
                .toLowerCase()
                .includes(distritoNombre.toLowerCase()) ||
              distritoNombre.toLowerCase().includes(dist.nombre.toLowerCase())
          );
        }

        if (!distritoEncontrado) {
          return;
        }

        // 4. Establecer distrito en el formulario
        form.setValue("distritoId", distritoEncontrado.id);
        toast.success("📍 Ubicación autocompletada desde SUNAT");
      } catch (error) {
        // No mostrar error al usuario, es una funcionalidad adicional
      }
    },
    [departamentos, fetchProvincias, fetchDistritos, form, compararNombres]
  );

  // Función para consultar documento automáticamente
  const consultarDocumentoAutomatico = useCallback(
    async (tipo, numero) => {
      if (!puedeConsultarDocumento(tipo) || !numero) return;

      // Validar formato con validador compartido
      const valido = validarDocumentoPeruano(tipo, String(numero).trim());
      if (!valido) {
        const msg =
          tipo === "RUC"
            ? "RUC inválido: debe ser un RUC válido de 11 dígitos"
            : tipo === "DNI"
            ? "DNI inválido: debe tener 8 dígitos"
            : "Número de documento inválido para el tipo seleccionado";
        setDocumentError(msg);
        toast.error(msg);
        return;
      }

      setConsultingDocument(true);
      setDocumentError(null);
      setDocumentData(null);

      try {
        const result = await consultarDocumento(tipo, numero);
        if (result.success) {
          setDocumentData(result.data);

          // Autocompletar campos según el tipo de documento
          if (tipo === "DNI" && result.data) {
            form.setValue("nombre", result.data.nombres || "");
            form.setValue("apellidos", result.data.apellidos || "");
            toast.success("✅ Datos obtenidos de RENIEC");
          } else if (tipo === "RUC" && result.data) {
            form.setValue("razonSocial", result.data.razonSocial || "");
            if (result.data.direccion) {
              form.setValue("direccion", result.data.direccion);
            }

            // Autocompletar ubicación si está disponible
            if (
              result.data.departamento &&
              result.data.provincia &&
              result.data.distrito
            ) {
              try {
                await autocompletarUbicacionSUNAT(
                  result.data.departamento,
                  result.data.provincia,
                  result.data.distrito
                );
              } catch (error) {}
            }

            toast.success("✅ Datos obtenidos de SUNAT");
          }

          setHasUnsavedChanges(true);
        } else {
          setDocumentError(result.error);
          toast.error(result.error);
        }
      } catch (error) {
        const errorMsg = "Error al consultar documento";
        setDocumentError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setConsultingDocument(false);
      }
    },
    [form, autocompletarUbicacionSUNAT]
  );

  // Función para limpiar datos de documento
  const limpiarDatosDocumento = useCallback(() => {
    setDocumentData(null);
    setDocumentError(null);
    setHasUnsavedChanges(true);
  }, []);
  // Auto-guardar borrador (simulado con localStorage)
  const guardarBorrador = useCallback(() => {
    if (!hasUnsavedChanges) return;
    const formData = form.getValues();
    const borrador = {
      ...formData,
      timestamp: new Date().toISOString(),
      isEditing,
    };
    localStorage.setItem("cliente-form-draft", JSON.stringify(borrador));
  }, [form, hasUnsavedChanges, isEditing]);

  // Cargar borrador al iniciar (solo si no estamos editando)
  useEffect(() => {
    if (isEditing) return;
    const borrador = localStorage.getItem("cliente-form-draft");
    if (borrador) {
      try {
        const data = JSON.parse(borrador);
        const timeDiff = new Date() - new Date(data.timestamp);
        // Solo cargar si el borrador es de menos de 1 hora
        if (timeDiff < 3600000) {
          Object.keys(data).forEach((key) => {
            if (key !== "timestamp" && key !== "isEditing") {
              form.setValue(key, data[key]);
            }
          });
          setHasUnsavedChanges(true);
          toast.info("📝 Borrador cargado automáticamente");
        }
      } catch (error) {}
    }
  }, [form, isEditing]);

  // Auto-guardar cada 30 segundos
  useEffect(() => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
    }

    const timer = setInterval(guardarBorrador, 30000);
    setAutoSaveTimer(timer);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [guardarBorrador]);

  // Detectar cambios en el formulario
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Consulta automática cuando cambia el número de documento
  useEffect(() => {
    if (!numeroDocumento || isEditing) return;

    const timer = setTimeout(() => {
      consultarDocumentoAutomatico(tipoDocumento, numeroDocumento);
    }, 1000); // Esperar 1 segundo después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [numeroDocumento, tipoDocumento, isEditing]);

  // Ajustar validaciones según tipo de documento
  useEffect(() => {
    if (tipoDocumento === "RUC") {
      form.setValue("esEmpresa", true);
    }

    // Limpiar datos de documento anterior si cambia el tipo
    limpiarDatosDocumento();
  }, [tipoDocumento]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const tipoDoc = data.tipoDocumento;
      const numDoc = String(data.numeroDocumento || "").trim();

      if (
        (tipoDoc === "DNI" || tipoDoc === "RUC") &&
        !validarDocumentoPeruano(tipoDoc, numDoc)
      ) {
        const msg =
          tipoDoc === "RUC"
            ? "RUC inválido: debe ser un RUC válido de 11 dígitos"
            : "DNI inválido: debe tener 8 dígitos";
        form.setError("numeroDocumento", {
          type: "manual",
          message: msg,
        });
        toast.error(msg);
        setLoading(false);
        return;
      }

      let result;
      if (isEditing) {
        result = await updateCliente(cliente.id, data);
      } else {
        result = await createCliente(data);
      }

      if (result.success) {
        // Limpiar borrador al guardar exitosamente
        localStorage.removeItem("cliente-form-draft");
        setHasUnsavedChanges(false);
        // No mostrar toast aquí, lo manejará el componente padre
        // Pasar los datos del cliente y el indicador de edición al callback
        onSuccess?.(result.data, isEditing);
      } else {
        toast.error(result.error || "Error al guardar cliente");
      }
    } catch (error) {
      toast.error("Error de conexión al guardar cliente");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Indicador de borrador automático */}
        {hasUnsavedChanges && !isEditing && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <RefreshCw className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Borrador automático:</strong> Tus cambios se guardan
              automáticamente cada 30 segundos.
            </AlertDescription>
          </Alert>
        )}

        {/* Información de datos consultados */}
        {documentData && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Datos verificados:</strong> La información fue obtenida
              automáticamente de {tipoDocumento === "DNI" ? "RENIEC" : "SUNAT"}.
              {tipoDocumento === "RUC" && documentData.estado && (
                <span className="ml-2">
                  Estado:
                  <Badge variant="outline" className="ml-1">
                    {documentData.estado}
                  </Badge>
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-min">
          {/* Tipo de cliente - Destacado en la parte superior */}
          <Card className="lg:col-span-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                {esEmpresa ? (
                  <Building2 className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
                Tipo de Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="esEmpresa"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-blue-200 dark:border-blue-800 bg-white/50 dark:bg-blue-950/10 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">
                        {field.value
                          ? "Empresa / Persona Jurídica"
                          : "Persona Natural"}
                      </FormLabel>
                      <FormDescription className="text-sm">
                        {field.value
                          ? "Cliente empresarial con RUC"
                          : "Cliente individual con DNI, Pasaporte o C.E."}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={tipoDocumento === "RUC"}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Información de identificación - Tarjeta principal */}
          <Card className="lg:col-span-7 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
                <FileText className="h-5 w-5" />
                Información de Identificación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipoDocumento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Documento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DNI">DNI</SelectItem>
                          <SelectItem value="RUC">RUC</SelectItem>
                          <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                          <SelectItem value="CARNET_EXTRANJERIA">
                            Carnet de Extranjería
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numeroDocumento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Número de Documento
                        {puedeConsultarDocumento(tipoDocumento) && (
                          <Badge variant="secondary" className="text-xs">
                            <Info className="h-3 w-3 mr-1" />
                            Auto-consulta
                          </Badge>
                        )}
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder={
                              tipoDocumento === "DNI"
                                ? "12345678"
                                : tipoDocumento === "RUC"
                                ? "20123456789"
                                : "Número de documento"
                            }
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
                            className={
                              documentData
                                ? "border-green-500 bg-green-50"
                                : documentError
                                ? "border-red-500 bg-red-50"
                                : ""
                            }
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, "");
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
                        {puedeConsultarDocumento(tipoDocumento) &&
                          field.value && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                consultarDocumentoAutomatico(
                                  tipoDocumento,
                                  field.value
                                )
                              }
                              disabled={consultingDocument}
                              className="shrink-0"
                            >
                              {consultingDocument ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Search className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                      </div>

                      {/* Indicadores de estado */}
                      {consultingDocument && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Consultando {tipoDocumento}...
                        </div>
                      )}
                      {documentData && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Datos obtenidos correctamente
                        </div>
                      )}
                      {documentError && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          {documentError}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {esEmpresa ? (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="razonSocial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Razón Social *
                          {documentData && documentData.razonSocial && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verificado SUNAT
                            </Badge>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nombre de la empresa"
                            {...field}
                            className={
                              documentData && documentData.razonSocial
                                ? "border-green-500 bg-green-50"
                                : ""
                            }
                          />
                        </FormControl>
                        {documentData &&
                          documentData.nombreComercial &&
                          documentData.nombreComercial !==
                            documentData.razonSocial && (
                            <div className="text-sm text-muted-foreground">
                              <strong>Nombre comercial:</strong>
                              {documentData.nombreComercial}
                            </div>
                          )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Representante Legal</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nombres del representante"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="apellidos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellidos</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Apellidos del representante"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Nombres *
                          {documentData && documentData.nombres && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verificado
                            </Badge>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nombres"
                            {...field}
                            className={
                              documentData && documentData.nombres
                                ? "border-green-500 bg-green-50"
                                : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="apellidos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Apellidos *
                          {documentData && documentData.apellidos && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verificado
                            </Badge>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Apellidos"
                            {...field}
                            className={
                              documentData && documentData.apellidos
                                ? "border-green-500 bg-green-50"
                                : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>
          {/* Información de contacto - Tarjeta compacta */}
          <Card className="lg:col-span-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
                <Phone className="h-5 w-5" />
                Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono *</FormLabel>
                    <FormControl>
                      <Input placeholder="999 123 456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="cliente@email.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Información de ubicación - Tarjeta ancha */}
          <Card className="lg:col-span-12 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                <MapPin className="h-5 w-5" />
                Información de Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Departamento - Solo para navegación, no se guarda */}
                <div className="grid gap-2">
                  <Label>Departamento</Label>
                  <Select
                    value={selectedDepartamento}
                    onValueChange={handleDepartamentoChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Provincia - Solo para navegación, no se guarda */}
                <div className="grid gap-2">
                  <Label>Provincia</Label>
                  <Select
                    value={selectedProvincia}
                    onValueChange={handleProvinciaChange}
                    disabled={!selectedDepartamento}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      {provincias.map((prov) => (
                        <SelectItem key={prov.id} value={prov.id}>
                          {prov.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Distrito - Este sí se guarda en el formulario */}
                <FormField
                  control={form.control}
                  name="distritoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distrito</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedProvincia}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona distrito" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {distritos.map((dist) => (
                            <SelectItem key={dist.id} value={dist.id}>
                              {dist.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Dirección
                      {documentData && documentData.direccion && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Desde SUNAT
                        </Badge>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Dirección completa (calle, número, referencia)"
                        className={`resize-none ${
                          documentData && documentData.direccion
                            ? "border-green-500 bg-green-50"
                            : ""
                        }`}
                        {...field}
                      />
                    </FormControl>
                    {documentData &&
                      (documentData.departamento ||
                        documentData.provincia ||
                        documentData.distrito) && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Ubicación SUNAT:</strong>
                          {[
                            documentData.distrito,
                            documentData.provincia,
                            documentData.departamento,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {hasUnsavedChanges && !isEditing && (
              <>
                <RefreshCw className="h-4 w-4" />
                Borrador guardado automáticamente
              </>
            )}
          </div>
          <div className="flex gap-3">
            {!isEditing && hasUnsavedChanges && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  localStorage.removeItem("cliente-form-draft");
                  form.reset();
                  setHasUnsavedChanges(false);
                  setDocumentData(null);
                  setDocumentError(null);
                  toast.info("Formulario reiniciado");
                }}
              >
                Limpiar Borrador
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-2 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : isEditing ? (
                "Actualizar Cliente"
              ) : (
                "Crear Cliente"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
