const { prisma } = require("../prisma-cjs");
async function seedSucursalesYTarifas() {
  try {
    // Crear sucursales adicionale s
    const sucursales = [
      {
        id: "sucursal-arequipa",
        nombre: "Sucursal Arequipa",
        direccion: "Av. Ejercito 456",
        provincia: "Arequipa",
        telefono: "054-123456",
      },
      {
        id: "sucursal-cusco",
        nombre: "Sucursal Cusco",
        direccion: "Av. Sol 789",
        provincia: "Cusco",
        telefono: "084-123456",
      },
      {
        id: "sucursal-trujillo",
        nombre: "Sucursal Trujillo",
        direccion: "Av. España 321",
        provincia: "Trujillo",
        telefono: "044-123456",
      },
    ];
    for (const sucursal of sucursales) {
      await prisma.sucursales.upsert({
        where: { id: sucursal.id },
        update: sucursal,
        create: { ...sucursal, createdAt: new Date(), updatedAt: new Date() },
      });
    } // Obtener todas las sucursales (incluyendo la principa l) const todasLasSucursales = await prisma.sucursales.findMany({ where: { deletedAt: null }, });// Crear tarifas entre todas las sucursale s
    const tarifasBase = {
      "Lima-Arequipa": { precioBase: 25.0, precioKg: 4.0, tiempoEstimado: 2 },
      "Lima-Cusco": { precioBase: 30.0, precioKg: 5.0, tiempoEstimado: 3 },
      "Lima-Trujillo": { precioBase: 20.0, precioKg: 3.5, tiempoEstimado: 1 },
      "Arequipa-Lima": { precioBase: 25.0, precioKg: 4.0, tiempoEstimado: 2 },
      "Arequipa-Cusco": { precioBase: 35.0, precioKg: 5.5, tiempoEstimado: 2 },
      "Cusco-Lima": { precioBase: 30.0, precioKg: 5.0, tiempoEstimado: 3 },
      "Cusco-Arequipa": { precioBase: 35.0, precioKg: 5.5, tiempoEstimado: 2 },
      "Trujillo-Lima": { precioBase: 20.0, precioKg: 3.5, tiempoEstimado: 1 },
    };
    for (const sucursalOrigen of todasLasSucursales) {
      for (const sucursalDestino of todasLasSucursales) {
        if (sucursalOrigen.id !== sucursalDestino.id) {
          // Buscar tarifa bas e
          const claveOrigen =
            sucursalOrigen.provincia === "Lima"
              ? "Lima"
              : sucursalOrigen.provincia;
          const claveDestino =
            sucursalDestino.provincia === "Lima"
              ? "Lima"
              : sucursalDestino.provincia;
          const claveTarifa = `${claveOrigen}-${claveDestino}`;
          const tarifaBase = tarifasBase[claveTarifa] || {
            precioBase: 15.0,
            precioKg: 3.0,
            tiempoEstimado: 1,
          };
          await prisma.tarifas_sucursales.upsert({
            where: {
              sucursalOrigenId_sucursalDestinoId: {
                sucursalOrigenId: sucursalOrigen.id,
                sucursalDestinoId: sucursalDestino.id,
              },
            },
            update: {
              precioBase: tarifaBase.precioBase,
              precioKg: tarifaBase.precioKg,
              tiempoEstimado: tarifaBase.tiempoEstimado,
              activo: true,
            },
            create: {
              sucursalOrigenId: sucursalOrigen.id,
              sucursalDestinoId: sucursalDestino.id,
              precioBase: tarifaBase.precioBase,
              precioKg: tarifaBase.precioKg,
              tiempoEstimado: tarifaBase.tiempoEstimado,
              activo: true,
              observaciones: `Tarifa automática ${claveOrigen} → ${claveDestino}`,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      }
    } // Mostrar resume n
    const totalSucursales = await prisma.sucursales.count({
      where: { deletedAt: null },
    });
    const totalTarifas = await prisma.tarifas_sucursales.count();
  } catch (error) {
    throw error;
  }
}
module.exports = { seedSucursalesYTarifas };
