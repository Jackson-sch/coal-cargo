const { prisma } = require("../src/lib/prisma-cjs");

async function seedClientes() {
  console.log("📦 Insertando 20 clientes en la base de datos...");

  const clientes = [
    // Personas naturales (DNI)
    {
      nombre: "Juan",
      apellidos: "Pérez García",
      tipoDocumento: "DNI",
      numeroDocumento: "12345678",
      telefono: "987654321",
      email: "juan.perez@email.com",
      direccion: "Av. Las Flores 123, San Isidro",
      esEmpresa: false,
      estado: true,
    },
    {
      nombre: "María",
      apellidos: "González López",
      tipoDocumento: "DNI",
      numeroDocumento: "23456789",
      telefono: "987654322",
      email: "maria.gonzalez@email.com",
      direccion: "Jr. Los Olivos 456, Miraflores",
      esEmpresa: false,
      estado: true,
    },
    {
      nombre: "Carlos",
      apellidos: "Rodríguez Martínez",
      tipoDocumento: "DNI",
      numeroDocumento: "34567890",
      telefono: "987654323",
      email: "carlos.rodriguez@email.com",
      direccion: "Av. Arequipa 789, Surco",
      esEmpresa: false,
      estado: true,
    },
    {
      nombre: "Ana",
      apellidos: "Sánchez Fernández",
      tipoDocumento: "DNI",
      numeroDocumento: "45678901",
      telefono: "987654324",
      email: "ana.sanchez@email.com",
      direccion: "Calle Los Pinos 321, La Molina",
      esEmpresa: false,
      estado: true,
    },
    {
      nombre: "Luis",
      apellidos: "Torres Vargas",
      tipoDocumento: "DNI",
      numeroDocumento: "56789012",
      telefono: "987654325",
      email: "luis.torres@email.com",
      direccion: "Av. Javier Prado 654, San Borja",
      esEmpresa: false,
      estado: true,
    },
    {
      nombre: "Carmen",
      apellidos: "Díaz Ruiz",
      tipoDocumento: "DNI",
      numeroDocumento: "67890123",
      telefono: "987654326",
      email: "carmen.diaz@email.com",
      direccion: "Jr. Unión 987, Centro de Lima",
      esEmpresa: false,
      estado: true,
    },
    {
      nombre: "Roberto",
      apellidos: "Hernández Morales",
      tipoDocumento: "DNI",
      numeroDocumento: "78901234",
      telefono: "987654327",
      email: "roberto.hernandez@email.com",
      direccion: "Av. Brasil 147, Magdalena",
      esEmpresa: false,
      estado: true,
    },
    {
      nombre: "Patricia",
      apellidos: "Jiménez Castro",
      tipoDocumento: "DNI",
      numeroDocumento: "89012345",
      telefono: "987654328",
      email: "patricia.jimenez@email.com",
      direccion: "Calle Las Begonias 258, San Isidro",
      esEmpresa: false,
      estado: true,
    },
    {
      nombre: "Fernando",
      apellidos: "Morales Gutiérrez",
      tipoDocumento: "DNI",
      numeroDocumento: "90123456",
      telefono: "987654329",
      email: "fernando.morales@email.com",
      direccion: "Av. La Marina 369, San Miguel",
      esEmpresa: false,
      estado: true,
    },
    {
      nombre: "Laura",
      apellidos: "Castro Velasco",
      tipoDocumento: "DNI",
      numeroDocumento: "01234567",
      telefono: "987654330",
      email: "laura.castro@email.com",
      direccion: "Jr. Los Jazmines 741, Pueblo Libre",
      esEmpresa: false,
      estado: true,
    },
    {
      nombre: "Miguel",
      apellidos: "Flores Ramírez",
      tipoDocumento: "DNI",
      numeroDocumento: "11223344",
      telefono: "987654331",
      email: "miguel.flores@email.com",
      direccion: "Av. Universitaria 852, Lima",
      esEmpresa: false,
      estado: true,
    },
    {
      nombre: "Sofía",
      apellidos: "Vargas Mendoza",
      tipoDocumento: "DNI",
      numeroDocumento: "22334455",
      telefono: "987654332",
      email: "sofia.vargas@email.com",
      direccion: "Calle Las Orquídeas 963, Jesús María",
      esEmpresa: false,
      estado: true,
    },
    {
      nombre: "Diego",
      apellidos: "Mendoza Silva",
      tipoDocumento: "DNI",
      numeroDocumento: "33445566",
      telefono: "987654333",
      email: "diego.mendoza@email.com",
      direccion: "Av. Salaverry 159, Jesús María",
      esEmpresa: false,
      estado: true,
    },
    {
      nombre: "Valentina",
      apellidos: "Silva Rojas",
      tipoDocumento: "DNI",
      numeroDocumento: "44556677",
      telefono: "987654334",
      email: "valentina.silva@email.com",
      direccion: "Jr. Los Geranios 357, Lince",
      esEmpresa: false,
      estado: true,
    },
    {
      nombre: "Ricardo",
      apellidos: "Rojas Quispe",
      tipoDocumento: "DNI",
      numeroDocumento: "55667788",
      telefono: "987654335",
      email: "ricardo.rojas@email.com",
      direccion: "Av. Angamos 741, Surquillo",
      esEmpresa: false,
      estado: true,
    },
    // Empresas (RUC)
    {
      nombre: "Empresa",
      razonSocial: "TECNOLOGÍA AVANZADA S.A.C.",
      tipoDocumento: "RUC",
      numeroDocumento: "20100070970",
      ruc: "20100070970",
      telefono: "01-4455667",
      email: "contacto@tecnoavanzada.com",
      direccion: "Av. El Sol 123, Of. 501, Lima",
      esEmpresa: true,
      estado: true,
    },
    {
      nombre: "Empresa",
      razonSocial: "COMERCIALIZADORA DEL PERÚ E.I.R.L.",
      tipoDocumento: "RUC",
      numeroDocumento: "20100070971",
      ruc: "20100070971",
      telefono: "01-4455668",
      email: "ventas@comercializadora.pe",
      direccion: "Jr. Los Laureles 456, Lima",
      esEmpresa: true,
      estado: true,
    },
    {
      nombre: "Empresa",
      razonSocial: "DISTRIBUIDORA NACIONAL S.A.",
      tipoDocumento: "RUC",
      numeroDocumento: "20100070972",
      ruc: "20100070972",
      telefono: "01-4455669",
      email: "info@distribuidora.com",
      direccion: "Av. República de Panamá 789, Lima",
      esEmpresa: true,
      estado: true,
    },
    {
      nombre: "Empresa",
      razonSocial: "SERVICIOS INTEGRALES PERÚ S.A.C.",
      tipoDocumento: "RUC",
      numeroDocumento: "20100070973",
      ruc: "20100070973",
      telefono: "01-4455670",
      email: "contacto@serviciosintegrales.pe",
      direccion: "Calle Las Magnolias 321, San Isidro",
      esEmpresa: true,
      estado: true,
    },
    {
      nombre: "Empresa",
      razonSocial: "LOGÍSTICA EXPRESS E.I.R.L.",
      tipoDocumento: "RUC",
      numeroDocumento: "20100070974",
      ruc: "20100070974",
      telefono: "01-4455671",
      email: "operaciones@logisticaexpress.com",
      direccion: "Av. La Marina 654, Callao",
      esEmpresa: true,
      estado: true,
    },
  ];

  try {
    let creados = 0;
    let existentes = 0;

    for (const clienteData of clientes) {
      try {
        // Verificar si el cliente ya existe
        const existe = await prisma.clientes.findFirst({
          where: {
            numeroDocumento: clienteData.numeroDocumento,
            deletedAt: null,
          },
        });

        if (existe) {
          console.log(`⚠️  Cliente con DNI/RUC ${clienteData.numeroDocumento} ya existe`);
          existentes++;
          continue;
        }

        await prisma.clientes.create({
          data: clienteData,
        });

        creados++;
        console.log(
          `✅ Cliente creado: ${clienteData.esEmpresa ? clienteData.razonSocial : `${clienteData.nombre} ${clienteData.apellidos}`} (${clienteData.numeroDocumento})`
        );
      } catch (error) {
        if (error.code === "P2002") {
          console.log(`⚠️  Cliente con DNI/RUC ${clienteData.numeroDocumento} ya existe (violación única)`);
          existentes++;
        } else {
          console.error(`❌ Error al crear cliente ${clienteData.numeroDocumento}:`, error.message);
        }
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Clientes creados: ${creados}`);
    console.log(`   ⚠️  Clientes existentes: ${existentes}`);
    console.log(`   📦 Total procesados: ${clientes.length}`);
  } catch (error) {
    console.error("💥 Error durante el seeding de clientes:", error);
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  seedClientes()
    .then(() => {
      console.log("🎉 Seeding de clientes completado");
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

module.exports = seedClientes;

