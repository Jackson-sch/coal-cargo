-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('SUPER_ADMIN', 'ADMIN_SUCURSAL', 'OPERADOR', 'CONDUCTOR', 'CLIENTE', 'CONTADOR');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('DNI', 'RUC', 'PASAPORTE', 'CARNET_EXTRANJERIA');

-- CreateEnum
CREATE TYPE "EstadoVehiculo" AS ENUM ('DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoRuta" AS ENUM ('PROGRAMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoServicio" AS ENUM ('NORMAL', 'EXPRESS', 'OVERNIGHT', 'ECONOMICO');

-- CreateEnum
CREATE TYPE "Modalidad" AS ENUM ('SUCURSAL_SUCURSAL', 'DOMICILIO_SUCURSAL', 'SUCURSAL_DOMICILIO', 'DOMICILIO_DOMICILIO');

-- CreateEnum
CREATE TYPE "EstadoEnvio" AS ENUM ('REGISTRADO', 'EN_BODEGA', 'EN_TRANSITO', 'EN_AGENCIA_ORIGEN', 'EN_AGENCIA_DESTINO', 'EN_REPARTO', 'ENTREGADO', 'DEVUELTO', 'ANULADO');

-- CreateEnum
CREATE TYPE "TipoIncidencia" AS ENUM ('RETRASO', 'PERDIDA', 'DIRECCION_INCORRECTA', 'DESTINATARIO_AUSENTE', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoIncidencia" AS ENUM ('ABIERTA', 'EN_PROCESO', 'RESUELTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA', 'DEPOSITO', 'YAPE', 'PLIN', 'TUNKI', 'BILLETERA_DIGITAL', 'CREDITO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PROCESANDO', 'CONFIRMADO', 'RECHAZADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "TipoComprobante" AS ENUM ('BOLETA', 'FACTURA', 'NOTA_CREDITO', 'NOTA_DEBITO', 'GUIA_REMISION');

-- CreateEnum
CREATE TYPE "EstadoCotizacion" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'CONVERTIDA_ENVIO', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('REGISTRO_ENVIO', 'CAMBIO_ESTADO', 'ENTREGA_EXITOSA', 'INTENTO_ENTREGA', 'RETRASO', 'PROBLEMA', 'RECORDATORIO', 'CONFIRMACION_RECOLECCION');

-- CreateEnum
CREATE TYPE "CanalNotificacion" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'LLAMADA');

-- CreateEnum
CREATE TYPE "EstadoNotificacion" AS ENUM ('PENDIENTE', 'ENVIADA', 'ENTREGADA', 'FALLIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoComprobante" AS ENUM ('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'ANULADO', 'EXCEPCION');

-- CreateEnum
CREATE TYPE "TipoRuta" AS ENUM ('URBANA', 'INTERURBANA', 'INTERPROVINCIAL', 'INTERDEPARTAMENTAL');

-- CreateEnum
CREATE TYPE "TipoVehiculo" AS ENUM ('CAMION_PEQUENO', 'CAMION_MEDIANO', 'CAMION_GRANDE', 'TRAILER', 'FURGONETA', 'MOTOCICLETA');

-- CreateEnum
CREATE TYPE "CategoriaLog" AS ENUM ('SISTEMA', 'SEGURIDAD', 'USUARIOS', 'ENVIOS', 'CLIENTES', 'FACTURACION', 'CONFIGURACION', 'BACKUP', 'AUDITORIA');

-- CreateEnum
CREATE TYPE "SeveridadLog" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TipoRespaldo" AS ENUM ('MANUAL', 'AUTOMATICO', 'PROGRAMADO', 'EMERGENCIA');

-- CreateEnum
CREATE TYPE "EstadoRespaldo" AS ENUM ('INICIADO', 'EN_PROGRESO', 'COMPLETADO', 'FALLIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoRestauracion" AS ENUM ('INICIADO', 'EN_PROGRESO', 'COMPLETADO', 'FALLIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "FrecuenciaRespaldo" AS ENUM ('CADA_HORA', 'CADA_6_HORAS', 'CADA_12_HORAS', 'DIARIO', 'SEMANAL', 'MENSUAL');

-- CreateEnum
CREATE TYPE "AccionRespaldo" AS ENUM ('CREAR', 'RESTAURAR', 'ELIMINAR', 'DESCARGAR', 'CONFIGURAR', 'PROGRAMAR');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT,
    "razonSocial" TEXT,
    "tipoDocumento" "TipoDocumento" NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "ruc" TEXT,
    "direccion" TEXT,
    "email" TEXT,
    "telefono" TEXT NOT NULL,
    "distritoId" TEXT,
    "esEmpresa" BOOLEAN NOT NULL DEFAULT false,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas_contacto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT,
    "tipoDocumento" "TipoDocumento" NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "direccion" TEXT,
    "empresa" TEXT,
    "cargo" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "personas_contacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "envios" (
    "id" TEXT NOT NULL,
    "guia" TEXT NOT NULL,
    "clienteId" TEXT,
    "sucursalOrigenId" TEXT NOT NULL,
    "sucursalDestinoId" TEXT NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL,
    "alto" DOUBLE PRECISION,
    "ancho" DOUBLE PRECISION,
    "profundo" DOUBLE PRECISION,
    "volumen" DOUBLE PRECISION,
    "descripcion" TEXT,
    "valorDeclarado" DOUBLE PRECISION,
    "total" DOUBLE PRECISION NOT NULL,
    "tipoServicio" "TipoServicio" DEFAULT 'NORMAL',
    "modalidad" "Modalidad" DEFAULT 'SUCURSAL_SUCURSAL',
    "estado" "EstadoEnvio" NOT NULL DEFAULT 'REGISTRADO',
    "progreso" INTEGER NOT NULL DEFAULT 0,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRecoleccion" TIMESTAMP(3),
    "fechaEnTransito" TIMESTAMP(3),
    "fechaLlegadaDestino" TIMESTAMP(3),
    "fechaEntrega" TIMESTAMP(3),
    "remitenteNombre" TEXT,
    "remitenteTelefono" TEXT,
    "remitenteEmail" TEXT,
    "remitenteDireccion" TEXT,
    "remitenteTipoDocumento" "TipoDocumento",
    "remitenteNumeroDocumento" TEXT,
    "destinatarioNombre" TEXT,
    "destinatarioTelefono" TEXT,
    "destinatarioEmail" TEXT,
    "destinatarioDireccion" TEXT,
    "destinatarioTipoDocumento" "TipoDocumento",
    "destinatarioNumeroDocumento" TEXT,
    "responsableRecojoId" TEXT,
    "responsableRecojoNombre" TEXT,
    "responsableRecojoApellidos" TEXT,
    "responsableRecojoTipoDocumento" "TipoDocumento",
    "responsableRecojoNumeroDocumento" TEXT,
    "responsableRecojoTelefono" TEXT,
    "responsableRecojoEmail" TEXT,
    "responsableRecojoDireccion" TEXT,
    "responsableRecojoEmpresa" TEXT,
    "responsableRecojoCargo" TEXT,
    "clienteFacturacionId" TEXT,
    "clienteFacturacionNombre" TEXT,
    "clienteFacturacionApellidos" TEXT,
    "clienteFacturacionRazonSocial" TEXT,
    "clienteFacturacionTipoDocumento" "TipoDocumento",
    "clienteFacturacionNumeroDocumento" TEXT,
    "clienteFacturacionRuc" TEXT,
    "clienteFacturacionDireccion" TEXT,
    "clienteFacturacionEmail" TEXT,
    "clienteFacturacionTelefono" TEXT,
    "clienteFacturacionEsEmpresa" BOOLEAN DEFAULT false,
    "instruccionesEspeciales" TEXT,
    "requiereConfirmacion" BOOLEAN NOT NULL DEFAULT false,
    "notificacionesEnviadas" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "asignadoA" TEXT,
    "vehiculoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "envios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_envio" (
    "id" TEXT NOT NULL,
    "envioId" TEXT NOT NULL,
    "estado" "EstadoEnvio" NOT NULL,
    "descripcion" TEXT,
    "comentario" TEXT,
    "ubicacion" TEXT,
    "direccion" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "fotoUrl" TEXT,
    "firmaUrl" TEXT,
    "documentoUrl" TEXT,
    "creadoPor" TEXT,
    "nombreResponsable" TEXT,
    "temperatura" DOUBLE PRECISION,
    "humedad" DOUBLE PRECISION,
    "fechaEvento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "eventos_envio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "envioId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "metodo" TEXT NOT NULL,
    "referencia" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sucursales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "telefono" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "envioId" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "canal" "CanalNotificacion" NOT NULL,
    "destinatario" TEXT NOT NULL,
    "asunto" TEXT,
    "mensaje" TEXT NOT NULL,
    "estado" "EstadoNotificacion" NOT NULL DEFAULT 'PENDIENTE',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "maxIntentos" INTEGER NOT NULL DEFAULT 3,
    "respuesta" TEXT,
    "codigoError" TEXT,
    "programadaPara" TIMESTAMP(3),
    "enviadaEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifas_sucursales" (
    "id" TEXT NOT NULL,
    "sucursalOrigenId" TEXT NOT NULL,
    "sucursalDestinoId" TEXT NOT NULL,
    "precioBase" DOUBLE PRECISION NOT NULL,
    "precioKg" DOUBLE PRECISION NOT NULL,
    "tiempoEstimado" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarifas_sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "sucursalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Rol" NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiculos" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "a├▒o" INTEGER,
    "capacidad" DOUBLE PRECISION,
    "pesoMaximo" DOUBLE PRECISION NOT NULL,
    "volumenMaximo" DOUBLE PRECISION,
    "tipoVehiculo" "TipoVehiculo",
    "estado" "EstadoVehiculo" NOT NULL DEFAULT 'DISPONIBLE',
    "sucursalId" TEXT,
    "conductorId" TEXT,
    "soat" TIMESTAMP(3),
    "revision" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_permisos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "permisoId" TEXT NOT NULL,
    "otorgado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provincia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provincia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distrito" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "provinciaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Distrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifas_destino" (
    "id" TEXT NOT NULL,
    "distritoId" TEXT NOT NULL,
    "nombreZona" TEXT NOT NULL,
    "paquetePequeno" DOUBLE PRECISION,
    "paqueteMediano" DOUBLE PRECISION,
    "paqueteGrande" DOUBLE PRECISION,
    "precioPorKg" DOUBLE PRECISION,
    "precioPorVolumen" DOUBLE PRECISION,
    "pesoMaximoPaquete" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "volumenMaximoPaquete" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "tiempoEntregaDias" INTEGER NOT NULL DEFAULT 1,
    "requiereCoordinacion" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarifas_destino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizaciones" (
    "id" TEXT NOT NULL,
    "sucursalOrigenId" TEXT NOT NULL,
    "sucursalDestinoId" TEXT NOT NULL,
    "direccionEntrega" TEXT,
    "distritoEntregaId" TEXT,
    "peso" DOUBLE PRECISION NOT NULL,
    "alto" DOUBLE PRECISION,
    "ancho" DOUBLE PRECISION,
    "profundo" DOUBLE PRECISION,
    "volumen" DOUBLE PRECISION,
    "tipoServicio" "TipoServicio" NOT NULL DEFAULT 'NORMAL',
    "modalidad" "Modalidad" NOT NULL DEFAULT 'SUCURSAL_SUCURSAL',
    "tarifaSucursalId" TEXT,
    "precioBase" DOUBLE PRECISION NOT NULL,
    "precioFinal" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contenido" TEXT,
    "valorDeclarado" DOUBLE PRECISION,
    "requiereSeguro" BOOLEAN NOT NULL DEFAULT false,
    "clienteId" TEXT,
    "nombreCliente" TEXT,
    "telefonoCliente" TEXT,
    "emailCliente" TEXT,
    "estado" "EstadoCotizacion" NOT NULL DEFAULT 'PENDIENTE',
    "validoHasta" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comprobantes_electronicos" (
    "id" TEXT NOT NULL,
    "tipoComprobante" "TipoComprobante" NOT NULL,
    "serie" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "numeroCompleto" TEXT NOT NULL,
    "clienteId" TEXT,
    "envioId" TEXT,
    "rucEmisor" TEXT NOT NULL,
    "razonSocialEmisor" TEXT NOT NULL,
    "tipoDocumentoCliente" "TipoDocumento" NOT NULL,
    "numeroDocumentoCliente" TEXT NOT NULL,
    "nombreCliente" TEXT NOT NULL,
    "direccionCliente" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "igv" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "estado" "EstadoComprobante" NOT NULL DEFAULT 'PENDIENTE',
    "xmlContent" TEXT,
    "cdrContent" TEXT,
    "hashCpe" TEXT,
    "pseId" TEXT,
    "pseResponse" TEXT,
    "codigoError" TEXT,
    "mensajeError" TEXT,
    "xmlUrl" TEXT,
    "pdfUrl" TEXT,
    "cdrUrl" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "comprobantes_electronicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comprobante_detalles" (
    "id" TEXT NOT NULL,
    "comprobanteId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "codigoProducto" TEXT,
    "descripcion" TEXT NOT NULL,
    "unidadMedida" TEXT NOT NULL DEFAULT 'NIU',
    "cantidad" DOUBLE PRECISION NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "valorVenta" DOUBLE PRECISION NOT NULL,
    "igv" DOUBLE PRECISION NOT NULL,
    "precioTotal" DOUBLE PRECISION NOT NULL,
    "codigoTipoAfectacion" TEXT NOT NULL DEFAULT '10',
    "porcentajeIgv" DOUBLE PRECISION NOT NULL DEFAULT 18.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comprobante_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_facturacion" (
    "id" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "direccion" TEXT NOT NULL,
    "ubigeo" TEXT NOT NULL,
    "pseProvider" TEXT NOT NULL,
    "pseToken" TEXT,
    "pseUrlBase" TEXT,
    "pseEnvironment" TEXT NOT NULL DEFAULT 'development',
    "serieFactura" TEXT NOT NULL DEFAULT 'F001',
    "serieBoleta" TEXT NOT NULL DEFAULT 'B001',
    "serieNotaCredito" TEXT NOT NULL DEFAULT 'FC01',
    "serieNotaDebito" TEXT NOT NULL DEFAULT 'FD01',
    "ultimoNumeroFactura" INTEGER NOT NULL DEFAULT 0,
    "ultimoNumeroBoleta" INTEGER NOT NULL DEFAULT 0,
    "ultimoNumeroNotaCredito" INTEGER NOT NULL DEFAULT 0,
    "ultimoNumeroNotaDebito" INTEGER NOT NULL DEFAULT 0,
    "porcentajeIgv" DOUBLE PRECISION NOT NULL DEFAULT 18.00,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_facturacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoRuta" NOT NULL DEFAULT 'URBANA',
    "estado" "EstadoRuta" NOT NULL DEFAULT 'PROGRAMADA',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "sucursalOrigenId" TEXT NOT NULL,
    "sucursalDestinoId" TEXT NOT NULL,
    "distancia" DOUBLE PRECISION,
    "tiempoEstimado" INTEGER,
    "costoBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoPeajes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoCombustible" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tipoVehiculo" "TipoVehiculo",
    "capacidadMaxima" DOUBLE PRECISION,
    "paradas" JSONB,
    "horarios" JSONB,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "rutas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "recurso" TEXT NOT NULL,
    "detalles" TEXT,
    "categoria" "CategoriaLog" NOT NULL DEFAULT 'SISTEMA',
    "severidad" "SeveridadLog" NOT NULL DEFAULT 'INFO',
    "usuarioId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respaldos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoRespaldo" NOT NULL DEFAULT 'MANUAL',
    "estado" "EstadoRespaldo" NOT NULL DEFAULT 'INICIADO',
    "progreso" INTEGER NOT NULL DEFAULT 0,
    "nombreArchivo" TEXT,
    "rutaArchivo" TEXT,
    "tamano" BIGINT,
    "checksum" TEXT,
    "almacenamientoLocal" BOOLEAN NOT NULL DEFAULT true,
    "almacenamientoNube" BOOLEAN NOT NULL DEFAULT false,
    "rutaNube" TEXT,
    "encriptado" BOOLEAN NOT NULL DEFAULT true,
    "comprimido" BOOLEAN NOT NULL DEFAULT true,
    "incluyeArchivos" BOOLEAN NOT NULL DEFAULT false,
    "tablasIncluidas" JSONB,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFinalizacion" TIMESTAMP(3),
    "duracion" INTEGER,
    "creadoPor" TEXT,
    "mensajeError" TEXT,
    "detalleError" TEXT,
    "fechaExpiracion" TIMESTAMP(3),
    "eliminadoEn" TIMESTAMP(3),
    "metadatos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "respaldos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restauraciones" (
    "id" TEXT NOT NULL,
    "respaldoId" TEXT NOT NULL,
    "estado" "EstadoRestauracion" NOT NULL DEFAULT 'INICIADO',
    "progreso" INTEGER NOT NULL DEFAULT 0,
    "restaurarCompleto" BOOLEAN NOT NULL DEFAULT true,
    "tablasSeleccionadas" JSONB,
    "sobrescribirDatos" BOOLEAN NOT NULL DEFAULT false,
    "crearRespaldoAntes" BOOLEAN NOT NULL DEFAULT true,
    "respaldoPrevioId" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFinalizacion" TIMESTAMP(3),
    "duracion" INTEGER,
    "creadoPor" TEXT,
    "mensajeError" TEXT,
    "detalleError" TEXT,
    "registrosRestaurados" INTEGER,
    "tablasRestauradas" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "restauraciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_respaldos" (
    "id" TEXT NOT NULL,
    "respaldosAutomaticos" BOOLEAN NOT NULL DEFAULT true,
    "frecuencia" "FrecuenciaRespaldo" NOT NULL DEFAULT 'DIARIO',
    "horaEjecucion" TEXT NOT NULL DEFAULT '02:00',
    "diasRetencion" INTEGER NOT NULL DEFAULT 30,
    "maxRespaldos" INTEGER NOT NULL DEFAULT 50,
    "almacenamientoLocal" BOOLEAN NOT NULL DEFAULT true,
    "almacenamientoNube" BOOLEAN NOT NULL DEFAULT false,
    "rutaLocal" TEXT NOT NULL DEFAULT '/backups',
    "proveedorNube" TEXT,
    "bucketNube" TEXT,
    "credencialesNube" JSONB,
    "encriptarRespaldos" BOOLEAN NOT NULL DEFAULT true,
    "claveEncriptacion" TEXT,
    "comprimirRespaldos" BOOLEAN NOT NULL DEFAULT true,
    "nivelCompresion" INTEGER NOT NULL DEFAULT 6,
    "notificarExito" BOOLEAN NOT NULL DEFAULT true,
    "notificarError" BOOLEAN NOT NULL DEFAULT true,
    "emailsNotificacion" JSONB,
    "timeoutRespaldo" INTEGER NOT NULL DEFAULT 3600,
    "maxIntentos" INTEGER NOT NULL DEFAULT 3,
    "tablasExcluidas" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_respaldos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estadisticas_respaldos" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRespaldos" INTEGER NOT NULL DEFAULT 0,
    "respaldosExitosos" INTEGER NOT NULL DEFAULT 0,
    "respaldosFallidos" INTEGER NOT NULL DEFAULT 0,
    "totalRestauraciones" INTEGER NOT NULL DEFAULT 0,
    "restauracionesExitosas" INTEGER NOT NULL DEFAULT 0,
    "restauracionesFallidas" INTEGER NOT NULL DEFAULT 0,
    "espacioUtilizadoLocal" BIGINT NOT NULL DEFAULT 0,
    "espacioUtilizadoNube" BIGINT NOT NULL DEFAULT 0,
    "tiempoPromedioRespaldo" INTEGER,
    "tiempoPromedioRestauracion" INTEGER,
    "tamanoPromedioRespaldo" BIGINT,
    "tamanoTotalRespaldos" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estadisticas_respaldos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_respaldos" (
    "id" TEXT NOT NULL,
    "respaldoId" TEXT NOT NULL,
    "accion" "AccionRespaldo" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_respaldos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_numeroDocumento_key" ON "clientes"("numeroDocumento");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_ruc_key" ON "clientes"("ruc");

-- CreateIndex
CREATE INDEX "clientes_deletedAt_idx" ON "clientes"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "personas_contacto_numeroDocumento_key" ON "personas_contacto"("numeroDocumento");

-- CreateIndex
CREATE INDEX "personas_contacto_deletedAt_idx" ON "personas_contacto"("deletedAt");

-- CreateIndex
CREATE INDEX "personas_contacto_numeroDocumento_idx" ON "personas_contacto"("numeroDocumento");

-- CreateIndex
CREATE UNIQUE INDEX "envios_guia_key" ON "envios"("guia");

-- CreateIndex
CREATE INDEX "envios_clienteId_idx" ON "envios"("clienteId");

-- CreateIndex
CREATE INDEX "envios_clienteFacturacionId_idx" ON "envios"("clienteFacturacionId");

-- CreateIndex
CREATE INDEX "envios_responsableRecojoId_idx" ON "envios"("responsableRecojoId");

-- CreateIndex
CREATE INDEX "envios_sucursalOrigenId_idx" ON "envios"("sucursalOrigenId");

-- CreateIndex
CREATE INDEX "envios_sucursalDestinoId_idx" ON "envios"("sucursalDestinoId");

-- CreateIndex
CREATE INDEX "envios_estado_idx" ON "envios"("estado");

-- CreateIndex
CREATE INDEX "envios_fechaRegistro_idx" ON "envios"("fechaRegistro");

-- CreateIndex
CREATE INDEX "envios_guia_idx" ON "envios"("guia");

-- CreateIndex
CREATE INDEX "envios_asignadoA_idx" ON "envios"("asignadoA");

-- CreateIndex
CREATE INDEX "envios_vehiculoId_idx" ON "envios"("vehiculoId");

-- CreateIndex
CREATE INDEX "eventos_envio_deletedAt_idx" ON "eventos_envio"("deletedAt");

-- CreateIndex
CREATE INDEX "eventos_envio_envioId_idx" ON "eventos_envio"("envioId");

-- CreateIndex
CREATE INDEX "eventos_envio_estado_idx" ON "eventos_envio"("estado");

-- CreateIndex
CREATE INDEX "eventos_envio_fechaEvento_idx" ON "eventos_envio"("fechaEvento");

-- CreateIndex
CREATE INDEX "pagos_deletedAt_idx" ON "pagos"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sucursales_deletedAt_idx" ON "sucursales"("deletedAt");

-- CreateIndex
CREATE INDEX "notificaciones_envioId_idx" ON "notificaciones"("envioId");

-- CreateIndex
CREATE INDEX "notificaciones_programadaPara_idx" ON "notificaciones"("programadaPara");

-- CreateIndex
CREATE UNIQUE INDEX "tarifas_sucursales_sucursalOrigenId_sucursalDestinoId_key" ON "tarifas_sucursales"("sucursalOrigenId", "sucursalDestinoId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_deletedAt_idx" ON "usuarios"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_placa_key" ON "vehiculos"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_conductorId_key" ON "vehiculos"("conductorId");

-- CreateIndex
CREATE INDEX "vehiculos_deletedAt_idx" ON "vehiculos"("deletedAt");

-- CreateIndex
CREATE INDEX "vehiculos_estado_idx" ON "vehiculos"("estado");

-- CreateIndex
CREATE INDEX "vehiculos_sucursalId_idx" ON "vehiculos"("sucursalId");

-- CreateIndex
CREATE INDEX "vehiculos_conductorId_idx" ON "vehiculos"("conductorId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_permisos_usuarioId_permisoId_key" ON "usuario_permisos"("usuarioId", "permisoId");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_clave_key" ON "configuracion"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_codigo_key" ON "Departamento"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Provincia_codigo_key" ON "Provincia"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Distrito_codigo_key" ON "Distrito"("codigo");

-- CreateIndex
CREATE INDEX "tarifas_destino_distritoId_idx" ON "tarifas_destino"("distritoId");

-- CreateIndex
CREATE INDEX "tarifas_destino_activo_idx" ON "tarifas_destino"("activo");

-- CreateIndex
CREATE INDEX "cotizaciones_estado_idx" ON "cotizaciones"("estado");

-- CreateIndex
CREATE INDEX "cotizaciones_validoHasta_idx" ON "cotizaciones"("validoHasta");

-- CreateIndex
CREATE INDEX "cotizaciones_clienteId_idx" ON "cotizaciones"("clienteId");

-- CreateIndex
CREATE INDEX "cotizaciones_sucursalOrigenId_idx" ON "cotizaciones"("sucursalOrigenId");

-- CreateIndex
CREATE INDEX "cotizaciones_sucursalDestinoId_idx" ON "cotizaciones"("sucursalDestinoId");

-- CreateIndex
CREATE UNIQUE INDEX "comprobantes_electronicos_numeroCompleto_key" ON "comprobantes_electronicos"("numeroCompleto");

-- CreateIndex
CREATE INDEX "comprobantes_electronicos_clienteId_idx" ON "comprobantes_electronicos"("clienteId");

-- CreateIndex
CREATE INDEX "comprobantes_electronicos_envioId_idx" ON "comprobantes_electronicos"("envioId");

-- CreateIndex
CREATE INDEX "comprobantes_electronicos_estado_idx" ON "comprobantes_electronicos"("estado");

-- CreateIndex
CREATE INDEX "comprobantes_electronicos_fechaEmision_idx" ON "comprobantes_electronicos"("fechaEmision");

-- CreateIndex
CREATE INDEX "comprobantes_electronicos_numeroCompleto_idx" ON "comprobantes_electronicos"("numeroCompleto");

-- CreateIndex
CREATE UNIQUE INDEX "comprobantes_electronicos_serie_numero_key" ON "comprobantes_electronicos"("serie", "numero");

-- CreateIndex
CREATE INDEX "comprobante_detalles_comprobanteId_idx" ON "comprobante_detalles"("comprobanteId");

-- CreateIndex
CREATE UNIQUE INDEX "rutas_codigo_key" ON "rutas"("codigo");

-- CreateIndex
CREATE INDEX "rutas_deletedAt_idx" ON "rutas"("deletedAt");

-- CreateIndex
CREATE INDEX "rutas_activo_idx" ON "rutas"("activo");

-- CreateIndex
CREATE INDEX "rutas_tipo_idx" ON "rutas"("tipo");

-- CreateIndex
CREATE INDEX "rutas_sucursalOrigenId_idx" ON "rutas"("sucursalOrigenId");

-- CreateIndex
CREATE INDEX "rutas_sucursalDestinoId_idx" ON "rutas"("sucursalDestinoId");

-- CreateIndex
CREATE INDEX "logs_auditoria_fechaHora_idx" ON "logs_auditoria"("fechaHora");

-- CreateIndex
CREATE INDEX "logs_auditoria_usuarioId_idx" ON "logs_auditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "logs_auditoria_accion_idx" ON "logs_auditoria"("accion");

-- CreateIndex
CREATE INDEX "logs_auditoria_categoria_idx" ON "logs_auditoria"("categoria");

-- CreateIndex
CREATE INDEX "logs_auditoria_severidad_idx" ON "logs_auditoria"("severidad");

-- CreateIndex
CREATE INDEX "respaldos_tipo_idx" ON "respaldos"("tipo");

-- CreateIndex
CREATE INDEX "respaldos_estado_idx" ON "respaldos"("estado");

-- CreateIndex
CREATE INDEX "respaldos_fechaInicio_idx" ON "respaldos"("fechaInicio");

-- CreateIndex
CREATE INDEX "respaldos_creadoPor_idx" ON "respaldos"("creadoPor");

-- CreateIndex
CREATE INDEX "respaldos_deletedAt_idx" ON "respaldos"("deletedAt");

-- CreateIndex
CREATE INDEX "restauraciones_respaldoId_idx" ON "restauraciones"("respaldoId");

-- CreateIndex
CREATE INDEX "restauraciones_estado_idx" ON "restauraciones"("estado");

-- CreateIndex
CREATE INDEX "restauraciones_fechaInicio_idx" ON "restauraciones"("fechaInicio");

-- CreateIndex
CREATE INDEX "restauraciones_creadoPor_idx" ON "restauraciones"("creadoPor");

-- CreateIndex
CREATE INDEX "restauraciones_deletedAt_idx" ON "restauraciones"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_respaldos_id_key" ON "configuracion_respaldos"("id");

-- CreateIndex
CREATE INDEX "estadisticas_respaldos_fecha_idx" ON "estadisticas_respaldos"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "estadisticas_respaldos_fecha_key" ON "estadisticas_respaldos"("fecha");

-- CreateIndex
CREATE INDEX "auditoria_respaldos_respaldoId_idx" ON "auditoria_respaldos"("respaldoId");

-- CreateIndex
CREATE INDEX "auditoria_respaldos_usuarioId_idx" ON "auditoria_respaldos"("usuarioId");

-- CreateIndex
CREATE INDEX "auditoria_respaldos_createdAt_idx" ON "auditoria_respaldos"("createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_distritoId_fkey" FOREIGN KEY ("distritoId") REFERENCES "Distrito"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios" ADD CONSTRAINT "envios_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios" ADD CONSTRAINT "envios_clienteFacturacionId_fkey" FOREIGN KEY ("clienteFacturacionId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios" ADD CONSTRAINT "envios_responsableRecojoId_fkey" FOREIGN KEY ("responsableRecojoId") REFERENCES "personas_contacto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios" ADD CONSTRAINT "envios_sucursalOrigenId_fkey" FOREIGN KEY ("sucursalOrigenId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios" ADD CONSTRAINT "envios_sucursalDestinoId_fkey" FOREIGN KEY ("sucursalDestinoId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios" ADD CONSTRAINT "envios_asignadoA_fkey" FOREIGN KEY ("asignadoA") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios" ADD CONSTRAINT "envios_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "vehiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_envio" ADD CONSTRAINT "eventos_envio_envioId_fkey" FOREIGN KEY ("envioId") REFERENCES "envios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_envio" ADD CONSTRAINT "eventos_envio_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_envioId_fkey" FOREIGN KEY ("envioId") REFERENCES "envios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_envioId_fkey" FOREIGN KEY ("envioId") REFERENCES "envios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas_sucursales" ADD CONSTRAINT "tarifas_sucursales_sucursalDestinoId_fkey" FOREIGN KEY ("sucursalDestinoId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas_sucursales" ADD CONSTRAINT "tarifas_sucursales_sucursalOrigenId_fkey" FOREIGN KEY ("sucursalOrigenId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_permisos" ADD CONSTRAINT "usuario_permisos_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_permisos" ADD CONSTRAINT "usuario_permisos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provincia" ADD CONSTRAINT "Provincia_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distrito" ADD CONSTRAINT "Distrito_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES "Provincia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas_destino" ADD CONSTRAINT "tarifas_destino_distritoId_fkey" FOREIGN KEY ("distritoId") REFERENCES "Distrito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_distritoEntregaId_fkey" FOREIGN KEY ("distritoEntregaId") REFERENCES "Distrito"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_sucursalDestinoId_fkey" FOREIGN KEY ("sucursalDestinoId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_sucursalOrigenId_fkey" FOREIGN KEY ("sucursalOrigenId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_tarifaSucursalId_fkey" FOREIGN KEY ("tarifaSucursalId") REFERENCES "tarifas_sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes_electronicos" ADD CONSTRAINT "comprobantes_electronicos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes_electronicos" ADD CONSTRAINT "comprobantes_electronicos_envioId_fkey" FOREIGN KEY ("envioId") REFERENCES "envios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobante_detalles" ADD CONSTRAINT "comprobante_detalles_comprobanteId_fkey" FOREIGN KEY ("comprobanteId") REFERENCES "comprobantes_electronicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas" ADD CONSTRAINT "rutas_sucursalOrigenId_fkey" FOREIGN KEY ("sucursalOrigenId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas" ADD CONSTRAINT "rutas_sucursalDestinoId_fkey" FOREIGN KEY ("sucursalDestinoId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respaldos" ADD CONSTRAINT "respaldos_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restauraciones" ADD CONSTRAINT "restauraciones_respaldoId_fkey" FOREIGN KEY ("respaldoId") REFERENCES "respaldos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restauraciones" ADD CONSTRAINT "restauraciones_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_respaldos" ADD CONSTRAINT "auditoria_respaldos_respaldoId_fkey" FOREIGN KEY ("respaldoId") REFERENCES "respaldos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_respaldos" ADD CONSTRAINT "auditoria_respaldos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

