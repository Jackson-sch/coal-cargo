import { z } from "zod";
import { validarDocumentoPeruano } from "@/lib/utils/documentos.js";
import { CONSTANTES_PERU } from "@/lib/constants/peru.js";

// Validación personalizada para documentos peruanos
const validarDocumento = (tipoDocumento, numeroDocumento) => {
  const numero = String(numeroDocumento || "").trim();
  if (!tipoDocumento || !numero) return false;

  if (tipoDocumento === "DNI" || tipoDocumento === "RUC") {
    return validarDocumentoPeruano(tipoDocumento, numero);
  }

  if (tipoDocumento === "CARNET_EXTRANJERIA") {
    return numero.length >= 9;
  }

  return true;
};

// Schema para destinatario (obligatorio)
const destinatarioSchema = z
  .object({
    nombre: z.string().min(2, "Nombre requerido"),
    telefono: z.string().min(9, "Teléfono requerido"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    direccion: z
      .string()
      .min(10, "Dirección requerida")
      .optional()
      .or(z.literal("")),
    tipoDocumento: z.enum(["DNI", "RUC", "PASAPORTE", "CARNET_EXTRANJERIA"]),
    numeroDocumento: z.string().min(8, "Documento requerido"),
  })
  .refine(
    (data) => validarDocumento(data.tipoDocumento, data.numeroDocumento),
    {
      message: "Formato de documento inválido",
      path: ["numeroDocumento"],
    }
  );

// Schema para remitente (opcional pero si se incluye debe tener datos mínimos)
const remitenteSchema = z
  .object({
    nombre: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    direccion: z.string().optional(),
    tipoDocumento: z
      .enum(["DNI", "RUC", "PASAPORTE", "CARNET_EXTRANJERIA"])
      .optional(),
    numeroDocumento: z.string().optional(),
  })
  .optional();

// Schema para responsable de recojo
const responsableRecojoSchema = z
  .object({
    personaContactoId: z.string().optional(),
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
  .optional();

// Schema para cliente de facturación
const clienteFacturacionSchema = z
  .object({
    clienteId: z.string().optional(),
    esEmpresa: z.boolean().default(false),
    nombre: z.string().optional(),
    apellidos: z.string().optional(),
    razonSocial: z.string().optional(),
    ruc: z.string().optional(),
    tipoDocumento: z
      .enum(["DNI", "RUC", "PASAPORTE", "CARNET_EXTRANJERIA"])
      .optional(),
    numeroDocumento: z.string().optional(),
    direccion: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    telefono: z.string().optional(),
  })
  .optional();

// Schema para información del paquete
const paqueteSchema = z.object({
  peso: z
    .number()
    .min(0.1, "El peso mínimo es 0.1 kg")
    .max(1000, "Peso máximo: 1000 kg"),
  alto: z.number().min(1).max(300).optional(),
  ancho: z.number().min(1).max(300).optional(),
  profundo: z.number().min(1).max(300).optional(),
  descripcion: z
    .string()
    .min(3, "Descripción muy corta")
    .max(500, "Descripción muy larga"),
  valorDeclarado: z.number().min(0).optional(),
  requiereSeguro: z.boolean().default(false),
});

// Schema principal
export const envioSchema = z
  .object({
    // Información del destinatario (obligatorio)
    destinatario: destinatarioSchema,

    // Información del remitente (opcional)
    remitente: remitenteSchema,

    // Responsable de recojo (opcional)
    responsableRecojo: responsableRecojoSchema,

    // Cliente de facturación (opcional)
    clienteFacturacion: clienteFacturacionSchema,

    // Información del paquete (obligatorio)
    paquete: paqueteSchema,

    // Controles de configuración
    incluirRemitente: z.boolean().default(false),
    incluirResponsableRecojo: z.boolean().default(false),
    incluirClienteFacturacion: z.boolean().default(false),

    // Controles de pago y facturación
    quienPaga: z
      .enum(["REMITENTE", "DESTINATARIO", "TERCERO"])
      .default("REMITENTE"),
    facturarA: z
      .enum(["DESTINATARIO", "REMITENTE", "TERCERO"])
      .default("DESTINATARIO"),

    // Tipo de servicio y modalidad
    tipoServicio: z
      .enum(["NORMAL", "EXPRESS", "OVERNIGHT", "ECONOMICO"])
      .default("NORMAL"),
    modalidad: z
      .enum([
        "SUCURSAL_SUCURSAL",
        "SUCURSAL_DOMICILIO",
        "DOMICILIO_SUCURSAL",
        "DOMICILIO_DOMICILIO",
      ])
      .default("SUCURSAL_SUCURSAL"),

    // Ruta de envío
    sucursalOrigenId: z.string().min(1, "Selecciona la sucursal de origen"),
    sucursalDestinoId: z.string().min(1, "Selecciona la sucursal de destino"),

    // Dirección de entrega (si modalidad incluye domicilio)
    direccionEntrega: z.string().optional(),
    distritoEntregaId: z.string().optional(),

    // Instrucciones especiales
    instruccionesEspeciales: z.string().max(500).optional(),
    requiereConfirmacion: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // Validar que origen y destino sean diferentes
      return data.sucursalOrigenId !== data.sucursalDestinoId;
    },
    {
      message: "La sucursal de origen y destino deben ser diferentes",
      path: ["sucursalDestinoId"],
    }
  )
  .refine(
    (data) => {
      // Solo validar remitente si explícitamente se incluye Y tiene datos
      if (data.incluirRemitente === true && data.remitente) {
        return data.remitente.nombre && data.remitente.nombre.trim().length > 0;
      }
      return true;
    },
    {
      message:
        "El nombre del remitente es requerido cuando se incluyen sus datos",
      path: ["remitente.nombre"],
    }
  )
  .refine(
    (data) => {
      // Solo validar teléfono del remitente si explícitamente se incluye Y tiene datos
      if (data.incluirRemitente === true && data.remitente) {
        return (
          data.remitente.telefono && data.remitente.telefono.trim().length >= 9
        );
      }
      return true;
    },
    {
      message:
        "El teléfono del remitente es requerido cuando se incluyen sus datos",
      path: ["remitente.telefono"],
    }
  )
  .refine(
    (data) => {
      // Si modalidad incluye entrega a domicilio, validar dirección
      if (
        data.modalidad === "SUCURSAL_DOMICILIO" ||
        data.modalidad === "DOMICILIO_DOMICILIO"
      ) {
        return data.direccionEntrega && data.direccionEntrega.length >= 10;
      }
      return true;
    },
    {
      message: "La dirección de entrega es requerida para envíos a domicilio",
      path: ["direccionEntrega"],
    }
  );

export default envioSchema;
