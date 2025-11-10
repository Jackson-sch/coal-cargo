"use server";

import { prisma } from "@/lib/prisma";
import {
  VehiculoCreateSchema,
  VehiculoUpdateSchema,
  VehiculoSearchSchema,
} from "@/lib/validaciones-zod";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { handleServerActionError, logError } from "@/lib/utils/error-handler";

// Obtener conductores disponibles (sin vehículo asignado)
export async function getConductoresDisponibles(vehiculoIdExcluir = null) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    // Obtener todos los conductores
    const todosConductores = await prisma.usuarios.findMany({
      where: {
        role: "CONDUCTOR",
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        sucursales: {
          select: {
            id: true,
            nombre: true,
          },
        },
        vehiculos: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Filtrar conductores que no tienen vehículo asignado o que tienen el vehículo que estamos editando
    const conductoresDisponibles = todosConductores.filter((conductor) => {
      // Si no tiene vehículos asignados, está disponible
      if (!conductor.vehiculos || conductor.vehiculos.length === 0) {
        return true;
      }
      // Si estamos editando y el conductor tiene este vehículo asignado, está disponible
      if (vehiculoIdExcluir && conductor.vehiculos.some(v => v.id === vehiculoIdExcluir)) {
        return true;
      }
      return false;
    });

    // Limpiar la relación vehiculos del resultado y mapear sucursales
    const conductoresLimpios = conductoresDisponibles.map(({ vehiculos, sucursales, ...rest }) => ({
      ...rest,
      sucursal: sucursales ? {
        id: sucursales.id,
        nombre: sucursales.nombre,
      } : null,
    }));

    return {
      success: true,
      data: conductoresLimpios,
    };
  } catch (error) {
    logError(error, { context: "getConductoresDisponibles" });
    return handleActionError(error);
  }
}

// Función auxiliar para verificar permisos
async function checkPermissions(requiredRoles = []) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(session.user.role)) {
    throw new Error("Permisos insuficientes");
  }

  return session.user;
}

// Función auxiliar para manejar errores
function handleActionError(error) {
  const result = handleServerActionError(error);
  
  if (error.name === "ZodError") {
    const firstError = error.errors?.[0];
    const errorPath = firstError?.path?.join(".") || "";
    
    return {
      ...result,
      details: error.errors,
      field: errorPath,
    };
  }

  return result;
}

// Obtener lista de vehículos con filtros
export async function getVehiculos(searchParams = {}) {
  try {
    const user = await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    // Filtrar parámetros undefined antes de la validación
    const cleanParams = Object.fromEntries(
      Object.entries(searchParams).filter(([_, value]) => value !== undefined)
    );

    const validatedParams = VehiculoSearchSchema.parse(cleanParams);
    const { q, estado, sucursalId, conductorId, tipoVehiculo, page, limit } =
      validatedParams;

    const where = {
      deletedAt: null, // Solo vehículos no eliminados
    };

    // Filtro automático por sucursal para ADMIN_SUCURSAL
    if (user.role === "ADMIN_SUCURSAL" && user.sucursalId) {
      // ADMIN_SUCURSAL solo puede ver vehículos de su sucursal
      where.sucursalId = user.sucursalId;
    } else if (user.role === "SUPER_ADMIN" && sucursalId) {
      // SUPER_ADMIN puede filtrar por sucursal si lo especifica
      where.sucursalId = sucursalId;
    }

    // Filtro de estado
    if (estado && estado !== "all") {
      where.estado = estado;
    }

    // Filtro de conductor
    if (conductorId) {
      where.conductorId = conductorId;
    }

    // Filtro de tipo de vehículo
    if (tipoVehiculo) {
      where.tipoVehiculo = tipoVehiculo;
    }

    // Búsqueda por texto (combinar con filtros existentes)
    if (q) {
      const searchConditions = [
        { placa: { contains: q, mode: "insensitive" } },
        { marca: { contains: q, mode: "insensitive" } },
        { modelo: { contains: q, mode: "insensitive" } },
      ];
      
      // Si ya hay condiciones en where, usar AND
      if (where.OR || Object.keys(where).length > 1) {
        const baseWhere = { ...where };
        delete baseWhere.OR;
        where.AND = [
          ...Object.entries(baseWhere).map(([key, value]) => ({ [key]: value })),
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [vehiculos, total] = await Promise.all([
      prisma.vehiculos.findMany({
        where,
        include: {
          sucursal: {
            select: {
              id: true,
              nombre: true,
            },
          },
          usuarios: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              envios: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vehiculos.count({ where }),
    ]);

    return {
      success: true,
      data: vehiculos,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
    };
  } catch (error) {
    logError(error, { context: "getVehiculos", searchParams });
    return handleActionError(error);
  }
}

// Obtener vehículo por ID
export async function getVehiculoById(id) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    const vehiculo = await prisma.vehiculos.findUnique({
      where: { id, deletedAt: null },
      include: {
        sucursal: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            provincia: true,
          },
        },
        usuarios: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        envios: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            cliente: {
              select: {
                id: true,
                nombre: true,
                apellidos: true,
                razonSocial: true,
              },
            },
          },
        },
      },
    });

    if (!vehiculo) {
      return {
        success: false,
        error: "Vehículo no encontrado",
      };
    }

    return {
      success: true,
      data: vehiculo,
    };
  } catch (error) {
    logError(error, { context: "getVehiculoById", id });
    return handleActionError(error);
  }
}

