import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getClientes, createCliente, updateCliente } from '@/lib/actions/clientes';
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

describe('Clientes Actions', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'SUPER_ADMIN',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: mockUser });
  });

  describe('getClientes', () => {
    it('debe retornar lista de clientes correctamente', async () => {
      const mockClientes = [
        {
          id: 'cliente-1',
          nombre: 'Juan',
          apellidos: 'Pérez',
          tipoDocumento: 'DNI',
          numeroDocumento: '12345678',
          estado: true,
        },
      ];

      prisma.clientes.findMany.mockResolvedValue(mockClientes);
      prisma.clientes.count.mockResolvedValue(1);

      const result = await getClientes({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockClientes);
      expect(result.total).toBe(1);
    });

    it('debe filtrar por estado activo por defecto', async () => {
      prisma.clientes.findMany.mockResolvedValue([]);
      prisma.clientes.count.mockResolvedValue(0);

      await getClientes({});

      const whereClause = prisma.clientes.findMany.mock.calls[0][0].where;
      expect(whereClause.estado).toBe(true);
      expect(whereClause.deletedAt).toBeNull();
    });

    it('debe filtrar clientes inactivos correctamente', async () => {
      prisma.clientes.findMany.mockResolvedValue([]);
      prisma.clientes.count.mockResolvedValue(0);

      await getClientes({ estado: 'inactive' });

      const whereClause = prisma.clientes.findMany.mock.calls[0][0].where;
      expect(whereClause.estado).toBe(false);
      // No debe excluir deletedAt para incluir soft-deleted
    });

    it('debe requerir autenticación', async () => {
      auth.mockResolvedValue(null);

      const result = await getClientes({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('No autorizado');
    });

    it('debe filtrar por búsqueda (q)', async () => {
      prisma.clientes.findMany.mockResolvedValue([]);
      prisma.clientes.count.mockResolvedValue(0);

      await getClientes({ q: 'Juan' });

      const whereClause = prisma.clientes.findMany.mock.calls[0][0].where;
      expect(whereClause.OR).toBeDefined();
      expect(whereClause.OR.length).toBeGreaterThan(0);
    });
  });

  describe('createCliente', () => {
    const clienteData = {
      nombre: 'Juan',
      apellidos: 'Pérez',
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      telefono: '999999999',
      esEmpresa: false,
    };

    it('debe crear un cliente correctamente', async () => {
      const mockCliente = {
        id: 'cliente-1',
        ...clienteData,
        estado: true,
        createdAt: new Date(),
      };

      prisma.clientes.create.mockResolvedValue(mockCliente);

      const result = await createCliente(clienteData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCliente);
      expect(prisma.clientes.create).toHaveBeenCalled();
    });

    it('debe validar datos requeridos', async () => {
      const invalidData = {
        nombre: '',
        tipoDocumento: 'DNI',
        numeroDocumento: '123',
      };

      const result = await createCliente(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('debe rechazar DNI inválido', async () => {
      const invalidData = {
        ...clienteData,
        numeroDocumento: '123', // DNI muy corto
      };

      const result = await createCliente(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('DNI');
    });
  });

  describe('updateCliente', () => {
    const clienteData = {
      nombre: 'Juan',
      apellidos: 'Pérez',
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      telefono: '999999999',
    };

    it('debe actualizar un cliente correctamente', async () => {
      const mockCliente = {
        id: 'cliente-1',
        ...clienteData,
        updatedAt: new Date(),
      };

      prisma.clientes.findUnique.mockResolvedValue(mockCliente);
      prisma.clientes.update.mockResolvedValue({
        ...mockCliente,
        nombre: 'Juan Carlos',
      });

      const result = await updateCliente('cliente-1', {
        ...clienteData,
        nombre: 'Juan Carlos',
      });

      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Juan Carlos');
    });

    it('debe retornar error si el cliente no existe', async () => {
      prisma.clientes.findUnique.mockResolvedValue(null);

      const result = await updateCliente('cliente-inexistente', clienteData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('no encontrado');
    });
  });
});
