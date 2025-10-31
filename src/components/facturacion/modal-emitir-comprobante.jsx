"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  Calculator,
  FileText,
  Receipt,
  Loader2,
  User,
  Building,
  AlertCircle,
  CheckCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { crearComprobanteElectronico } from "@/lib/actions/comprobantes";
import { getClienteByDocumento, createCliente } from "@/lib/actions/clientes";

const TIPOS_COMPROBANTE = [
  {
    value: "BOLETA",
    label: "Boleta de Venta",
    icon: Receipt,
    color: "text-green-600",
  },
  {
    value: "FACTURA",
    label: "Factura",
    icon: FileText,
    color: "text-blue-600",
  },
];

const TIPOS_DOCUMENTO = [
  { value: "DNI", label: "DNI", maxLength: 8 },
  { value: "RUC", label: "RUC", maxLength: 11 },
  { value: "CARNET_EXTRANJERIA", label: "Carné de Extranjería", maxLength: 12 },
  { value: "PASAPORTE", label: "Pasaporte", maxLength: 12 },
];

const UNIDADES_MEDIDA = [
  { value: "NIU", label: "Unidad" },
  { value: "ZZ", label: "Servicio" },
  { value: "KGM", label: "Kilogramo" },
  { value: "MTR", label: "Metro" },
  { value: "LTR", label: "Litro" },
];