// Crear nuevo vehículo
export async function createVehiculo(formData) {
  try {
    const user = await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    const validatedData = VehiculoCreateSchema.parse(formData);

    // Si es ADMIN_SUCURSAL, asegurar que el vehículo se asigne a su sucursal
    if (user.role === "ADMIN_SUCURSAL" && user.sucursalId) {
      // Validar que el vehículo se asigne a su sucursal
      if (validatedData.sucursalId && validatedData.sucursalId !== user.sucursalId) {
        return {
          success: false,
          error: "No puedes asignar vehículos a otras sucursales",
        };
      }
      // Forzar la asignación a su sucursal
      validatedData.sucursalId = user.sucursalId;
    }

    // Verificar si la placa ya existe
    const existingVehiculo = await prisma.vehiculos.findFirst({
      where: {
        placa: validatedData.placa,
        deletedAt: null,
      },
    });

    if (existingVehiculo) {
      return {
        success: false,
        error: "Ya existe un vehículo con esta placa",
        field: "placa",
      };
    }

    // Verificar que el conductor no esté asignado a otro vehículo
    if (validatedData.conductorId) {
      const vehiculoConConductor = await prisma.vehiculos.findFirst({
        where: {
          conductorId: validatedData.conductorId,
          deletedAt: null,
        },
      });

      if (vehiculoConConductor) {
        return {
          success: false,
          error: "Este conductor ya está asignado a otro vehículo",
          field: "conductorId",
        };
      }
    }

    // Preparar datos para crear
    const vehiculoData = {
      placa: validatedData.placa,
      marca: validatedData.marca || null,
      modelo: validatedData.modelo || null,
      año: validatedData.año || null,
      pesoMaximo: validatedData.pesoMaximo,
      volumenMaximo: validatedData.volumenMaximo || null,
      tipoVehiculo: validatedData.tipoVehiculo || null,
      estado: validatedData.estado || "DISPONIBLE",
      sucursalId: validatedData.sucursalId || null,
      conductorId: validatedData.conductorId || null,
      soat: validatedData.soat ? new Date(validatedData.soat) : null,
      revision: validatedData.revision ? new Date(validatedData.revision) : null,
      observaciones: validatedData.observaciones || null,
      // Mantener compatibilidad con campo capacidad
      capacidad: validatedData.pesoMaximo,
    };

    const vehiculo = await prisma.vehiculos.create({
      data: vehiculoData,
      include: {
        sucursal: {
          select: {
            id: true,
            nombre: true,
          },
        },
        usuarios: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/vehiculos");

    return {
      success: true,
      data: vehiculo,
      message: "Vehículo creado correctamente",
    };
  } catch (error) {
    logError(error, { context: "createVehiculo", formData });
    return handleActionError(error);
  }
}

// Actualizar vehículo
export async function updateVehiculo(id, formData) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    const validatedData = VehiculoUpdateSchema.parse(formData);

    // Verificar que el vehículo existe
    const existingVehiculo = await prisma.vehiculos.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingVehiculo) {
      return {
        success: false,
        error: "Vehículo no encontrado",
      };
    }

    // Verificar si la placa ya existe en otro vehículo
    if (validatedData.placa && validatedData.placa !== existingVehiculo.placa) {
      const vehiculoConPlaca = await prisma.vehiculos.findFirst({
        where: {
          placa: validatedData.placa,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (vehiculoConPlaca) {
        return {
          success: false,
          error: "Ya existe otro vehículo con esta placa",
          field: "placa",
        };
      }
    }

    // Verificar que el conductor no esté asignado a otro vehículo
    if (validatedData.conductorId && validatedData.conductorId !== existingVehiculo.conductorId) {
      const vehiculoConConductor = await prisma.vehiculos.findFirst({
        where: {
          conductorId: validatedData.conductorId,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (vehiculoConConductor) {
        return {
          success: false,
          error: "Este conductor ya está asignado a otro vehículo",
          field: "conductorId",
        };
      }
    }

    // Preparar datos para actualizar
    const updateData = {};
    if (validatedData.placa !== undefined) updateData.placa = validatedData.placa;
    if (validatedData.marca !== undefined) updateData.marca = validatedData.marca;
    if (validatedData.modelo !== undefined) updateData.modelo = validatedData.modelo;
    if (validatedData.año !== undefined) updateData.año = validatedData.año;
    if (validatedData.pesoMaximo !== undefined) {
      updateData.pesoMaximo = validatedData.pesoMaximo;
      updateData.capacidad = validatedData.pesoMaximo; // Mantener compatibilidad
    }
    if (validatedData.volumenMaximo !== undefined) updateData.volumenMaximo = validatedData.volumenMaximo;
    if (validatedData.tipoVehiculo !== undefined) updateData.tipoVehiculo = validatedData.tipoVehiculo;
    if (validatedData.estado !== undefined) updateData.estado = validatedData.estado;
    if (validatedData.sucursalId !== undefined) updateData.sucursalId = validatedData.sucursalId;
    if (validatedData.conductorId !== undefined) updateData.conductorId = validatedData.conductorId;
    if (validatedData.soat !== undefined) {
      updateData.soat = validatedData.soat ? new Date(validatedData.soat) : null;
    }
    if (validatedData.revision !== undefined) {
      updateData.revision = validatedData.revision ? new Date(validatedData.revision) : null;
    }
    if (validatedData.observaciones !== undefined) updateData.observaciones = validatedData.observaciones;

    const vehiculo = await prisma.vehiculos.update({
      where: { id },
      data: updateData,
      include: {
        sucursal: {
          select: {
            id: true,
            nombre: true,
          },
        },
        usuarios: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/vehiculos");

    return {
      success: true,
      data: vehiculo,
      message: "Vehículo actualizado correctamente",
    };
  } catch (error) {
    logError(error, { context: "updateVehiculo", id, formData });
    return handleActionError(error);
  }
}

// Eliminar vehículo (soft delete)
export async function deleteVehiculo(id) {
  try {
    const user = await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    // Verificar que el vehículo existe y pertenece a la sucursal del usuario (si es ADMIN_SUCURSAL)
    const vehiculo = await prisma.vehiculos.findUnique({
      where: { id },
      select: { sucursalId: true, estado: true },
    });

    if (!vehiculo) {
      return {
        success: false,
        error: "Vehículo no encontrado",
      };
    }

    // Si es ADMIN_SUCURSAL, validar que el vehículo pertenezca a su sucursal
    if (user.role === "ADMIN_SUCURSAL" && user.sucursalId) {
      if (vehiculo.sucursalId !== user.sucursalId) {
        return {
          success: false,
          error: "No tienes permisos para eliminar este vehículo",
        };
      }
    }

    // Obtener información completa del vehículo para validar envíos
    const vehiculoCompleto = await prisma.vehiculos.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            envios: true,
          },
        },
      },
    });

    // Verificar si el vehículo tiene envíos activos
    const vehiculoCompleto = await prisma.vehiculos.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            envios: true,
          },
        },
      },
    });

    if (!vehiculoCompleto) {
      return {
        success: false,
        error: "Vehículo no encontrado",
      };
    }

    if (vehiculoCompleto._count.envios > 0) {
      const enviosActivos = await prisma.envios.count({
        where: {
          vehiculoId: id,
          estado: {
            in: ["REGISTRADO", "EN_BODEGA", "EN_TRANSITO", "EN_REPARTO"],
          },
        },
      });

      if (enviosActivos > 0) {
        return {
          success: false,
          error: "No se puede eliminar el vehículo porque tiene envíos activos",
        };
      }
    }

    // Soft delete
    await prisma.vehiculos.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        estado: "INACTIVO",
      },
    });

    revalidatePath("/dashboard/vehiculos");
    logError(null, { context: "deleteVehiculo", vehiculoId: id }, "info");

    return {
      success: true,
      message: "Vehículo eliminado correctamente",
    };
  } catch (error) {
    logError(error, { context: "deleteVehiculo", id });
    return handleActionError(error);
  }
}

