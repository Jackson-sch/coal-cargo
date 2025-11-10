const { prisma } = require("../src/lib/prisma-cjs");
const { randomInt } = require("crypto");

/**
 * Genera un número de guía único
 * Formato: {PREFIJO}-{YYYYMMDD}-{XXXXXX}
 * @param {string} sucursalOrigenId - ID de la sucursal de origen
 * @param {Date} fecha - Fecha a usar en el número de guía (opcional, por defecto usa la fecha actual)
 */
async function generarNumeroGuia(sucursalOrigenId, fecha = null) {
  // Obtener información de la sucursal
  const sucursal = await prisma.sucursales.findUnique({
    where: { id: sucursalOrigenId },
    select: {
      nombre: true,
      provincia: true,
    },
  });

  if (!sucursal) {
    throw new Error("Sucursal no encontrada");
  }

  // Generar prefijo basado en la sucursal
  let prefijo = "GEN";
  if (sucursal.provincia && sucursal.provincia.trim()) {
    prefijo = sucursal.provincia.trim().toUpperCase().substring(0, 3);
  } else if (sucursal.nombre && sucursal.nombre.trim()) {
    prefijo = sucursal.nombre.trim().toUpperCase().substring(0, 3);
  }

  // Usar la fecha proporcionada o la fecha actual
  const fechaParaGuia = fecha || new Date();
  const año = fechaParaGuia.getFullYear();
  const mes = (fechaParaGuia.getMonth() + 1).toString().padStart(2, "0");
  const dia = fechaParaGuia.getDate().toString().padStart(2, "0");
  const fechaFormato = `${año}${mes}${dia}`;

  let intentos = 0;
  const maxIntentos = 10;

  while (intentos < maxIntentos) {
    // Generar número aleatorio de 6 dígitos
    const aleatorio = randomInt(0, 1_000_000).toString().padStart(6, "0");

    // Construir número de guía
    const numeroGuia = `${prefijo}-${fechaFormato}-${aleatorio}`;

    try {
      // Verificar que no exista en la base de datos
      const existeGuia = await prisma.envios.findFirst({
        where: { guia: numeroGuia },
        select: { id: true },
      });

      if (!existeGuia) {
        return numeroGuia;
      }

      intentos++;
    } catch (error) {
      console.error("Error al verificar guía existente:", error);
      intentos++;
    }
  }

  throw new Error(
    `No se pudo generar una guía única después de ${maxIntentos} intentos`
  );
}

/**
 * Obtiene una fecha aleatoria en los últimos 30 días
 */
function obtenerFechaAleatoria(diasAtras = 30) {
  const ahora = new Date();
  const diasAleatorios = Math.floor(Math.random() * diasAtras);
  const fecha = new Date(ahora);
  fecha.setDate(fecha.getDate() - diasAleatorios);
  return fecha;
}

/**
 * Obtiene una fecha futura aleatoria en los próximos 7 días
 */
function obtenerFechaFutura(diasAdelante = 7) {
  const ahora = new Date();
  const diasAleatorios = Math.floor(Math.random() * diasAdelante) + 1;
  const fecha = new Date(ahora);
  fecha.setDate(fecha.getDate() + diasAleatorios);
  return fecha;
}

/**
 * Genera fechas de seguimiento basadas en el estado
 */
