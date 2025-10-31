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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Settings,
  Save,
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  AlertCircle,
  Search,
  Loader2,
} from "lucide-react";
import { LogoUpload } from "@/components/ui/logo-upload";
import {
  obtenerConfiguracionGeneral,
  guardarConfiguracionGeneral,
} from "@/lib/actions/configuracion";
import { consultarRUC } from "@/lib/services/document-api";
import { validarDocumentoPeruano } from "@/lib/utils/documentos.js";
export default function ConfiguracionGeneral() {
  const [configuracion, setConfiguracion] = useState({
    // Información de la empres a
    empresa_nombre: "",
    empresa_ruc: "",
    empresa_direccion: "",
    empresa_telefono: "",
    empresa_email: "",
    empresa_website: "", // Configuración operativ a
    horario_inicio: "08:00",
    horario_fin: "18:00",
    dias_laborables: "Lunes a Viernes",
    tiempo_entrega_local: "24",
    tiempo_entrega_nacional: "72",
    peso_maximo: "50",
    dimension_maxima: "100x100x100", // Configuración de notificacione s
    notificaciones_email: true,
    notificaciones_sms: false,
    notificaciones_whatsapp: true, // Configuración de facturació n
    igv_porcentaje: "18",
    moneda_defecto: "PEN",
    formato_factura: "A4", // Configuración del sistem a
    modo_mantenimiento: false,
    mensaje_mantenimiento: "",
    version_sistema: "1.0.0", // Logo de la empres a
    logo_empresa: null,
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState({});
  const [consultandoRUC, setConsultandoRUC] = useState(false);
  useEffect(() => {
    cargarConfiguracion();
  }, []);
  const cargarConfiguracion = async () => {
    try {
      setCargando(true);
      const result = await obtenerConfiguracionGeneral();
      if (result.success) {
        const data = result.data; // Mapear los datos del server action al formato esperado por el component e
        const configuracionMapeada = {
          // Información de la empres a
          empresa_nombre: data.nombreEmpresa || "",
          empresa_ruc: data.ruc || "",
          empresa_direccion: data.direccion || "",
          empresa_telefono: data.telefono || "",
          empresa_email: data.email || "",
          empresa_website: data.sitioWeb || "", // Configuración operativ a
          horario_inicio: data.horasOperacion?.inicio || "08:00",
          horario_fin: data.horasOperacion?.fin || "18:00",
          dias_laborables: "Lunes a Viernes", // Valor fijo por ahor a
          tiempo_entrega_local: String(data.tiempoEntregaEstandar || 24),
          tiempo_entrega_nacional: String(data.tiempoEntregaExpress || 72),
          peso_maximo: String(data.pesoMaximoKg || 50),
          dimension_maxima:
            String(data.dimensionMaximaCm || 100) +
            "x" +
            String(data.dimensionMaximaCm || 100) +
            "x" +
            String(data.dimensionMaximaCm || 100), // Configuración de notificacione s
          notificaciones_email:
            data.notificacionesEmail !== undefined
              ? data.notificacionesEmail
              : true,
          notificaciones_sms:
            data.notificacionesSMS !== undefined
              ? data.notificacionesSMS
              : false,
          notificaciones_whatsapp:
            data.notificacionesWhatsApp !== undefined
              ? data.notificacionesWhatsApp
              : true, // Configuración de facturació n
          igv_porcentaje: String(data.igv || 18),
          moneda_defecto: data.monedaPrincipal || "PEN",
          formato_factura: data.formatoFactura || "A4", // Configuración del sistem a
          modo_mantenimiento:
            data.mantenimientoActivo !== undefined
              ? data.mantenimientoActivo
              : false,
          mensaje_mantenimiento: data.mensajeMantenimiento || "",
          version_sistema: data.versionSistema || "1.0.0", // Logo de la empres a
          logo_empresa: data.logoEmpresa || null,
        };
        setConfiguracion(configuracionMapeada);
      } else {
        toast.error(result.error || "Error al cargar la configuración");
      }
    } catch (error) {
      toast.error("Error al cargar la configuración");
    } finally {
      setCargando(false);
    }
  };
  const validarCampos = () => {
    const nuevosErrores = {}; // Validaciones de empres a
    if (!configuracion.empresa_nombre.trim()) {
      nuevosErrores.empresa_nombre = "El nombre de la empresa es requerido";
    }

    if (!configuracion.empresa_ruc.trim()) {
      nuevosErrores.empresa_ruc = "El RUC es requerido";
    } else if (!/^\d{11}$/.test(configuracion.empresa_ruc)) {
      nuevosErrores.empresa_ruc = "El RUC debe tener 11 dígitos";
    }

    if (!configuracion.empresa_direccion.trim()) {
      nuevosErrores.empresa_direccion = "La dirección es requerida";
    }

    if (
      configuracion.empresa_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuracion.empresa_email)
    ) {
      nuevosErrores.empresa_email = "El email no tiene un formato válido";
    }

    // Validaciones de configuración operativ a
    if (
      !configuracion.tiempo_entrega_local ||
      configuracion.tiempo_entrega_local <= 0
    ) {
      nuevosErrores.tiempo_entrega_local =
        "El tiempo de entrega local debe ser mayor a 0";
    }

    if (
      !configuracion.tiempo_entrega_nacional ||
      configuracion.tiempo_entrega_nacional <= 0
    ) {
      nuevosErrores.tiempo_entrega_nacional =
        "El tiempo de entrega nacional debe ser mayor a 0";
    }

    if (!configuracion.peso_maximo || configuracion.peso_maximo <= 0) {
      nuevosErrores.peso_maximo = "El peso máximo debe ser mayor a 0";
    }

    // Validaciones de facturació n
    const igv = parseFloat(configuracion.igv_porcentaje);
    if (isNaN(igv) || igv < 0 || igv > 100) {
      nuevosErrores.igv_porcentaje =
        "El IGV debe ser un porcentaje válido (0-100)";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };
  const guardarConfiguracion = async () => {
    if (!validarCampos()) {
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    try {
      setGuardando(true); // Mapear los datos del componente al formato esperado por el server actio n
      const configuracionParaGuardar = {
        // Información de la empres a
        nombreEmpresa: configuracion.empresa_nombre,
        ruc: configuracion.empresa_ruc,
        direccion: configuracion.empresa_direccion,
        telefono: configuracion.empresa_telefono,
        email: configuracion.empresa_email,
        sitioWeb: configuracion.empresa_website,
        logoEmpresa: configuracion.logo_empresa, // Configuración operativa
        horasOperacion: {
          inicio: configuracion.horario_inicio,
          fin: configuracion.horario_fin,
        },
        diasOperacion: {
          lunes: true,
          martes: true,
          miercoles: true,
          jueves: true,
          viernes: true,
          sabado: true,
          domingo: false,
        },
        tiempoEntregaEstandar:
          parseInt(configuracion.tiempo_entrega_local) || 24,
        tiempoEntregaExpress:
          parseInt(configuracion.tiempo_entrega_nacional) || 72,
        pesoMaximoKg: parseFloat(configuracion.peso_maximo) || 50,
        dimensionMaximaCm:
          parseFloat(configuracion.dimension_maxima?.split("x")[0]) || 100, // Configuración de notificacione s
        notificacionesEmail: configuracion.notificaciones_email,
        notificacionesSMS: configuracion.notificaciones_sms,
        notificacionesWhatsApp: configuracion.notificaciones_whatsapp, // Configuración de facturació n
        igv: parseFloat(configuracion.igv_porcentaje) || 18,
        monedaPrincipal: configuracion.moneda_defecto,
        formatoFactura: configuracion.formato_factura, // Configuración del sistem a
        mantenimientoActivo: configuracion.modo_mantenimiento,
        mensajeMantenimiento: configuracion.mensaje_mantenimiento,
        versionSistema: configuracion.version_sistema,
      }; // Validar RUC con validador compartido antes de envia r
      const rucValido = configuracionParaGuardar.ruc
        ? validarDocumentoPeruano(
            "RUC",
            String(configuracionParaGuardar.ruc).trim()
          )
        : true;
      if (!rucValido) {
        setErrores((prev) => ({
          ...prev,
          empresa_ruc: "RUC inválido: debe ser un RUC válido de 11 dígitos",
        }));
        toast.error("RUC inválido: debe ser un RUC válido de 11 dígitos");
        setGuardando(false);
        return;
      }

      const result = await guardarConfiguracionGeneral(
        configuracionParaGuardar
      );
      if (result.success) {
        toast.success("Configuración guardada correctamente");
        setErrores({});
      } else {
        toast.error(result.error || "Error al guardar la configuración");
      }
    } catch (error) {
      toast.error("Error al guardar la configuración");
    } finally {
      setGuardando(false);
    }
  };
  const actualizarCampo = (campo, valor) => {
    setConfiguracion((prev) => ({ ...prev, [campo]: valor })); // Limpiar error del campo si exist e
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: undefined }));
    }
  };
  const handleLogoChange = (logoUrl) => {
    actualizarCampo("logo_empresa", logoUrl);
  };
  const consultarDatosRUC = async () => {
    const ruc = configuracion.empresa_ruc?.trim();
    if (!ruc) {
      toast.error("Ingrese un RUC para consultar");
      return;
    }

    if (!validarDocumentoPeruano("RUC", ruc)) {
      toast.error("RUC inválido: debe ser un RUC válido de 11 dígitos");
      return;
    }

    try {
      setConsultandoRUC(true);
      const result = await consultarRUC(ruc);
      if (result.success && result.data) {
        const datos = result.data; // Autocompletar campos con los datos obtenido s
        const nuevaConfiguracion = {
          ...configuracion,
          empresa_nombre: datos.razonSocial || configuracion.empresa_nombre,
          empresa_direccion: datos.direccion || configuracion.empresa_direccion,
        };
        setConfiguracion(nuevaConfiguracion); // Limpiar errores relacionado s
        setErrores((prev) => ({
          ...prev,
          empresa_nombre: undefined,
          empresa_direccion: undefined,
          empresa_ruc: undefined,
        }));
        toast.success("✅ Datos de empresa obtenidos de SUNAT"); // Mostrar información adicional si está disponibl e
        if (datos.estado && datos.condicion) {
          toast.info(`Estado: ${datos.estado} - Condición: ${datos.condicion}`);
        }
      } else {
        toast.error(result.error || "No se pudieron obtener los datos del RUC");
      }
    } catch (error) {
      toast.error("Error al consultar RUC. Intente nuevamente.");
    } finally {
      setConsultandoRUC(false);
    }
  };
  if (cargando) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Cargando configuración...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Configuración General</h1>
        </div>
        <Button onClick={guardarConfiguracion} disabled={guardando}>
          <Save className="h-4 w-4 mr-2" />
          {guardando ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
      <div className="grid gap-6">
        {/* Información de la Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Información de la Empresa</span>
            </CardTitle>
            <CardDescription>
              Datos básicos de la empresa que aparecerán en documentos y
              comunicaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo de la empresa */}
            <LogoUpload
              currentLogo={configuracion.logo_empresa}
              onLogoChange={handleLogoChange}
            />
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="empresa_nombre">Nombre de la Empresa *</Label>
                <Input
                  id="empresa_nombre"
                  value={configuracion.empresa_nombre || ""}
                  onChange={(e) =>
                    actualizarCampo("empresa_nombre", e.target.value)
                  }
                  className={errores.empresa_nombre ? "border-red-500" : ""}
                />
                {errores.empresa_nombre && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errores.empresa_nombre}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa_ruc">RUC *</Label>
                <div className="flex gap-2">
                  <Input
                    id="empresa_ruc"
                    value={configuracion.empresa_ruc || ""}
                    onChange={(e) => {
                      const digits = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 11);
                      actualizarCampo("empresa_ruc", digits);
                    }}
                    placeholder="20123456789"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={11}
                    className={errores.empresa_ruc ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={consultarDatosRUC}
                    disabled={
                      consultandoRUC || !configuracion.empresa_ruc?.trim()
                    }
                    className="px-3"
                  >
                    {consultandoRUC ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errores.empresa_ruc && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errores.empresa_ruc}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Haga clic en el botón de búsqueda para obtener datos de SUNAT
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa_direccion">Dirección *</Label>
              <Textarea
                id="empresa_direccion"
                value={configuracion.empresa_direccion || ""}
                onChange={(e) =>
                  actualizarCampo("empresa_direccion", e.target.value)
                }
                placeholder="Dirección completa de la empresa"
                rows={2}
                className={errores.empresa_direccion ? "border-red-500" : ""}
              />
              {errores.empresa_direccion && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errores.empresa_direccion}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="empresa_telefono">Teléfono</Label>
                <Input
                  id="empresa_telefono"
                  value={configuracion.empresa_telefono || ""}
                  onChange={(e) =>
                    actualizarCampo("empresa_telefono", e.target.value)
                  }
                  placeholder="+51 999 999 999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa_email">Email</Label>
                <Input
                  id="empresa_email"
                  type="email"
                  value={configuracion.empresa_email || ""}
                  onChange={(e) =>
                    actualizarCampo("empresa_email", e.target.value)
                  }
                  placeholder="contacto@coalcargo.com"
                  className={errores.empresa_email ? "border-red-500" : ""}
                />
                {errores.empresa_email && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errores.empresa_email}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa_website">Sitio Web</Label>
                <Input
                  id="empresa_website"
                  value={configuracion.empresa_website || ""}
                  onChange={(e) =>
                    actualizarCampo("empresa_website", e.target.value)
                  }
                  placeholder="https://coalcargo.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Configuraciones Operativas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Configuraciones Operativas</span>
            </CardTitle>
            <CardDescription>
              Horarios de operación y configuraciones de servicio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horario_inicio">Hora de Inicio</Label>
                <Input
                  id="horario_inicio"
                  type="time"
                  value={configuracion.horario_inicio || "08:00"}
                  onChange={(e) =>
                    actualizarCampo("horario_inicio", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horario_fin">Hora de Fin</Label>
                <Input
                  id="horario_fin"
                  type="time"
                  value={configuracion.horario_fin || "18:00"}
                  onChange={(e) =>
                    actualizarCampo("horario_fin", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dias_laborables">Días Laborables</Label>
              <Input
                id="dias_laborables"
                value={configuracion.dias_laborables || "Lunes a Viernes"}
                onChange={(e) =>
                  actualizarCampo("dias_laborables", e.target.value)
                }
                placeholder="Lunes a Viernes"
              />
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tiempo_entrega_local">
                  Tiempo Entrega Local (horas)
                </Label>
                <Input
                  id="tiempo_entrega_local"
                  type="number"
                  value={configuracion.tiempo_entrega_local || "24"}
                  onChange={(e) =>
                    actualizarCampo("tiempo_entrega_local", e.target.value)
                  }
                  className={
                    errores.tiempo_entrega_local ? "border-red-500" : ""
                  }
                />
                {errores.tiempo_entrega_local && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errores.tiempo_entrega_local}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiempo_entrega_nacional">
                  Tiempo Entrega Nacional (horas)
                </Label>
                <Input
                  id="tiempo_entrega_nacional"
                  type="number"
                  value={configuracion.tiempo_entrega_nacional || "72"}
                  onChange={(e) =>
                    actualizarCampo("tiempo_entrega_nacional", e.target.value)
                  }
                  className={
                    errores.tiempo_entrega_nacional ? "border-red-500" : ""
                  }
                />
                {errores.tiempo_entrega_nacional && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errores.tiempo_entrega_nacional}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="peso_maximo">Peso Máximo (kg)</Label>
                <Input
                  id="peso_maximo"
                  type="number"
                  value={configuracion.peso_maximo || "50"}
                  onChange={(e) =>
                    actualizarCampo("peso_maximo", e.target.value)
                  }
                  className={errores.peso_maximo ? "border-red-500" : ""}
                />
                {errores.peso_maximo && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errores.peso_maximo}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimension_maxima">Dimensión Máxima</Label>
                <Input
                  id="dimension_maxima"
                  value={configuracion.dimension_maxima || "100x100x100"}
                  onChange={(e) =>
                    actualizarCampo("dimension_maxima", e.target.value)
                  }
                  placeholder="100x100x100 (cm)"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Configuraciones de Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" /> <span>Notificaciones</span>
            </CardTitle>
            <CardDescription>
              Configurar los canales de notificación disponibles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificaciones de estado por correo electrónico
                  </p>
                </div>
                <Switch
                  checked={configuracion.notificaciones_email || false}
                  onCheckedChange={(checked) =>
                    actualizarCampo("notificaciones_email", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones por SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificaciones de estado por mensaje de texto
                  </p>
                </div>
                <Switch
                  checked={configuracion.notificaciones_sms || false}
                  onCheckedChange={(checked) =>
                    actualizarCampo("notificaciones_sms", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones por WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificaciones de estado por WhatsApp
                  </p>
                </div>
                <Switch
                  checked={configuracion.notificaciones_whatsapp || false}
                  onCheckedChange={(checked) =>
                    actualizarCampo("notificaciones_whatsapp", checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Configuraciones de Facturación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" /> <span>Facturación</span>
            </CardTitle>
            <CardDescription>
              Configuraciones relacionadas con facturación e impuestos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="igv_porcentaje">IGV (%)</Label>
                <Input
                  id="igv_porcentaje"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={configuracion.igv_porcentaje || "18"}
                  onChange={(e) =>
                    actualizarCampo("igv_porcentaje", e.target.value)
                  }
                  className={errores.igv_porcentaje ? "border-red-500" : ""}
                />
                {errores.igv_porcentaje && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errores.igv_porcentaje}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="moneda_defecto">Moneda Principal</Label>
                <Input
                  id="moneda_defecto"
                  value={configuracion.moneda_defecto || "PEN"}
                  onChange={(e) =>
                    actualizarCampo("moneda_defecto", e.target.value)
                  }
                  placeholder="PEN"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="formato_factura">Formato de Factura</Label>
                <Input
                  id="formato_factura"
                  value={configuracion.formato_factura || "A4"}
                  onChange={(e) =>
                    actualizarCampo("formato_factura", e.target.value)
                  }
                  placeholder="A4"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Configuraciones del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Sistema</CardTitle>
            <CardDescription>
              Configuraciones generales del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo Mantenimiento</Label>
                <p className="text-sm text-muted-foreground">
                  Activar para mostrar página de mantenimiento a los usuarios
                </p>
              </div>
              <Switch
                checked={configuracion.modo_mantenimiento || false}
                onCheckedChange={(checked) =>
                  actualizarCampo("modo_mantenimiento", checked)
                }
              />
            </div>
            {configuracion.modo_mantenimiento && (
              <div className="space-y-2">
                <Label htmlFor="mensaje_mantenimiento">
                  Mensaje de Mantenimiento
                </Label>
                <Textarea
                  id="mensaje_mantenimiento"
                  value={configuracion.mensaje_mantenimiento || ""}
                  onChange={(e) =>
                    actualizarCampo("mensaje_mantenimiento", e.target.value)
                  }
                  rows={3}
                  placeholder="Sistema en mantenimiento. Disculpe las molestias."
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="version_sistema">Versión del Sistema</Label>
              <Input
                id="version_sistema"
                value={configuracion.version_sistema || "1.0.0"}
                onChange={(e) =>
                  actualizarCampo("version_sistema", e.target.value)
                }
                disabled
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