export default function ModalEmitirComprobante({
  isOpen,
  onClose,
  envio = null,
  onComprobanteCreado,
}) {
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [mostrarFormularioCliente, setMostrarFormularioCliente] =
    useState(false);

  const [formData, setFormData] = useState({
    tipoComprobante: "BOLETA",
    serie: "B001", // Serie por defecto para boletas
    envioId: null,
    tipoDocumentoCliente: "DNI",
    numeroDocumentoCliente: "",
    nombreCliente: "",
    direccionCliente: "",
    telefonoCliente: "",
    emailCliente: "",
    observaciones: "",
    detalles: [
      {
        descripcion: "Servicio de transporte de carga",
        cantidad: 1,
        precioUnitario: 0,
        unidadMedida: "ZZ",
        descuento: 0,
        tipoDescuento: "PORCENTAJE",
      },
    ],
  });

  // Resetear estados cuando se cierre el modal
  useEffect(() => {
    if (!isOpen) {
      setBuscandoCliente(false);
      setClienteEncontrado(null);
      setMostrarFormularioCliente(false);
    }
  }, [isOpen]);

  // Inicializar formulario con datos del envío
  useEffect(() => {
    if (envio && isOpen) {
      // Determinar el cliente de facturación del envío
      const cf = envio?.clienteFacturacion ?? null;
      let tipoDoc = "DNI";
      let numDoc = "";
      let nombre = "";
      let direccion = "";
      let telefono = "";
      let email = "";

      if (envio?.clienteFacturacionId && cf) {
        tipoDoc = cf.tipoDocumento || "DNI";
        numDoc = cf.numeroDocumento || "";
        nombre = cf.esEmpresa
          ? cf.razonSocial
          : `${cf.nombre ?? ""} ${cf.apellidos ?? ""}`.trim();
        direccion = cf.direccion || "";
        telefono = cf.telefono || "";
        email = cf.email || "";
      } else if (envio?.clienteFacturacionNombre) {
        tipoDoc = envio.clienteFacturacionTipoDocumento || "DNI";
        numDoc = envio.clienteFacturacionNumeroDocumento || "";
        nombre = envio.clienteFacturacionEsEmpresa
          ? envio.clienteFacturacionRazonSocial ||
            envio.clienteFacturacionNombre
          : `${envio.clienteFacturacionNombre ?? ""} ${
              envio.clienteFacturacionApellidos ?? ""
            }`.trim();
        direccion = envio.clienteFacturacionDireccion || "";
        telefono = envio.clienteFacturacionTelefono || "";
        email = envio.clienteFacturacionEmail || "";
      } else {
        const cliente = envio.cliente || envio.destinatario;
        tipoDoc = cliente?.tipoDocumento || "DNI";
        numDoc = cliente?.numeroDocumento || "";
        nombre = cliente?.esEmpresa
          ? cliente?.razonSocial
          : `${cliente?.nombre ?? ""} ${cliente?.apellidos ?? ""}`.trim();
        direccion = cliente?.direccion || "";
        telefono = cliente?.telefono || "";
        email = cliente?.email || "";
      }

      setFormData({
        tipoComprobante: "BOLETA",
        serie: "B001", // Serie por defecto para boletas
        envioId: envio.id,
        tipoDocumentoCliente: tipoDoc,
        numeroDocumentoCliente: numDoc,
        nombreCliente: nombre,
        direccionCliente: direccion,
        telefonoCliente: telefono || "",
        emailCliente: email || "",
        observaciones: `Servicio de transporte - Guía ${
          envio.numeroGuia || envio.guia || ""
        }`,
        detalles: [
          {
            descripcion: `Transporte de carga - ${envio.sucursalOrigen?.nombre} a ${envio.sucursalDestino?.nombre}`,
            cantidad: 1,
            precioUnitario: parseFloat(envio?.total ?? envio?.precio) || 0,
            unidadMedida: "ZZ",
            descuento: 0,
            tipoDescuento: "PORCENTAJE",
          },
        ],
      });
    } else if (!envio && isOpen) {
      // Resetear formulario para comprobante manual
      setFormData({
        tipoComprobante: "BOLETA",
        serie: "B001", // Serie por defecto para boletas
        envioId: null,
        tipoDocumentoCliente: "DNI",
        numeroDocumentoCliente: "",
        nombreCliente: "",
        direccionCliente: "",
        telefonoCliente: "",
        emailCliente: "",
        observaciones: "",
        detalles: [
          {
            descripcion: "Servicio de transporte de carga",
            cantidad: 1,
            precioUnitario: 0,
            unidadMedida: "ZZ",
            descuento: 0,
            tipoDescuento: "PORCENTAJE",
          },
        ],
      });
    }

    setErrores({});
  }, [envio, isOpen]);

  const handleInputChange = (campo, valor) => {
    setFormData((prev) => {
      const newData = { ...prev, [campo]: valor };

      // Actualizar serie automáticamente cuando cambie el tipo de comprobante
      if (campo === "tipoComprobante") {
        newData.serie = valor === "FACTURA" ? "F001" : "B001";
      }

      return newData;
    });

    // Limpiar error del campo
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: null }));
    }
  };

  const handleDetalleChange = (index, campo, valor) => {
    setFormData((prev) => ({
      ...prev,
      detalles: prev.detalles.map((detalle, i) =>
        i === index ? { ...detalle, [campo]: valor } : detalle
      ),
    }));
  };

  const agregarDetalle = () => {
    setFormData((prev) => ({
      ...prev,
      detalles: [
        ...prev.detalles,
        {
          descripcion: "",
          cantidad: 1,
          precioUnitario: 0,
          unidadMedida: "ZZ",
          descuento: 0,
          tipoDescuento: "PORCENTAJE",
        },
      ],
    }));
  };

  const eliminarDetalle = (index) => {
    if (formData.detalles.length > 1) {
      setFormData((prev) => ({
        ...prev,
        detalles: prev.detalles.filter((_, i) => i !== index),
      }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validar tipo de documento y número
    if (!formData.numeroDocumentoCliente.trim()) {
      nuevosErrores.numeroDocumentoCliente =
        "El número de documento es requerido";
    } else {
      const tipoDoc = TIPOS_DOCUMENTO.find(
        (t) => t.value === formData.tipoDocumentoCliente
      );
      if (
        tipoDoc &&
        formData.numeroDocumentoCliente.length !== tipoDoc.maxLength
      ) {
        nuevosErrores.numeroDocumentoCliente = `El ${tipoDoc.label} debe tener ${tipoDoc.maxLength} dígitos`;
      }
    }

    // Validar nombre del cliente
    if (!formData.nombreCliente.trim()) {
      nuevosErrores.nombreCliente = "El nombre del cliente es requerido";
    }

    // Validar detalles
    formData.detalles.forEach((detalle, index) => {
      if (!detalle.descripcion.trim()) {
        nuevosErrores[`detalle_${index}_descripcion`] =
          "La descripción es requerida";
      }
      if (detalle.cantidad <= 0) {
        nuevosErrores[`detalle_${index}_cantidad`] =
          "La cantidad debe ser mayor a 0";
      }
      if (detalle.precioUnitario <= 0) {
        nuevosErrores[`detalle_${index}_precioUnitario`] =
          "El precio debe ser mayor a 0";
      }
    });

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const calcularTotales = () => {
    // Los precios unitarios ya incluyen IGV
    const totalConIgv = formData.detalles.reduce((sum, detalle) => {
      return sum + detalle.cantidad * detalle.precioUnitario;
    }, 0);

    // Calcular subtotal e IGV desde el total que ya incluye IGV
    const subtotal = totalConIgv / 1.18; // Precio sin IGV
    const igv = totalConIgv - subtotal; // IGV = Total - Subtotal
    const total = totalConIgv; // El total es el precio con IGV

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      igv: Math.round(igv * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  };

  // Función para buscar cliente por documento
  const buscarClientePorDocumento = async (numeroDocumento) => {
    if (!numeroDocumento || numeroDocumento.length < 8) return;

    setBuscandoCliente(true);
    setClienteEncontrado(null);
    setMostrarFormularioCliente(false);

    try {
      const resultado = await getClienteByDocumento(numeroDocumento);

      if (resultado.success && resultado.data) {
        const cliente = resultado.data;
        setClienteEncontrado(cliente);

        // Llenar automáticamente los datos del cliente
        setFormData((prev) => ({
          ...prev,
          clienteId: cliente.id,
          tipoDocumentoCliente:
            cliente.tipoDocumento || prev.tipoDocumentoCliente,
          nombreCliente:
            cliente.tipoDocumento === "RUC" || cliente.esEmpresa
              ? cliente.razonSocial || cliente.nombre
              : `${cliente.nombre} ${cliente.apellidos || ""}`.trim(),
          direccionCliente: cliente.direccion || "",
          telefonoCliente: cliente.telefono || prev.telefonoCliente,
          emailCliente: cliente.email || prev.emailCliente,
        }));

        toast.success("Cliente encontrado y datos cargados");
      } else {
        // Cliente no encontrado, mostrar opción para crear
        setMostrarFormularioCliente(true);
        toast.info(
          "Cliente no encontrado. Complete los datos para registrarlo."
        );
      }
    } catch (error) {
      console.error("Error al buscar cliente:", error);
      toast.error("Error al buscar cliente");
      setMostrarFormularioCliente(true);
    } finally {
      setBuscandoCliente(false);
    }
  };

  const crearYGuardarCliente = async () => {
    try {
      const clienteData = {
        tipoDocumento: formData.tipoDocumentoCliente,
        numeroDocumento: formData.numeroDocumentoCliente,
        nombre: formData.nombreCliente,
        direccion: formData.direccionCliente,
        telefono: formData.telefonoCliente,
        email: formData.emailCliente,
        esEmpresa: formData.tipoDocumentoCliente === "RUC",
      };

      if (formData.tipoDocumentoCliente === "RUC") {
        clienteData.razonSocial = formData.nombreCliente;
      } else {
        const nombres = formData.nombreCliente.split(" ");
        clienteData.nombre = nombres[0] || "";
        clienteData.apellidos = nombres.slice(1).join(" ") || "";
      }

      const resultado = await createCliente(clienteData);

      if (resultado.success) {
        setClienteEncontrado(resultado.data);
        setMostrarFormularioCliente(false);
        setFormData((prev) => ({ ...prev, clienteId: resultado.data.id }));
        toast.success("Cliente registrado correctamente");
      } else {
        toast.error(resultado.error || "Error al registrar cliente");
      }
    } catch (error) {
      console.error("Error al crear cliente:", error);
      toast.error("Error al registrar cliente");
    }
  };

  const handleSubmit = async () => {
    if (!validarFormulario()) {
      toast.error("Por favor corrija los errores en el formulario");
      return;
    }

    setLoading(true);
    try {
      // Si hay un cliente nuevo, crearlo primero
      if (mostrarFormularioCliente && !clienteEncontrado) {
        await crearYGuardarCliente();
      }

      const totales = calcularTotales();

      const comprobanteData = {
        tipoComprobante: formData.tipoComprobante,
        serie: formData.serie,
        envioId: formData.envioId,
        clienteId: formData.clienteId || null,
        tipoDocumentoCliente: formData.tipoDocumentoCliente,
        numeroDocumentoCliente: formData.numeroDocumentoCliente,
        nombreCliente: formData.nombreCliente,
        direccionCliente: formData.direccionCliente,
        telefonoCliente: formData.telefonoCliente,
        emailCliente: formData.emailCliente,
        observaciones: formData.observaciones,
        subtotal: totales.subtotal,
        igv: totales.igv,
        total: totales.total,
        detalles: formData.detalles,
      };

      const resultado = await crearComprobanteElectronico(comprobanteData);

      if (resultado.success) {
        toast.success("Comprobante creado exitosamente");
        onComprobanteCreado?.(resultado.data);
        onClose();
      } else {
        toast.error(resultado.error || "Error al crear comprobante");
      }
    } catch (error) {
      console.error("Error al crear comprobante:", error);
      toast.error("Error al crear comprobante");
    } finally {
      setLoading(false);
    }
  };

  const totales = calcularTotales();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formData.tipoComprobante === "FACTURA" ? (
              <FileText className="h-5 w-5 text-blue-600" />
            ) : (
              <Receipt className="h-5 w-5 text-green-600" />
            )}
            {envio
              ? "Emitir Comprobante para Envío"
              : "Emitir Comprobante Manual"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo de comprobante */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipo de Comprobante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={formData.tipoComprobante}
                    onValueChange={(value) =>
                      handleInputChange("tipoComprobante", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_COMPROBANTE.map((tipo) => {
                        const Icon = tipo.icon;
                        return (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${tipo.color}`} />
                              {tipo.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Serie</Label>
                  <Input
                    value={formData.serie}
                    onChange={(e) => handleInputChange("serie", e.target.value)}
                    placeholder="B001"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datos del cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Datos del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Tipo de Documento</Label>
                  <Select
                    value={formData.tipoDocumentoCliente}
                    onValueChange={(value) =>
                      handleInputChange("tipoDocumentoCliente", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_DOCUMENTO.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Número de Documento</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.numeroDocumentoCliente}
                      onChange={(e) =>
                        handleInputChange(
                          "numeroDocumentoCliente",
                          e.target.value
                        )
                      }
                      placeholder="12345678"
                      maxLength={
                        TIPOS_DOCUMENTO.find(
                          (t) => t.value === formData.tipoDocumentoCliente
                        )?.maxLength
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        buscarClientePorDocumento(
                          formData.numeroDocumentoCliente
                        )
                      }
                      disabled={
                        buscandoCliente || !formData.numeroDocumentoCliente
                      }
                      className="px-3"
                    >
                      {buscandoCliente ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errores.numeroDocumentoCliente && (
                    <p className="text-sm text-red-500 mt-1">
                      {errores.numeroDocumentoCliente}
                    </p>
                  )}
                </div>
                <div>
                  {clienteEncontrado && (
                    <div className="flex items-center gap-2 mt-6">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">
                        Cliente encontrado
                      </span>
                    </div>
                  )}
                  {mostrarFormularioCliente && (
                    <div className="flex items-center gap-2 mt-6">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-600">
                        Cliente nuevo
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre / Razón Social</Label>
                  <Input
                    value={formData.nombreCliente}
                    onChange={(e) =>
                      handleInputChange("nombreCliente", e.target.value)
                    }
                    placeholder="Nombre completo o razón social"
                  />
                  {errores.nombreCliente && (
                    <p className="text-sm text-red-500 mt-1">
                      {errores.nombreCliente}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Dirección</Label>
                  <Input
                    value={formData.direccionCliente}
                    onChange={(e) =>
                      handleInputChange("direccionCliente", e.target.value)
                    }
                    placeholder="Dirección del cliente"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    value={formData.telefonoCliente}
                    onChange={(e) =>
                      handleInputChange("telefonoCliente", e.target.value)
                    }
                    placeholder="Teléfono del cliente"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.emailCliente}
                    onChange={(e) =>
                      handleInputChange("emailCliente", e.target.value)
                    }
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles del comprobante */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Detalles del Comprobante
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={agregarDetalle}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Detalle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.detalles.map((detalle, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Detalle {index + 1}</h4>
                      {formData.detalles.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarDetalle(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="col-span-2">
                        <Label>Descripción</Label>
                        <Input
                          value={detalle.descripcion}
                          onChange={(e) =>
                            handleDetalleChange(
                              index,
                              "descripcion",
                              e.target.value
                            )
                          }
                          placeholder="Descripción del producto o servicio"
                        />
                        {errores[`detalle_${index}_descripcion`] && (
                          <p className="text-sm text-red-500 mt-1">
                            {errores[`detalle_${index}_descripcion`]}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={detalle.cantidad}
                          onChange={(e) =>
                            handleDetalleChange(
                              index,
                              "cantidad",
                              parseInt(e.target.value) || 1
                            )
                          }
                        />
                        {errores[`detalle_${index}_cantidad`] && (
                          <p className="text-sm text-red-500 mt-1">
                            {errores[`detalle_${index}_cantidad`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Unidad</Label>
                        <Select
                          value={detalle.unidadMedida}
                          onValueChange={(value) =>
                            handleDetalleChange(index, "unidadMedida", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIDADES_MEDIDA.map((unidad) => (
                              <SelectItem
                                key={unidad.value}
                                value={unidad.value}
                              >
                                {unidad.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Precio Unitario (Inc. IGV)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={detalle.precioUnitario}
                          onChange={(e) =>
                            handleDetalleChange(
                              index,
                              "precioUnitario",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                        {errores[`detalle_${index}_precioUnitario`] && (
                          <p className="text-sm text-red-500 mt-1">
                            {errores[`detalle_${index}_precioUnitario`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Subtotal</Label>
                        <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                          <span className="text-sm font-medium">
                            $
                            {(
                              detalle.cantidad * detalle.precioUnitario
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.observaciones}
                onChange={(e) =>
                  handleInputChange("observaciones", e.target.value)
                }
                placeholder="Observaciones adicionales (opcional)"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Resumen de totales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Resumen de Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${totales.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IGV (18%):</span>
                  <span>${totales.igv.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${totales.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creando...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Emitir Comprobante
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
