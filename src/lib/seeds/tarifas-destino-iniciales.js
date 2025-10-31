const { prisma } = require("../prisma-cjs");
async function seedTarifasDestinoIniciales() {
  try {
    // Obtener algunos distritos para crear tarifas de ejempl o
    const distritos = await prisma.ubigeo_distritos.findMany({
      where: {
        OR: [
          { nombre: { contains: "LIMA", mode: "insensitive" } },
          { nombre: { contains: "TRUJILLO", mode: "insensitive" } },
          { nombre: { contains: "AREQUIPA", mode: "insensitive" } },
          { nombre: { contains: "CUSCO", mode: "insensitive" } },
          { nombre: { contains: "VIRU", mode: "insensitive" } },
          { nombre: { contains: "CHICLAYO", mode: "insensitive" } },
          { nombre: { contains: "PIURA", mode: "insensitive" } },
        ],
      },
      include: { provincia: { include: { departamento: true } } },
      take: 20,
    }); // Tarifas base inspiradas en Shalo m
    const tarifasBase = [
      // Lima - Zona céntric a
      {
        paquetePequeno: 12.0,
        paqueteMediano: 14.0,
        paqueteGrande: 18.0,
        precioPorKg: 0.5,
        precioPorVolumen: 110.0,
        tiempoEntregaDias: 1,
        requiereCoordinacion: false,
      }, // Provincias cercana s
      {
        paquetePequeno: 15.0,
        paqueteMediano: 20.0,
        paqueteGrande: 25.0,
        precioPorKg: 1.0,
        precioPorVolumen: 232.0,
        tiempoEntregaDias: 2,
        requiereCoordinacion: false,
      }, // Provincias lejana s
      {
        paquetePequeno: 20.0,
        paqueteMediano: 26.0,
        paqueteGrande: 35.0,
        precioPorKg: 1.5,
        precioPorVolumen: 342.0,
        tiempoEntregaDias: 3,
        requiereCoordinacion: true,
      },
    ];
    let tarifasCreadas = 0;
    for (const distrito of distritos) {
      try {
        // Verificar si ya existe una tarifa para este distrit o
        const tarifaExistente = await prisma.tarifas_destino.findFirst({
          where: { distritoId: distrito.id },
        });
        if (tarifaExistente) {
          continue;
        }

        // Determinar qué tarifa usar según la ubicació n
        let tarifaIndex = 0;
        const departamento =
          distrito.provincia.departamento.nombre.toLowerCase();
        if (departamento.includes("lima")) {
          tarifaIndex = 0; // Tarifa Lim a
        } else if (
          ["la libertad", "lambayeque", "piura"].some((d) =>
            departamento.includes(d)
          )
        ) {
          tarifaIndex = 1; // Provincias cercana s
        } else {
          tarifaIndex = 2; // Provincias lejana s
        }
        const tarifaBase = tarifasBase[tarifaIndex]; // Crear nombre de zon a
        const nombreZona = `${distrito.nombre} - ${distrito.provincia.nombre}`;
        await prisma.tarifas_destino.create({
          data: {
            distritoId: distrito.id,
            nombreZona,
            paquetePequeno: tarifaBase.paquetePequeno,
            paqueteMediano: tarifaBase.paqueteMediano,
            paqueteGrande: tarifaBase.paqueteGrande,
            precioPorKg: tarifaBase.precioPorKg,
            precioPorVolumen: tarifaBase.precioPorVolumen,
            pesoMaximoPaquete: 10.0,
            volumenMaximoPaquete: 0.1,
            tiempoEntregaDias: tarifaBase.tiempoEntregaDias,
            requiereCoordinacion: tarifaBase.requiereCoordinacion,
            observaciones: `Tarifa para ${distrito.provincia.departamento.nombre} - ${distrito.provincia.nombre}`,
            activo: true,
          },
        });
        tarifasCreadas++;
      } catch (error) {}
    }
    return { success: true, tarifasCreadas };
  } catch (error) {
    throw error;
  }
}
module.exports = { seedTarifasDestinoIniciales };