function generarFechasSegunEstado(estado, fechaRegistro) {
  const fechas = {
    fechaRegistro: fechaRegistro,
    fechaRecoleccion: null,
    fechaEnTransito: null,
    fechaLlegadaDestino: null,
    fechaEntrega: null,
  };

  const ahora = new Date(fechaRegistro);

  switch (estado) {
    case "REGISTRADO":
      // Solo tiene fecha de registro
      break;
    case "EN_BODEGA":
      fechas.fechaRecoleccion = new Date(ahora.getTime() + 2 * 60 * 60 * 1000); // +2 horas
      break;
    case "EN_TRANSITO":
      fechas.fechaRecoleccion = new Date(ahora.getTime() + 2 * 60 * 60 * 1000);
      fechas.fechaEnTransito = new Date(ahora.getTime() + 4 * 60 * 60 * 1000); // +4 horas
      break;
    case "EN_AGENCIA_DESTINO":
      fechas.fechaRecoleccion = new Date(ahora.getTime() + 2 * 60 * 60 * 1000);
      fechas.fechaEnTransito = new Date(ahora.getTime() + 4 * 60 * 60 * 1000);
      fechas.fechaLlegadaDestino = new Date(
        ahora.getTime() + 24 * 60 * 60 * 1000
      ); // +1 día
      break;
    case "EN_REPARTO":
      fechas.fechaRecoleccion = new Date(ahora.getTime() + 2 * 60 * 60 * 1000);
      fechas.fechaEnTransito = new Date(ahora.getTime() + 4 * 60 * 60 * 1000);
      fechas.fechaLlegadaDestino = new Date(
        ahora.getTime() + 24 * 60 * 60 * 1000
      );
      fechas.fechaEntrega = null; // Aún no entregado
      break;
    case "ENTREGADO":
      fechas.fechaRecoleccion = new Date(ahora.getTime() + 2 * 60 * 60 * 1000);
      fechas.fechaEnTransito = new Date(ahora.getTime() + 4 * 60 * 60 * 1000);
      fechas.fechaLlegadaDestino = new Date(
        ahora.getTime() + 24 * 60 * 60 * 1000
      );
      fechas.fechaEntrega = new Date(ahora.getTime() + 36 * 60 * 60 * 1000); // +1.5 días
      break;
    default:
      break;
  }

  return fechas;
}

