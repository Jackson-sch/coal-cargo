const { seedSucursalesYTarifas } = require("../src/lib/seeds/sucursales-y-tarifas");
const { prisma } = require("../src/lib/prisma-cjs");

async function main() {
  console.log("🚀 Ejecutando seed de sucursales y tarifas...");
  try {
    await seedSucursalesYTarifas();
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
