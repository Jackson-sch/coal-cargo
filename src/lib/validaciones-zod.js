import { z } from "zod";
import { validarDocumentoPeruano } from "./utils/documentos.js";
import { CONSTANTES_PERU } from "./constants/peru.js";

// ============ SCHEMAS BASE ============
const EstadoEnvioEnum = z.enum([
  "REGISTRADO",
  "RECOLECTADO",
  "EN_AGENCIA_ORIGEN",
  "EN_TRANSITO",
  "EN_AGENCIA_DESTINO",
  "EN_REPARTO",
  "ENTREGADO",
  "DEVUELTO",
  "EXTRAVIADO",
  "ANULADO",
  "RETENIDO_ADUANA",
]);

const TipoDocumentoEnum = z.enum([
  "DNI",
  "RUC",
  "PASAPORTE",
  "CARNET_EXTRANJERIA",
]);

const TipoServicioEnum = z.enum([
  "NORMAL",
  "EXPRESS",
  "OVERNIGHT",
  "ECONOMICO",
]);

const ModalidadEnum = z.enum([
  "SUCURSAL_SUCURSAL",
  "DOMICILIO_SUCURSAL",
  "SUCURSAL_DOMICILIO",
  "DOMICILIO_DOMICILIO",
]);

const MetodoPagoEnum = z.enum([
  "EFECTIVO",
  "TARJETA_CREDITO",
  "TARJETA_DEBITO",
  "TRANSFERENCIA",
  "DEPOSITO",
  "YAPE",
  "PLIN",
  "TUNKI",
  "BILLETERA_DIGITAL",
  "CREDITO",
]);

// ============ VALIDACIONES DE CLIENTE ============
const ClienteCreateSchema = z.object({
  tipoDocumento: TipoDocumentoEnum,
  numeroDocumento: z
    .string()
    .min(8, "Número de documento inválido")
    .max(11, "Número de documento inválido")
    .refine((val) => /^\d+$/.test(val), "Solo números"),
  nombre: z.string().min(2, "Nombre muy corto").max(100, "Nombre muy largo"),
  apellidos: z
    .string()
    .max(100, "Apellidos muy largos")
    .optional()
    .or(z.literal("")),
  razonSocial: z.string().max(200, "Razón social muy larga").optional(),
  email: z.string().email("Email inválido").optional(),
  telefono: z
    .string()
    .min(9, "Teléfono inválido")
    .max(15, "Teléfono inválido")
    .refine(
      (val) => validarTelefonoPeruano(val),
      "Formato de teléfono inválido"
    ),
  direccion: z.string().max(500, "Dirección muy larga").optional(),
  distritoId: z
    .string()
    .regex(/^dist[_-].+$/, "Formato de distrito inválido")
    .optional(),
  esEmpresa: z.boolean().default(false),
});

const ClienteUpdateSchema = ClienteCreateSchema.partial();

