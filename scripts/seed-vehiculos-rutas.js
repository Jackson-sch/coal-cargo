const { prisma } = require("../src/lib/prisma-cjs");

async function seedVehiculosYRutas() {
  try {
    console.log("🚚 Creando vehículos de prueba...");
    
    // Obtener sucursales
    const sucursales = await prisma.sucursales.findMany({
      where: { deletedAt: null },
      take: 4,
    });

    if (sucursales.length === 0) {
      console.log("⚠️ No hay sucursales disponibles. Creando vehículos sin sucursal asignada.");
    }

    // Crear vehículos de prueba
    const vehiculos = [
      {
        placa: "ABC123",
        marca: "Volvo",
        modelo: "FH 440",
        año: 2022,
        pesoMaximo: 25000,
        volumenMaximo: 80,
        tipoVehiculo: "CAMION_GRANDE",
        estado: "DISPONIBLE",
        sucursalId: sucursales[0]?.id || null,
      },
      {
        placa: "XYZ456",
        marca: "Mercedes-Benz",
        modelo: "Actros 2644",
        año: 2021,
        pesoMaximo: 18000,
        volumenMaximo: 60,
        tipoVehiculo: "CAMION_MEDIANO",
        estado: "DISPONIBLE",
        sucursalId: sucursales[0]?.id || null,
      },
      {
        placa: "DEF789",
        marca: "Isuzu",
        modelo: "NPR 400",
        año: 2023,
        pesoMaximo: 7500,
        volumenMaximo: 30,
        tipoVehiculo: "CAMION_PEQUENO",
        estado: "DISPONIBLE",
        sucursalId: sucursales[1]?.id || null,
      },
      {
        placa: "GHI012",
        marca: "Hino",
        modelo: "300 Series",
        año: 2022,
        pesoMaximo: 35000,
        volumenMaximo: 100,
        tipoVehiculo: "TRAILER",
        estado: "DISPONIBLE",
        sucursalId: sucursales[0]?.id || null,
      },
      {
        placa: "JKL345",
        marca: "Hyundai",
        modelo: "HD78",
        año: 2023,
        pesoMaximo: 3500,
        volumenMaximo: 15,
        tipoVehiculo: "FURGONETA",
        estado: "DISPONIBLE",
        sucursalId: sucursales[2]?.id || null,
      },
    ];

    const vehiculosCreados = [];
    for (const vehiculo of vehiculos) {
      try {
        const vehiculoCreado = await prisma.vehiculos.upsert({
          where: { placa: vehiculo.placa },
          update: vehiculo,
          create: {
            ...vehiculo,
            capacidad: vehiculo.pesoMaximo, // Campo de compatibilidad
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        vehiculosCreados.push(vehiculoCreado);
        console.log(`✅ Vehículo creado/actualizado: ${vehiculo.placa} - ${vehiculo.marca} ${vehiculo.modelo}`);
      } catch (error) {
        if (error.code === "P2002") {
          console.log(`⚠️ Vehículo ya existe: ${vehiculo.placa}`);
        } else {
          console.error(`❌ Error al crear vehículo ${vehiculo.placa}:`, error.message);
        }
      }
    }

    console.log(`\n🛣️ Creando rutas de prueba...`);

    if (sucursales.length < 2) {
      console.log("⚠️ Se necesitan al menos 2 sucursales para crear rutas.");
      return;
    }

    // Crear rutas de prueba
    const rutas = [
      {
        nombre: "Lima - Arequipa",
        codigo: "LIM-AQP-01",
        descripcion: "Ruta principal Lima a Arequipa",
        tipo: "INTERDEPARTAMENTAL",
        estado: "PROGRAMADA",
        activo: true,
        sucursalOrigenId: sucursales.find(s => s.provincia === "Lima")?.id || sucursales[0].id,
        sucursalDestinoId: sucursales.find(s => s.provincia === "Arequipa")?.id || sucursales[1].id,
        distancia: 1003,
        tiempoEstimado: 1080, // 18 horas
        costoBase: 200,
        costoPeajes: 76,
        costoCombustible: 350,
        costoTotal: 626,
        tipoVehiculo: "CAMION_GRANDE",
        capacidadMaxima: 25000,
      },
      {
        nombre: "Lima - Cusco",
        codigo: "LIM-CUS-01",
        descripcion: "Ruta principal Lima a Cusco",
        tipo: "INTERDEPARTAMENTAL",
        estado: "PROGRAMADA",
        activo: true,
        sucursalOrigenId: sucursales.find(s => s.provincia === "Lima")?.id || sucursales[0].id,
        sucursalDestinoId: sucursales.find(s => s.provincia === "Cusco")?.id || sucursales[2].id,
        distancia: 1100,
        tiempoEstimado: 1440, // 24 horas
        costoBase: 250,
        costoPeajes: 85,
        costoCombustible: 400,
        costoTotal: 735,
        tipoVehiculo: "CAMION_GRANDE",
        capacidadMaxima: 25000,
      },
      {
        nombre: "Lima - Trujillo",
        codigo: "LIM-TRU-01",
        descripcion: "Ruta principal Lima a Trujillo",
        tipo: "INTERPROVINCIAL",
        estado: "PROGRAMADA",
        activo: true,
        sucursalOrigenId: sucursales.find(s => s.provincia === "Lima")?.id || sucursales[0].id,
        sucursalDestinoId: sucursales.find(s => s.provincia === "Trujillo")?.id || sucursales[3].id,
        distancia: 561,
        tiempoEstimado: 540, // 9 horas
        costoBase: 150,
        costoPeajes: 45,
        costoCombustible: 200,
        costoTotal: 395,
        tipoVehiculo: "CAMION_MEDIANO",
        capacidadMaxima: 18000,
      },
      {
        nombre: "Arequipa - Cusco",
        codigo: "AQP-CUS-01",
        descripcion: "Ruta Arequipa a Cusco",
        tipo: "INTERDEPARTAMENTAL",
        estado: "PROGRAMADA",
        activo: true,
        sucursalOrigenId: sucursales.find(s => s.provincia === "Arequipa")?.id || sucursales[1].id,
        sucursalDestinoId: sucursales.find(s => s.provincia === "Cusco")?.id || sucursales[2].id,
        distancia: 524,
        tiempoEstimado: 720, // 12 horas
        costoBase: 180,
        costoPeajes: 55,
        costoCombustible: 250,
        costoTotal: 485,
        tipoVehiculo: "CAMION_MEDIANO",
        capacidadMaxima: 18000,
      },
    ];

    const rutasCreadas = [];
    for (const ruta of rutas) {
      try {
        // Verificar que las sucursales existan
        const origen = await prisma.sucursales.findUnique({
          where: { id: ruta.sucursalOrigenId },
        });
        const destino = await prisma.sucursales.findUnique({
          where: { id: ruta.sucursalDestinoId },
        });

        if (!origen || !destino) {
          console.log(`⚠️ Saltando ruta ${ruta.codigo}: sucursales no válidas`);
          continue;
        }

        const rutaCreada = await prisma.rutas.upsert({
          where: { codigo: ruta.codigo },
          update: ruta,
          create: {
            ...ruta,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        rutasCreadas.push(rutaCreada);
        console.log(`✅ Ruta creada/actualizada: ${ruta.codigo} - ${ruta.nombre}`);
      } catch (error) {
        if (error.code === "P2002") {
          console.log(`⚠️ Ruta ya existe: ${ruta.codigo}`);
        } else {
          console.error(`❌ Error al crear ruta ${ruta.codigo}:`, error.message);
        }
      }
    }

    // Resumen
    const totalVehiculos = await prisma.vehiculos.count({
      where: { deletedAt: null },
    });
    const totalRutas = await prisma.rutas.count({
      where: { deletedAt: null },
    });

    console.log(`\n✅ Resumen:`);
    console.log(`   🚚 Vehículos: ${totalVehiculos}`);
    console.log(`   🛣️ Rutas: ${totalRutas}`);
  } catch (error) {
    console.error("❌ Error en seed de vehículos y rutas:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Ejecutando seed de vehículos y rutas...");
  try {
    await seedVehiculosYRutas();
    console.log("🎉 Seed completado exitosamente");
  } catch (error) {
    console.error("💥 Error durante el seed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Error no manejado:", e);
  process.exit(1);
});

