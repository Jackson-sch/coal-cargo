import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

/**
 * Tests de integración para el módulo de envíos
 * Requieren una base de datos de prueba configurada
 */

describe('Envíos - Tests de Integración', () => {
  let testSucursalOrigen;
  let testSucursalDestino;
  let testCliente;

  beforeAll(async () => {
    // Crear datos de prueba
    testSucursalOrigen = await prisma.sucursales.create({
      data: {
        id: `test-sucursal-origen-${Date.now()}`,
        nombre: 'Sucursal Origen Test',
        direccion: 'Av. Test 123',
        provincia: 'Lima',
      },
    });

    testSucursalDestino = await prisma.sucursales.create({
      data: {
        id: `test-sucursal-destino-${Date.now()}`,
        nombre: 'Sucursal Destino Test',
        direccion: 'Av. Test 456',
        provincia: 'Lima',
      },
    });

    testCliente = await prisma.clientes.create({
      data: {
        nombre: 'Cliente',
        apellidos: 'Test',
        tipoDocumento: 'DNI',
        numeroDocumento: `TEST${Date.now()}`,
        telefono: '987654321',
        estado: true,
      },
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.envios.deleteMany({
      where: {
        clienteId: testCliente.id,
      },
    });

    await prisma.clientes.delete({
      where: { id: testCliente.id },
    });

    await prisma.sucursales.deleteMany({
      where: {
        id: {
          in: [testSucursalOrigen.id, testSucursalDestino.id],
        },
      },
    });

    await prisma.$disconnect();
  });

  it('debe crear un envío correctamente', async () => {
    const guia = `TEST-${Date.now()}`;
    const envio = await prisma.envios.create({
      data: {
        id: `test-envio-${Date.now()}`,
        guia,
        clienteId: testCliente.id,
        sucursalOrigenId: testSucursalOrigen.id,
        sucursalDestinoId: testSucursalDestino.id,
        peso: 10.5,
        total: 50.0,
        estado: 'REGISTRADO',
        progreso: 0,
        fechaRegistro: new Date(),
        destinatarioNombre: 'Destinatario Test',
        destinatarioTelefono: '987654321',
      },
    });

    expect(envio).toBeDefined();
    expect(envio.guia).toBe(guia);
    expect(envio.estado).toBe('REGISTRADO');
    expect(envio.progreso).toBe(0);

    // Limpiar
    await prisma.envios.delete({
      where: { id: envio.id },
    });
  });

  it('debe actualizar el estado de un envío', async () => {
    const guia = `TEST-${Date.now()}`;
    const envio = await prisma.envios.create({
      data: {
        id: `test-envio-${Date.now()}`,
        guia,
        clienteId: testCliente.id,
        sucursalOrigenId: testSucursalOrigen.id,
        sucursalDestinoId: testSucursalDestino.id,
        peso: 10.5,
        total: 50.0,
        estado: 'REGISTRADO',
        progreso: 0,
        fechaRegistro: new Date(),
        destinatarioNombre: 'Destinatario Test',
        destinatarioTelefono: '987654321',
      },
    });

    const envioActualizado = await prisma.envios.update({
      where: { id: envio.id },
      data: {
        estado: 'EN_TRANSITO',
        progreso: 50,
      },
    });

    expect(envioActualizado.estado).toBe('EN_TRANSITO');
    expect(envioActualizado.progreso).toBe(50);

    // Limpiar
    await prisma.envios.delete({
      where: { id: envio.id },
    });
  });
});