const ClienteSearchSchema = z.object({
  q: z.string().optional(),
  tipoDocumento: TipoDocumentoEnum.optional(),
  numeroDocumento: z.string().optional(),
  estado: z
    .union([z.boolean(), z.enum(["all", "active", "inactive", "deleted"])])
    .optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// ============ VALIDACIONES DE ENVÍO ============
const EnvioCreateSchema = z
  .object({
    // Participantes
    remitenteId: z.string().cuid("ID de remitente inválido"),
    destinatarioId: z.string().cuid("ID de destinatario inválido"),
    // Ubicaciones
    sucursalOrigenId: z.string().cuid("ID de sucursal origen inválido"),
    sucursalDestinoId: z.string().cuid("ID de sucursal destino inválido"),
    direccionRecojo: z.string().max(500).optional(),
    direccionEntrega: z
      .string()
      .min(10, "Dirección de entrega muy corta")
      .max(500, "Dirección de entrega muy larga"),
    referenciaDireccion: z.string().max(200).optional(),
    // Características físicas
    peso: z
      .number()
      .min(0.1, "Peso mínimo 0.1 kg")
      .max(1000, "Peso máximo 1000 kg"),
    largo: z.number().min(1).max(200).optional(),
    ancho: z.number().min(1).max(200).optional(),
    alto: z.number().min(1).max(200).optional(),
    // Contenido
    descripcion: z
      .string()
      .min(5, "Descripción muy corta")
      .max(500, "Descripción muy larga"),
    cantidad: z.number().min(1).max(100).default(1),
    valorDeclarado: z
      .number()
      .min(0)
      .max(100000, "Valor declarado máximo S/ 100,000")
      .optional(),
    esFragil: z.boolean().default(false),
    requiereFrio: z.boolean().default(false),
    // Servicio
    tipoServicio: TipoServicioEnum,
    modalidad: ModalidadEnum,
    // Instrucciones
    instrucciones: z.string().max(500).optional(),
  })
  .refine((data) => data.sucursalOrigenId !== data.sucursalDestinoId, {
    message: "Sucursal origen y destino no pueden ser iguales",
    path: ["sucursalDestinoId"],
  });
const EnvioUpdateSchema = z.object({
  direccionEntrega: z.string().max(500).optional(),
  referenciaDireccion: z.string().max(200).optional(),
  instrucciones: z.string().max(500).optional(),
  observaciones: z.string().max(500).optional(),
  vehiculoId: z.string().cuid().optional(),
  conductorId: z.string().cuid().optional(),
  rutaId: z.string().cuid().optional(),
});

const EnvioSearchSchema = z.object({
  guia: z.string().optional(),
  estado: EstadoEnvioEnum.optional(),
  sucursalOrigenId: z.string().cuid().optional(),
  sucursalDestinoId: z.string().cuid().optional(),
  remitenteId: z.string().cuid().optional(),
  destinatarioId: z.string().cuid().optional(),
  conductorId: z.string().cuid().optional(),
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// ============ VALIDACIONES DE EVENTOS ============
const EventoEnvioCreateSchema = z.object({
  envioId: z.string().cuid("ID de envío inválido"),
  estado: EstadoEnvioEnum,
  descripcion: z
    .string()
    .min(5, "Descripción muy corta")
    .max(200, "Descripción muy larga"),
  comentario: z.string().max(500).optional(),
  latitud: z.number().min(-90).max(90).optional(),
  longitud: z.number().min(-180).max(180).optional(),
  direccion: z.string().max(500).optional(),
  fotoUrl: z.string().url().optional(),
  firmaUrl: z.string().url().optional(),
});

// ============ VALIDACIONES DE COTIZACIÓN ============
const CotizacionSchema = z
  .object({
    distritoOrigenId: z.string().min(1, "ID de distrito origen requerido"),
    distritoDestinoId: z.string().min(1, "ID de distrito destino requerido"),
    peso: z
      .number()
      .min(0.1, "Peso mínimo 0.1 kg")
      .max(1000, "Peso máximo 1000 kg"),
    largo: z.number().min(1).max(200).optional(),
    ancho: z.number().min(1).max(200).optional(),
    alto: z.number().min(1).max(200).optional(),
    valorDeclarado: z.number().min(0).max(100000).optional(),
    tipoServicio: TipoServicioEnum,
    modalidad: ModalidadEnum,
  })
  .refine((data) => data.distritoOrigenId !== data.distritoDestinoId, {
    message: "Distrito origen y destino no pueden ser iguales",
    path: ["distritoDestinoId"],
  });

// ============ VALIDACIONES DE PAGO ============
const PagoCreateSchema = z
  .object({
    envioId: z.string().cuid().optional(),
    clienteId: z.string().cuid().optional(),
    monto: z
      .number()
      .min(0.01, "Monto mínimo S/ 0.01")
      .max(100000, "Monto máximo S/ 100,000"),
    metodoPago: MetodoPagoEnum,
    referencia: z.string().max(50).optional(),
    entidad: z.string().max(100).optional(),
    fechaPago: z.string().datetime().optional(),
  })
  .refine((data) => data.envioId || data.clienteId, {
    message: "Debe especificar envioId o clienteId",
    path: ["envioId"],
  });

// ============ VALIDACIONES DE SEGUIMIENTO PÚBLICO ============
const SeguimientoPublicoSchema = z.object({
  guia: z
    .string()
    .min(5, "Código de guía muy corto")
    .max(20, "Código de guía muy largo")
    .refine((val) => /^[A-Z0-9-]+$/.test(val), "Formato de guía inválido"),
});

// ============ VALIDACIONES DE SUCURSAL ============
const SucursalCreateSchema = z.object({
  codigo: z
    .string()
    .min(3, "Código muy corto")
    .max(10, "Código muy largo")
    .refine(
      (val) => /^[A-Z0-9]+$/.test(val),
      "Solo letras mayúsculas y números"
    ),
  nombre: z.string().min(3, "Nombre muy corto").max(100, "Nombre muy largo"),
  direccion: z
    .string()
    .min(10, "Dirección muy corta")
    .max(500, "Dirección muy larga"),
  telefono: z
    .string()
    .min(9, "Teléfono inválido")
    .max(15, "Teléfono inválido")
    .optional(),
  email: z.string().email("Email inválido").optional(),
  provinciaId: z.string().cuid("ID de provincia inválido"),
  latitud: z.number().min(-90).max(90).optional(),
  longitud: z.number().min(-180).max(180).optional(),
  esMatriz: z.boolean().default(false),
  horarioApertura: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido HH:MM")
    .optional(),
  horarioCierre: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido HH:MM")
    .optional(),
});

const SucursalUpdateSchema = SucursalCreateSchema.partial();
// ============ VALIDACIONES DE VEHÍCULO ============
const VehiculoCreateSchema = z.object({
  placa: z
    .string()
    .length(6, "La placa debe tener exactamente 6 caracteres")
    .refine((val) => /^[A-Z0-9]+$/.test(val), "Formato de placa inválido. Solo letras y números")
    .transform((val) => val.toUpperCase().trim()),
  marca: z.string().max(50).optional().nullable(),
  modelo: z.string().max(50).optional().nullable(),
  año: z
    .number()
    .min(1990, "Año muy antiguo")
    .max(new Date().getFullYear() + 1, "Año inválido")
    .optional()
    .nullable(),
  pesoMaximo: z
    .number()
    .min(100, "Capacidad de peso muy baja")
    .max(50000, "Capacidad de peso muy alta"),
  volumenMaximo: z
    .number()
    .min(1, "Volumen muy bajo")
    .max(1000, "Volumen muy alto")
    .optional()
    .nullable(),
  tipoVehiculo: z
    .enum(["CAMION_PEQUENO", "CAMION_MEDIANO", "CAMION_GRANDE", "TRAILER", "FURGONETA", "MOTOCICLETA"])
    .optional()
    .nullable(),
  estado: z
    .enum(["DISPONIBLE", "EN_RUTA", "MANTENIMIENTO", "INACTIVO"])
    .default("DISPONIBLE")
    .optional(),
  sucursalId: z
    .string()
    .min(1, "ID de sucursal inválido")
    .optional()
    .nullable()
    .transform((val) => (val === "" || !val ? null : val)),
  conductorId: z
    .union([
      z.string().cuid("ID de conductor inválido"),
      z.null(),
      z.undefined(),
    ])
    .optional()
    .nullable()
    .transform((val) => (val === "" || !val ? null : val)),
  soat: z.string().datetime().optional().nullable().or(z.date().optional().nullable()),
  revision: z.string().datetime().optional().nullable().or(z.date().optional().nullable()),
  observaciones: z.string().max(500).optional().nullable(),
});

const VehiculoUpdateSchema = VehiculoCreateSchema.partial().extend({
  placa: z
    .string()
    .length(6, "La placa debe tener exactamente 6 caracteres")
    .refine((val) => /^[A-Z0-9]+$/.test(val), "Formato de placa inválido. Solo letras y números")
    .transform((val) => val.toUpperCase().trim())
    .optional(),
});

const VehiculoSearchSchema = z.object({
  q: z.string().optional(),
  estado: z.enum(["DISPONIBLE", "EN_RUTA", "MANTENIMIENTO", "INACTIVO", "all"]).optional(),
  sucursalId: z.string().optional(),
  conductorId: z.string().optional(),
  tipoVehiculo: z.enum(["CAMION_PEQUENO", "CAMION_MEDIANO", "CAMION_GRANDE", "TRAILER", "FURGONETA", "MOTOCICLETA"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// ============ VALIDACIONES DE RUTA ============
const RutaCreateSchema = z.object({
  nombre: z.string().min(3, "Nombre muy corto").max(100, "Nombre muy largo"),
  codigo: z
    .string()
    .min(2, "Código muy corto")
    .max(20, "Código muy largo")
    .refine(
      (val) => /^[A-Z0-9-]+$/.test(val),
      "Solo letras mayúsculas, números y guiones"
    )
    .transform((val) => val.toUpperCase().trim()),
  descripcion: z.string().max(500).optional().nullable(),
  tipo: z
    .enum(["URBANA", "INTERURBANA", "INTERPROVINCIAL", "INTERDEPARTAMENTAL"])
    .default("URBANA"),
  estado: z
    .enum(["PROGRAMADA", "EN_CURSO", "COMPLETADA", "CANCELADA"])
    .default("PROGRAMADA")
    .optional(),
  activo: z.boolean().default(true),
  sucursalOrigenId: z.string().min(1, "Sucursal origen es requerida"),
  sucursalDestinoId: z.string().min(1, "Sucursal destino es requerida"),
  distancia: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : val),
      z.coerce.number().min(0).max(10000).nullable().optional()
    ),
  tiempoEstimado: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : val),
      z.coerce.number().int().min(0).max(1440).nullable().optional()
    ),
  costoBase: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? 0 : val),
      z.coerce.number().min(0).max(100000).default(0)
    ),
  costoPeajes: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? 0 : val),
      z.coerce.number().min(0).max(50000).default(0)
    ),
  costoCombustible: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? 0 : val),
      z.coerce.number().min(0).max(50000).default(0)
    ),
  tipoVehiculo: z
    .enum([
      "CAMION_PEQUENO",
      "CAMION_MEDIANO",
      "CAMION_GRANDE",
      "TRAILER",
      "FURGONETA",
      "MOTOCICLETA",
    ])
    .optional()
    .nullable(),
  capacidadMaxima: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : val),
      z.coerce.number().min(1).max(50000).nullable().optional()
    ),
  paradas: z
    .array(
      z.object({
        nombre: z.string(),
        orden: z.number().int().min(1),
        direccion: z.string().optional(),
      })
    )
    .optional()
    .nullable(),
  horarios: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)).optional().nullable(),
  observaciones: z.string().max(500).optional().nullable(),
}).refine(
  (data) => data.sucursalOrigenId !== data.sucursalDestinoId,
  {
    message: "La sucursal origen y destino no pueden ser la misma",
    path: ["sucursalDestinoId"],
  }
);

