const { prisma } = require("../prisma-cjs");
module.exports = async function createTestUser() {
  try {
    console.log("👤 Creando usuario de prueba...");
    
    // Crear o obtener sucursal principal
    const sucursal = await prisma.sucursales.upsert({
      where: { id: "sucursal-principal" },
      update: {},
      create: {
        id: "sucursal-principal",
        nombre: "Sucursal Principal",
        direccion: "Av. Principal 123",
        provincia: "Lima",
        telefono: "01-1234567",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    console.log(`✅ Sucursal principal: ${sucursal.nombre}`);
    
    // Crear o actualizar usuario de prueba
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("123456", 10);
    
    const user = await prisma.usuarios.upsert({
      where: { id: "admin-user" },
      update: {
        password: hashedPassword,
        sucursalId: sucursal.id,
        updatedAt: new Date(),
      },
      create: {
        id: "admin-user",
        name: "Administrador",
        email: "admin@coalcargo.com",
        password: hashedPassword,
        phone: "0987654321",
        role: "SUPER_ADMIN",
        sucursalId: sucursal.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    console.log(`✅ Usuario creado/actualizado: ${user.email} (${user.role})`);
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   🔑 Contraseña: 123456`);
  } catch (error) {
    console.error("❌ Error al crear usuario de prueba:", error);
    throw error;
  }
};