// Obtener estadísticas de vehículos
export async function getEstadisticasVehiculos() {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    const [
      total,
      disponibles,
      enRuta,
      enMantenimiento,
      inactivos,
      porSucursal,
    ] = await Promise.all([
      prisma.vehiculos.count({ where: { deletedAt: null } }),
      prisma.vehiculos.count({
        where: { estado: "DISPONIBLE", deletedAt: null },
      }),
      prisma.vehiculos.count({
        where: { estado: "EN_RUTA", deletedAt: null },
      }),
      prisma.vehiculos.count({
        where: { estado: "MANTENIMIENTO", deletedAt: null },
      }),
      prisma.vehiculos.count({
        where: { estado: "INACTIVO", deletedAt: null },
      }),
      prisma.vehiculos.groupBy({
        by: ["sucursalId"],
        where: { deletedAt: null },
        _count: true,
      }),
    ]);

    return {
      success: true,
      data: {
        total,
        disponibles,
        enRuta,
        enMantenimiento,
        inactivos,
        porSucursal,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Obtener vehículos disponibles para asignación
export async function getVehiculosDisponibles(sucursalId = null) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    const where = {
      estado: "DISPONIBLE",
      deletedAt: null,
    };

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    const vehiculos = await prisma.vehiculos.findMany({
      where,
      select: {
        id: true,
        placa: true,
        marca: true,
        modelo: true,
        pesoMaximo: true,
        volumenMaximo: true,
        tipoVehiculo: true,
        sucursal: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { placa: "asc" },
    });

    return {
      success: true,
      data: vehiculos,
    };
  } catch (error) {
    logError(error, { context: "getVehiculosDisponibles", sucursalId });
    return handleActionError(error);
  }
}

// Actualizar estado de vehículo
export async function updateEstadoVehiculo(id, nuevoEstado) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    const estadosValidos = ["DISPONIBLE", "EN_RUTA", "MANTENIMIENTO", "INACTIVO"];
    if (!estadosValidos.includes(nuevoEstado)) {
      return {
        success: false,
        error: "Estado inválido",
      };
    }

    const vehiculo = await prisma.vehiculos.findUnique({
      where: { id, deletedAt: null },
    });

    if (!vehiculo) {
      return {
        success: false,
        error: "Vehículo no encontrado",
      };
    }

    const vehiculoActualizado = await prisma.vehiculos.update({
      where: { id },
      data: { estado: nuevoEstado },
    });

    revalidatePath("/dashboard/vehiculos");
    logError(null, { context: "updateEstadoVehiculo", vehiculoId: id, nuevoEstado }, "info");

    return {
      success: true,
      data: vehiculoActualizado,
      message: "Estado del vehículo actualizado correctamente",
    };
  } catch (error) {
    logError(error, { context: "updateEstadoVehiculo", id, nuevoEstado });
    return handleActionError(error);
  }
}