const RutaUpdateSchema = RutaCreateSchema.partial().extend({
  codigo: z
    .string()
    .min(2, "Código muy corto")
    .max(20, "Código muy largo")
    .refine(
      (val) => /^[A-Z0-9-]+$/.test(val),
      "Solo letras mayúsculas, números y guiones"
    )
    .transform((val) => val.toUpperCase().trim())
    .optional(),
}).refine(
  (data) => {
    if (data.sucursalOrigenId && data.sucursalDestinoId) {
      return data.sucursalOrigenId !== data.sucursalDestinoId;
    }
    return true;
  },
  {
    message: "La sucursal origen y destino no pueden ser la misma",
    path: ["sucursalDestinoId"],
  }
);

const RutaSearchSchema = z.object({
  q: z.string().optional(),
  tipo: z
    .enum([
      "URBANA",
      "INTERURBANA",
      "INTERPROVINCIAL",
      "INTERDEPARTAMENTAL",
      "all",
    ])
    .optional(),
  estado: z
    .enum(["PROGRAMADA", "EN_CURSO", "COMPLETADA", "CANCELADA", "all"])
    .optional(),
  activo: z.enum(["activo", "inactivo", "all"]).optional(),
  sucursalOrigenId: z.string().optional(),
  sucursalDestinoId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

// ============ VALIDACIONES DE TARIFA ============
const TarifaZonaCreateSchema = z
  .object({
    nombre: z.string().min(5, "Nombre muy corto").max(100, "Nombre muy largo"),
    provinciaOrigenId: z.string().cuid("ID de provincia origen inválido"),
    provinciaDestinoId: z.string().cuid("ID de provincia destino inválido"),
    pesoMinimo: z
      .number()
      .min(0.1, "Peso mínimo debe ser mayor a 0")
      .max(10, "Peso mínimo muy alto"),
    precioBase: z
      .number()
      .min(1, "Precio base muy bajo")
      .max(1000, "Precio base muy alto"),
    precioKgAdicional: z
      .number()
      .min(0.1, "Precio por kg muy bajo")
      .max(100, "Precio por kg muy alto"),
    factorExpress: z.number().min(1).max(5).default(1.5),
    factorOvernight: z.number().min(1).max(5).default(2.0),
    factorEconomico: z.number().min(0.1).max(1).default(0.8),
    recargoRemoto: z.number().min(0).max(100).default(0),
    recargoSeguro: z.number().min(0).max(0.1).default(0.005),
    recargoDomicilio: z.number().min(0).max(100).default(10),
  })
  .refine((data) => data.provinciaOrigenId !== data.provinciaDestinoId, {
    message: "Provincia origen y destino no pueden ser iguales",
    path: ["provinciaDestinoId"],
  });

// ============ VALIDACIONES DE COMPROBANTE ============
const ComprobanteCreateSchema = z
  .object({
    tipo: z.enum([
      "BOLETA",
      "FACTURA",
      "NOTA_CREDITO",
      "NOTA_DEBITO",
      "GUIA_REMISION",
    ]),
    serie: z
      .string()
      .min(4, "Serie inválida")
      .max(4, "Serie inválida")
      .refine(
        (val) => /^[A-Z]\d{3}$/.test(val),
        "Formato de serie inválido (ej: B001)"
      ),
    tipoDocCliente: z.string().min(3).max(20),
    numDocCliente: z.string().min(8).max(11),
    nombreCliente: z.string().min(2).max(200),
    direccionCliente: z.string().max(500).optional(),
    subtotal: z.number().min(0),
    igv: z.number().min(0),
    total: z.number().min(0),
  })
  .refine((data) => Math.abs(data.total - (data.subtotal + data.igv)) < 0.01, {
    message: "Total debe ser igual a subtotal + IGV",
    path: ["total"],
  });
// ============ VALIDACIONES DE REPORTES ============
const ReporteEnviosSchema = z
  .object({
    fechaDesde: z.string().datetime("Fecha desde inválida"),
    fechaHasta: z.string().datetime("Fecha hasta inválida"),
    sucursalId: z.string().cuid().optional(),
    estado: EstadoEnvioEnum.optional(),
    tipoServicio: TipoServicioEnum.optional(),
    formato: z.enum(["json", "csv", "pdf"]).default("json"),
  })
  .refine((data) => new Date(data.fechaDesde) <= new Date(data.fechaHasta), {
    message: "Fecha hasta debe ser posterior a fecha desde",
    path: ["fechaHasta"],
  });

const ReporteFinancieroSchema = z.object({
  fechaDesde: z.string().datetime(),
  fechaHasta: z.string().datetime(),
  sucursalId: z.string().cuid().optional(),
  metodoPago: MetodoPagoEnum.optional(),
  formato: z.enum(["json", "csv", "pdf"]).default("json"),
});

// ============ SCHEMAS DE RESPUESTA ============
const PaginacionSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(100),
  total: z.number().min(0),
  totalPages: z.number().min(0),
});

