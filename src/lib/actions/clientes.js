"use server";

import { prisma } from "@/lib/prisma";
import {
  ClienteCreateSchemaCustom,
  ClienteSearchSchema,
  ClienteUpdateSchema,
} from "@/lib/validaciones-zod";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { validarDocumentoPeruano } from "../utils/documentos.js";

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
  if (error.name === "ZodError") {
    return {
      success: false,
      error: "Datos inválidos",
      details: error.errors,
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: false,
    error: "Error interno del servidor",
  };
}

// Obtener lista de clientes con filtros
export async function getClientes(searchParams = {}) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    // Filtrar parámetros undefined antes de la validación
    const cleanParams = Object.fromEntries(
      Object.entries(searchParams).filter(([_, value]) => value !== undefined)
    );

    const validatedParams = ClienteSearchSchema.parse(cleanParams);
    const { q, tipoDocumento, numeroDocumento, estado, page, limit } =
      validatedParams;

    const where = {};

    // Manejar el filtro de estado correctamente con soft delete
    if (estado !== undefined) {
      if (estado === "all") {
        // Mostrar todos los clientes no eliminados
        where.deletedAt = null;
      } else if (estado === "active") {
        where.estado = true;
        where.deletedAt = null;
      } else if (estado === "inactive") {
        // Mostrar solo inactivos, excluyendo eliminados
        where.estado = false;
        where.deletedAt = null;
      } else if (estado === "deleted") {
        where.deletedAt = { not: null }; // Solo eliminados
      } else if (typeof estado === "boolean") {
        where.estado = estado;
        where.deletedAt = null;
      }
    } else {
      // Por defecto, mostrar solo clientes activos
      where.estado = true;
      where.deletedAt = null;
    }

    if (q) {
      // Si ya existe where.OR (del filtro inactive), necesitamos combinarlo
      const searchConditions = [
        { nombre: { contains: q, mode: "insensitive" } },
        { apellidos: { contains: q, mode: "insensitive" } },
        { razonSocial: { contains: q, mode: "insensitive" } },
        { numeroDocumento: { contains: q } },
        { email: { contains: q, mode: "insensitive" } },
      ];

      if (where.OR) {
        // Si ya hay condiciones OR, las combinamos con AND
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    if (tipoDocumento) where.tipoDocumento = tipoDocumento;
    if (numeroDocumento) where.numeroDocumento = { contains: numeroDocumento };

    const [clientes, total] = await Promise.all([
      prisma.clientes.findMany({
        where,
        include: {
          distrito: {
            include: {
              provincia: {
                include: {
                  departamento: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.clientes.count({ where }),
    ]);

    return {
      success: true,
      data: clientes,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Obtener cliente por ID
export async function getClienteById(id) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    const cliente = await prisma.clientes.findUnique({
      where: { id },
      include: {
        distrito: {
          include: {
            provincia: {
              include: {
                departamento: true,
              },
            },
          },
        },
        envios: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!cliente) {
      return {
        success: false,
        error: "Cliente no encontrado",
      };
    }

    return {
      success: true,
      data: cliente,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Crear nuevo cliente
export async function createCliente(formData) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    const validatedData = ClienteCreateSchemaCustom.parse(formData);

    // Normalizar y validar documento
    const tipoDoc = validatedData.tipoDocumento;
    const numeroDoc = String(validatedData.numeroDocumento).trim();

    // Verificar si el documento ya existe (cliente activo)
    const existingCliente = await prisma.clientes.findFirst({
      where: {
        numeroDocumento: numeroDoc,
        deletedAt: null,
      },
    });

    // Si es RUC, también verificar por campo ruc
    let duplicateRuc = null;
    if (tipoDoc === "RUC") {
      duplicateRuc = await prisma.clientes.findFirst({
        where: {
          ruc: numeroDoc,
          deletedAt: null,
        },
      });
    }

    if (existingCliente || duplicateRuc) {
      return {
        success: false,
        error: "Ya existe un cliente activo con este número de documento",
      };
    }

    const cliente = await prisma.clientes.create({
      data: {
        ...validatedData,
        numeroDocumento: numeroDoc,
        esEmpresa: tipoDoc === "RUC" ? true : validatedData.esEmpresa || false,
        ruc: tipoDoc === "RUC" ? numeroDoc : null,
      },
      include: {
        distrito: {
          include: {
            provincia: {
              include: {
                departamento: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/dashboard/clientes");

    return {
      success: true,
      data: cliente,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Actualizar cliente
export async function updateCliente(id, formData) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    const validatedData = ClienteUpdateSchema.parse(formData);

    // Verificar si el cliente existe
    const existingCliente = await prisma.clientes.findUnique({
      where: { id },
    });

    if (!existingCliente) {
      return {
        success: false,
        error: "Cliente no encontrado",
      };
    }

    // Si se está actualizando el número de documento, verificar formato y duplicados
    if (
      validatedData.numeroDocumento &&
      validatedData.numeroDocumento !== existingCliente.numeroDocumento
    ) {
      const numeroDoc = String(validatedData.numeroDocumento).trim();
      const tipoDoc =
        validatedData.tipoDocumento || existingCliente.tipoDocumento;

      // Validación centralizada
      const docValido = validarDocumentoPeruano(tipoDoc, numeroDoc);
      if (!docValido) {
        return {
          success: false,
          error: "Número de documento inválido para el tipo seleccionado",
        };
      }

      const duplicateCliente = await prisma.clientes.findFirst({
        where: {
          numeroDocumento: numeroDoc,
          deletedAt: null,
          NOT: { id },
        },
      });

      let duplicateRuc = null;
      if (tipoDoc === "RUC") {
        duplicateRuc = await prisma.clientes.findFirst({
          where: {
            ruc: numeroDoc,
            deletedAt: null,
            NOT: { id },
          },
        });
      }

      if (duplicateCliente || duplicateRuc) {
        return {
          success: false,
          error: "Ya existe otro cliente activo con este número de documento",
        };
      }
    }

    const tipoDocFinal =
      validatedData.tipoDocumento || existingCliente.tipoDocumento;
    const numeroDocFinal = validatedData.numeroDocumento
      ? String(validatedData.numeroDocumento).trim()
      : existingCliente.numeroDocumento;

    const cliente = await prisma.clientes.update({
      where: { id },
      data: {
        ...validatedData,
        numeroDocumento: validatedData.numeroDocumento
          ? numeroDocFinal
          : undefined,
        esEmpresa:
          tipoDocFinal === "RUC"
            ? true
            : typeof validatedData.esEmpresa !== "undefined"
            ? validatedData.esEmpresa
            : undefined,
        ruc: tipoDocFinal === "RUC" ? numeroDocFinal : null,
      },
      include: {
        distrito: {
          include: {
            provincia: {
              include: {
                departamento: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/dashboard/clientes");
    revalidatePath(`/dashboard/clientes/${id}`);

    return {
      success: true,
      data: cliente,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Buscar cliente por número de documento (DNI o RUC)
export async function getClienteByDocumento(numeroDocumento) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    const raw =
      typeof numeroDocumento === "string"
        ? numeroDocumento.trim()
        : String(numeroDocumento || "").trim();

    if (!raw) {
      return {
        success: false,
        error: "Número de documento requerido",
      };
    }

    const rucValido = validarDocumentoPeruano("RUC", raw);
    const dniValido = validarDocumentoPeruano("DNI", raw);

    if (!rucValido && !dniValido) {
      return {
        success: false,
        error:
          "Formato de documento inválido (DNI 8 dígitos, RUC 11 dígitos válido)",
      };
    }

    const where = rucValido
      ? { ruc: raw, deletedAt: null }
      : { numeroDocumento: raw, deletedAt: null };

    const cliente = await prisma.clientes.findFirst({
      where,
      include: {
        distrito: {
          include: {
            provincia: {
              include: {
                departamento: true,
              },
            },
          },
        },
      },
    });

    if (!cliente) {
      return {
        success: false,
        error: "Cliente no encontrado",
      };
    }

    return {
      success: true,
      data: cliente,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Obtener clientes simples (para selects)
export async function getClientesSimple() {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    const clientes = await prisma.clientes.findMany({
      where: { estado: true, deletedAt: null },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        razonSocial: true,
        numeroDocumento: true,
        tipoDocumento: true,
        esEmpresa: true,
      },
      orderBy: [{ nombre: "asc" }, { apellidos: "asc" }],
    });

    return {
      success: true,
      data: clientes,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Obtener historial del cliente
export async function getClienteHistorial(searchParams = {}) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    const {
      clienteId,
      tipo = "todos",
      estado,
      fechaDesde,
      fechaHasta,
      busqueda,
      page = 1,
      limit = 20,
    } = searchParams;

    if (!clienteId) {
      return {
        success: false,
        error: "ID de cliente requerido",
      };
    }

    // Verificar que el cliente existe
    const cliente = await prisma.clientes.findUnique({
      where: { id: clienteId },
      include: {
        distrito: {
          include: {
            provincia: {
              include: {
                departamento: true,
              },
            },
          },
        },
      },
    });

    if (!cliente) {
      return {
        success: false,
        error: "Cliente no encontrado",
      };
    }

    const skip = (page - 1) * limit;
    let historialData = [];

    // Construir filtros de fecha
    const fechaFilter = {};
    if (fechaDesde) {
      fechaFilter.gte = new Date(fechaDesde);
    }
    if (fechaHasta) {
      const fechaHastaDate = new Date(fechaHasta);
      fechaHastaDate.setHours(23, 59, 59, 999);
      fechaFilter.lte = fechaHastaDate;
    }

    // Obtener envíos si se solicita
    if (tipo === "todos" || tipo === "envios") {
      const enviosFilter = {
        clienteId: clienteId,
        deletedAt: null,
      };

      if (estado) {
        enviosFilter.estado = estado;
      }

      if (Object.keys(fechaFilter).length > 0) {
        enviosFilter.fechaRegistro = fechaFilter;
      }

      if (busqueda) {
        enviosFilter.OR = [
          { guia: { contains: busqueda, mode: "insensitive" } },
          { descripcion: { contains: busqueda, mode: "insensitive" } },
          { destinatarioNombre: { contains: busqueda, mode: "insensitive" } },
        ];
      }

      const envios = await prisma.envios.findMany({
        where: enviosFilter,
        include: {
          sucursalOrigen: true,
          sucursalDestino: true,
          eventos_envio: {
            orderBy: { fechaEvento: "desc" },
            take: 1,
          },
        },
        orderBy: { fechaRegistro: "desc" },
      });

      const enviosHistorial = envios.map((envio) => ({
        ...envio,
        tipo: "envio",
        identificador: envio.guia,
        fechaPrincipal: envio.fechaRegistro,
      }));

      historialData = [...historialData, ...enviosHistorial];
    }

    // Ordenar todo el historial por fecha
    historialData.sort(
      (a, b) => new Date(b.fechaPrincipal) - new Date(a.fechaPrincipal)
    );

    // Aplicar paginación
    const totalItems = historialData.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginatedData = historialData.slice(skip, skip + limit);

    return {
      success: true,
      data: paginatedData,
      total: totalItems,
      totalPages,
      currentPage: page,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        apellidos: cliente.apellidos,
        numeroDocumento: cliente.numeroDocumento,
        tipoDocumento: cliente.tipoDocumento,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        esEmpresa: cliente.esEmpresa,
        razonSocial: cliente.razonSocial,
        ruc: cliente.ruc,
        distrito: cliente.distrito,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Eliminar cliente (Soft Delete)
export async function deleteCliente(id) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    const existingCliente = await prisma.clientes.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingCliente) {
      return {
        success: false,
        error: "Cliente no encontrado o ya eliminado",
      };
    }

    const deletedCliente = await prisma.clientes.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        estado: false,
      },
    });

    revalidatePath("/dashboard/clientes");

    return {
      success: true,
      data: deletedCliente,
      message: "Cliente eliminado correctamente",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Eliminar cliente físicamente (Hard Delete)
export async function hardDeleteCliente(id) {
  try {
    await checkPermissions(["SUPER_ADMIN"]);

    const existingCliente = await prisma.clientes.findUnique({
      where: { id },
      include: {
        envios: true,
      },
    });

    if (!existingCliente) {
      return {
        success: false,
        error: "Cliente no encontrado",
      };
    }

    if (existingCliente.envios.length > 0) {
      return {
        success: false,
        error:
          "No se puede eliminar físicamente el cliente porque tiene envíos asociados",
      };
    }

    await prisma.clientes.delete({
      where: { id },
    });

    revalidatePath("/dashboard/clientes");

    return {
      success: true,
      message: "Cliente eliminado físicamente",
    };
  } catch (error) {
    return handleActionError(error);
  }
}
// Cambiar estado del cliente (activar/desactivar)
export async function toggleClienteEstado(id) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    const existingCliente = await prisma.clientes.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingCliente) {
      return {
        success: false,
        error: "Cliente no encontrado",
      };
    }

    const updatedCliente = await prisma.clientes.update({
      where: { id },
      data: {
        estado: !existingCliente.estado,
      },
    });

    revalidatePath("/dashboard/clientes");

    return {
      success: true,
      data: updatedCliente,
      message: `Cliente ${
        updatedCliente.estado ? "activado" : "desactivado"
      } correctamente`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Reactivar cliente inactivo
export async function reactivateCliente(id) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL"]);

    const existingCliente = await prisma.clientes.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingCliente) {
      return {
        success: false,
        error: "Cliente no encontrado",
      };
    }

    const updatedCliente = await prisma.clientes.update({
      where: { id },
      data: {
        estado: true,
      },
    });

    revalidatePath("/dashboard/clientes");

    return {
      success: true,
      data: updatedCliente,
      message: "Cliente reactivado correctamente",
    };
  } catch (error) {
    return handleActionError(error);
  }
}
// Función para registrar cliente automáticamente desde formulario de envío
export async function registrarClienteAutomatico(datosCliente) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    const {
      nombre,
      tipoDocumento = "DNI",
      numeroDocumento,
      telefono,
      email,
      direccion,
      esRemitente = false,
    } = datosCliente;

    // Validar datos mínimos
    if (!nombre || !nombre.trim()) {
      return {
        success: false,
        error: "El nombre es requerido",
      };
    }

    // Si tiene documento, verificar que no exista ya
    if (numeroDocumento && numeroDocumento.trim()) {
      const existente = await prisma.clientes.findFirst({
        where: {
          numeroDocumento: numeroDocumento.trim(),
          deletedAt: null,
        },
      });

      if (existente) {
        return {
          success: true,
          data: existente,
          message: "Cliente ya existe",
        };
      }
    }

    // Determinar si es empresa basado en el tipo de documento
    const esEmpresa = tipoDocumento === "RUC";

    // Preparar datos para crear el cliente
    const datosNuevoCliente = {
      nombre: nombre.trim(),
      tipoDocumento,
      numeroDocumento:
        numeroDocumento?.trim() ||
        `TEMP_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      telefono: telefono?.trim() || "",
      email: email?.trim() || null,
      direccion: direccion?.trim() || null,
      esEmpresa,
      ruc: esEmpresa ? numeroDocumento?.trim() || null : null,
      razonSocial: esEmpresa ? nombre.trim() : null,
      // Campos adicionales para tracking
      creadoDesdeEnvio: true,
      tipoRegistro: esRemitente ? "REMITENTE" : "DESTINATARIO",
    };

    // Crear el cliente
    const nuevoCliente = await prisma.clientes.create({
      data: datosNuevoCliente,
    });

    return {
      success: true,
      data: nuevoCliente,
      message: "Cliente registrado automáticamente",
    };
  } catch (error) {
    console.error("Error al registrar cliente automático:", error);
    return {
      success: false,
      error: "Error interno del servidor",
    };
  }
}
