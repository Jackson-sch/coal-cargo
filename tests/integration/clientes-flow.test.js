import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createCliente,
  getClienteById,
  updateCliente,
  deleteCliente,
  reactivateCliente,
} from '@/lib/actions/clientes';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Mock de dependencias
vi.mock('@/lib/prisma', () => ({
  prisma: {
    clientes: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Flujo completo de gestión de clientes', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'SUPER_ADMIN',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: mockUser });
  });

  it('debe crear, obtener, actualizar y desactivar un cliente', async () => {
    const clienteData = {
      nombre: 'Juan',
      apellidos: 'Pérez',
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      telefono: '999999999',
      esEmpresa: false,
    };

    // 1. Crear cliente
    const mockClienteCreado = {
      id: 'cliente-1',
      ...clienteData,
      estado: true,
      createdAt: new Date(),
    };

    prisma.clientes.create.mockResolvedValue(mockClienteCreado);
    const createResult = await createCliente(clienteData);

    expect(createResult.success).toBe(true);
    expect(createResult.data.id).toBe('cliente-1');

    // 2. Obtener cliente por ID
    prisma.clientes.findUnique.mockResolvedValue(mockClienteCreado);
    const getResult = await getClienteById('cliente-1');

    expect(getResult.success).toBe(true);
    expect(getResult.data.nombre).toBe('Juan');

    // 3. Actualizar cliente
    const clienteActualizado = {
      ...mockClienteCreado,
      nombre: 'Juan Carlos',
      updatedAt: new Date(),
    };

    prisma.clientes.findUnique.mockResolvedValue(mockClienteCreado);
    prisma.clientes.update.mockResolvedValue(clienteActualizado);

    const updateResult = await updateCliente('cliente-1', {
      ...clienteData,
      nombre: 'Juan Carlos',
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.data.nombre).toBe('Juan Carlos');

    // 4. Desactivar cliente (soft delete)
    const clienteDesactivado = {
      ...clienteActualizado,
      estado: false,
      deletedAt: new Date(),
    };

    prisma.clientes.findUnique.mockResolvedValue(clienteActualizado);
    prisma.clientes.update.mockResolvedValue(clienteDesactivado);

    const deleteResult = await deleteCliente('cliente-1');

    expect(deleteResult.success).toBe(true);

    // 5. Reactivar cliente
    const clienteReactivado = {
      ...clienteDesactivado,
      estado: true,
      deletedAt: null,
      updatedAt: new Date(),
    };

    prisma.clientes.findUnique.mockResolvedValue(clienteDesactivado);
    prisma.clientes.update.mockResolvedValue(clienteReactivado);

    const reactivateResult = await reactivateCliente('cliente-1');

    expect(reactivateResult.success).toBe(true);
    expect(reactivateResult.data.estado).toBe(true);
    expect(reactivateResult.data.deletedAt).toBeNull();
  });

  it('debe manejar errores en el flujo completo', async () => {
    // Simular error de red en creación
    prisma.clientes.create.mockRejectedValue(new Error('Network error'));

    const createResult = await createCliente({
      nombre: 'Test',
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      telefono: '999999999',
    });

    expect(createResult.success).toBe(false);
    expect(createResult.error).toBeDefined();
  });
});