const ApiResponseSchema = (dataSchema) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    pagination: PaginacionSchema.optional(),
  });

// ============ MIDDLEWARE SCHEMAS ============
const AuthContextSchema = z.object({
  userId: z.string().cuid(),
  email: z.string().email(),
  rol: z.enum([
    "SUPER_ADMIN",
    "ADMIN_SUCURSAL",
    "OPERADOR",
    "CONDUCTOR",
    "CLIENTE",
    "CONTADOR",
  ]),
  sucursalId: z.string().cuid().optional(),
});

// ============ UTILIDADES DE VALIDACIÓN ============
// Validador de RUC peruano
function validarRUC(ruc) {
  return CONSTANTES_PERU.RUC_REGEX.test(ruc);
}

// Validador de DNI peruano
function validarDNI(dni) {
  return CONSTANTES_PERU.DNI_REGEX.test(dni) && dni !== "00000000";
}

// Validador de teléfono peruano
function validarTelefonoPeruano(telefono) {
  if (!telefono) return false;
  const digits = String(telefono).replace(/[^\d]/g, "");
  return CONSTANTES_PERU.TELEFONO_REGEX.test(digits);
}

// Schema con validaciones personalizadas
const ClienteCreateSchemaCustom = ClienteCreateSchema.refine(
  (data) => {
    if (data.tipoDocumento === "RUC") {
      return validarDocumentoPeruano("RUC", data.numeroDocumento);
    } else if (data.tipoDocumento === "DNI") {
      return validarDocumentoPeruano("DNI", data.numeroDocumento);
    }
    return true;
  },
  {
    message: "Número de documento inválido para el tipo seleccionado",
    path: ["numeroDocumento"],
  }
)
  .refine((data) => validarTelefonoPeruano(data.telefono), {
    message: "Formato de teléfono peruano inválido",
    path: ["telefono"],
  })
  .superRefine((data, ctx) => {
    // Si es empresa, debe tener razón social
    if (data.esEmpresa && !data.razonSocial?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La razón social es requerida para empresas",
        path: ["razonSocial"],
      });
    }

    // Si no es empresa, debe tener apellidos
    if (!data.esEmpresa && !data.apellidos?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Los apellidos son requeridos para personas naturales",
        path: ["apellidos"],
      });
    }

    // Si es empresa y tiene apellidos, estos no deben ser validados con min(2)
    // Los apellidos del representante legal pueden estar vacíos para empresas
    if (data.esEmpresa && data.apellidos !== undefined) {
      // Permitir string vacío o validar si tiene contenido
      if (data.apellidos && data.apellidos.trim().length > 0 && data.apellidos.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Los apellidos del representante legal deben tener al menos 2 caracteres si se proporcionan",
          path: ["apellidos"],
        });
      }
    }
  });

export {
  VehiculoCreateSchema,
  VehiculoUpdateSchema,
  VehiculoSearchSchema,
  EstadoEnvioEnum,
  TipoDocumentoEnum,
  TipoServicioEnum,
  ModalidadEnum,
  MetodoPagoEnum,
  ClienteCreateSchema,
  ClienteUpdateSchema,
  ClienteSearchSchema,
  EnvioCreateSchema,
  EnvioUpdateSchema,
  EnvioSearchSchema,
  EventoEnvioCreateSchema,
  CotizacionSchema,
  PagoCreateSchema,
  SeguimientoPublicoSchema,
  SucursalCreateSchema,
  SucursalUpdateSchema,
  RutaCreateSchema,
  RutaUpdateSchema,
  RutaSearchSchema,
  TarifaZonaCreateSchema,
  ComprobanteCreateSchema,
  ReporteEnviosSchema,
  ReporteFinancieroSchema,
  PaginacionSchema,
  ApiResponseSchema,
  AuthContextSchema,
  ClienteCreateSchemaCustom,
  validarRUC,
  validarDNI,
  validarTelefonoPeruano,
};
