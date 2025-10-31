const { prisma } = require("../prisma-cjs");
module.exports = async function createTestUser() {
  try {
    // Crear una sucursal de prueb a
    const sucursal = await prisma.sucursales.create({
      data: {
        id: "sucursal-principal",
        nombre: "Sucursal Principal",
        direccion: "Av. Principal 123",
        provincia: "Lima",
        telefono: "01-1234567",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }); // Crear usuario de prueb a
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("123456", 10);
    const user = await prisma.usuarios.create({
      data: {
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
  } catch (error) {
    throw error;
  }
};