async function seedEnvios() {
  console.log("📦 Insertando 20 envíos en la base de datos...");

  try {
    // Obtener sucursales existentes
    const sucursales = await prisma.sucursales.findMany({
      where: { deletedAt: null },
      select: { id: true, nombre: true, provincia: true },
    });

    if (sucursales.length < 2) {
      throw new Error("Se necesitan al menos 2 sucursales para crear envíos");
    }

    // Obtener clientes existentes
    const clientes = await prisma.clientes.findMany({
      where: { deletedAt: null, estado: true },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        razonSocial: true,
        telefono: true,
        email: true,
        direccion: true,
        tipoDocumento: true,
        numeroDocumento: true,
        esEmpresa: true,
      },
      take: 20, // Limitar a 20 clientes
    });

    if (clientes.length === 0) {
      throw new Error("No hay clientes disponibles para crear envíos");
    }

    console.log(`📋 Sucursales disponibles: ${sucursales.length}`);
    console.log(`👥 Clientes disponibles: ${clientes.length}`);

    // Estados posibles
    const estados = [
      "REGISTRADO",
      "EN_BODEGA",
      "EN_TRANSITO",
      "EN_AGENCIA_DESTINO",
      "EN_REPARTO",
      "ENTREGADO",
    ];

    // Tipos de servicio
    const tiposServicio = ["NORMAL", "EXPRESS", "OVERNIGHT", "ECONOMICO"];

    // Modalidades
    const modalidades = [
      "SUCURSAL_SUCURSAL",
      "DOMICILIO_SUCURSAL",
      "SUCURSAL_DOMICILIO",
      "DOMICILIO_DOMICILIO",
    ];

    // Descripciones de productos comunes
    const descripciones = [
      "Documentos importantes",
      "Ropa y textiles",
      "Electrodomésticos",
      "Productos electrónicos",
      "Medicinas y productos farmacéuticos",
      "Libros y material educativo",
      "Herramientas y repuestos",
      "Cosméticos y productos de belleza",
      "Juguetes y artículos infantiles",
      "Alimentos no perecederos",
      "Equipos de oficina",
      "Materiales de construcción",
      "Productos textiles",
      "Accesorios de moda",
      "Productos de limpieza",
    ];

    let creados = 0;
    let existentes = 0;

    // Crear 20 envíos
    for (let i = 0; i < 20; i++) {
      try {
        // Seleccionar sucursales aleatorias (asegurar que sean diferentes)
        let sucursalOrigen, sucursalDestino;
        do {
          sucursalOrigen =
            sucursales[Math.floor(Math.random() * sucursales.length)];
          sucursalDestino =
            sucursales[Math.floor(Math.random() * sucursales.length)];
        } while (sucursalOrigen.id === sucursalDestino.id);

        // Seleccionar cliente aleatorio
        const cliente = clientes[Math.floor(Math.random() * clientes.length)];

        // Seleccionar estado, tipo de servicio y modalidad aleatorios
        const estado = estados[Math.floor(Math.random() * estados.length)];
        const tipoServicio =
          tiposServicio[Math.floor(Math.random() * tiposServicio.length)];
        const modalidad =
          modalidades[Math.floor(Math.random() * modalidades.length)];

        // Generar fecha de registro aleatoria (últimos 30 días)
        // IMPORTANTE: Esta fecha se usará tanto para fechaRegistro como para el número de guía
        const fechaRegistro = obtenerFechaAleatoria(30);

        // Generar guía única usando la misma fecha que fechaRegistro
        // para que coincidan la fecha en el número de guía y la fechaRegistro real
        const guia = await generarNumeroGuia(sucursalOrigen.id, fechaRegistro);

        // Generar ID único para el envío
        const id = `envio-${Date.now()}-${i}-${Math.random()
          .toString(36)
          .substring(2, 9)}`;

        // Generar fechas según el estado
        const fechas = generarFechasSegunEstado(estado, fechaRegistro);

        // Generar datos del paquete
        const peso = parseFloat((Math.random() * 50 + 0.5).toFixed(2)); // 0.5 a 50.5 kg
        const alto = Math.floor(Math.random() * 100 + 10); // 10 a 110 cm
        const ancho = Math.floor(Math.random() * 80 + 10); // 10 a 90 cm
        const profundo = Math.floor(Math.random() * 80 + 10); // 10 a 90 cm
        const volumen = parseFloat(
          ((alto * ancho * profundo) / 1_000_000).toFixed(4)
        ); // m³
        const descripcion =
          descripciones[Math.floor(Math.random() * descripciones.length)];
        const valorDeclarado =
          Math.random() > 0.3
            ? parseFloat((Math.random() * 5000 + 100).toFixed(2))
            : null; // 70% tiene valor declarado

        // Calcular precio base (simplificado)
        const precioBase = parseFloat((peso * 2.5 + volumen * 100).toFixed(2));
        const adicionalServicio =
          tipoServicio === "EXPRESS"
            ? precioBase * 0.5
            : tipoServicio === "OVERNIGHT"
            ? precioBase * 1.0
            : tipoServicio === "ECONOMICO"
            ? precioBase * -0.2
            : 0;
        const total = parseFloat(
          Math.max(precioBase + adicionalServicio, 10).toFixed(2)
        );

        // Calcular progreso según estado
        const progresoMap = {
          REGISTRADO: 0,
          EN_BODEGA: 10,
          EN_TRANSITO: 30,
          EN_AGENCIA_ORIGEN: 40,
          EN_AGENCIA_DESTINO: 60,
          EN_REPARTO: 80,
          ENTREGADO: 100,
          DEVUELTO: 0,
          ANULADO: 0,
        };
        const progreso = progresoMap[estado] || 0;

        // Datos del remitente (usar datos del cliente o generar nuevos)
        const usarDatosCliente = Math.random() > 0.3; // 70% usa datos del cliente

        const remitenteNombre = usarDatosCliente
          ? cliente.esEmpresa
            ? cliente.razonSocial
            : `${cliente.nombre} ${cliente.apellidos || ""}`.trim()
          : `Remitente ${i + 1}`;
        const remitenteTelefono = usarDatosCliente
          ? cliente.telefono
          : `9${Math.floor(Math.random() * 900000000 + 100000000)}`;
        const remitenteEmail = usarDatosCliente
          ? cliente.email
          : `remitente${i + 1}@email.com`;
        const remitenteDireccion = usarDatosCliente
          ? cliente.direccion
          : `Dirección del remitente ${i + 1}`;
        const remitenteTipoDocumento = usarDatosCliente
          ? cliente.tipoDocumento
          : "DNI";
        const remitenteNumeroDocumento = usarDatosCliente
          ? cliente.numeroDocumento
          : `${Math.floor(Math.random() * 90000000 + 10000000)}`;

        // Datos del destinatario (generar nuevos)
        const destinatarioNombre = `Destinatario ${i + 1}`;
        const destinatarioTelefono = `9${Math.floor(
          Math.random() * 900000000 + 100000000
        )}`;
        const destinatarioEmail = `destinatario${i + 1}@email.com`;
        const destinatarioDireccion = `Dirección del destinatario ${i + 1}, ${
          sucursalDestino.provincia
        }`;
        const destinatarioTipoDocumento = "DNI";
        const destinatarioNumeroDocumento = `${Math.floor(
          Math.random() * 90000000 + 10000000
        )}`;

        // Crear datos del envío
        const envioData = {
          id,
          guia,
          clienteId: usarDatosCliente ? cliente.id : null,
          sucursalOrigenId: sucursalOrigen.id,
          sucursalDestinoId: sucursalDestino.id,
          peso,
          alto,
          ancho,
          profundo,
          volumen,
          descripcion,
          valorDeclarado,
          total,
          tipoServicio,
          modalidad,
          estado,
          progreso,
          fechaRegistro,
          fechaRecoleccion: fechas.fechaRecoleccion,
          fechaEnTransito: fechas.fechaEnTransito,
          fechaLlegadaDestino: fechas.fechaLlegadaDestino,
          fechaEntrega: fechas.fechaEntrega,
          remitenteNombre,
          remitenteTelefono,
          remitenteEmail,
          remitenteDireccion,
          remitenteTipoDocumento,
          remitenteNumeroDocumento,
          destinatarioNombre,
          destinatarioTelefono,
          destinatarioEmail,
          destinatarioDireccion,
          destinatarioTipoDocumento,
          destinatarioNumeroDocumento,
          requiereConfirmacion: Math.random() > 0.7, // 30% requiere confirmación
          notificacionesEnviadas: estado !== "REGISTRADO", // Los registrados no tienen notificaciones
          notas:
            Math.random() > 0.5
              ? `Notas adicionales para el envío ${i + 1}`
              : null,
        };

        // Verificar si la guía ya existe
        const existeGuia = await prisma.envios.findFirst({
          where: { guia },
          select: { id: true },
        });

        if (existeGuia) {
          console.log(`⚠️  Envío con guía ${guia} ya existe`);
          existentes++;
          continue;
        }

        // Crear el envío
        await prisma.envios.create({
          data: envioData,
        });

        creados++;
        console.log(
          `✅ Envío creado: ${guia} - ${estado} - ${sucursalOrigen.nombre} → ${sucursalDestino.nombre}`
        );
      } catch (error) {
        if (error.code === "P2002") {
          console.log(`⚠️  Envío con guía ya existe (violación única)`);
          existentes++;
        } else {
          console.error(`❌ Error al crear envío ${i + 1}:`, error.message);
        }
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Envíos creados: ${creados}`);
    console.log(`   ⚠️  Envíos existentes: ${existentes}`);
    console.log(`   📦 Total procesados: 20`);
  } catch (error) {
    console.error("💥 Error durante el seeding de envíos:", error);
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  seedEnvios()
    .then(() => {
      console.log("🎉 Seeding de envíos completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error durante el seeding:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = seedEnvios;
