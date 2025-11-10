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

import { handleServerActionError, logError } from "@/lib/utils/error-handler";

// Función auxiliar para manejar errores
function handleActionError(error) {
  // Usar el sistema centralizado de manejo de errores
  const result = handleServerActionError(error);
  
  // Mantener compatibilidad con el formato existente
  if (error.name === "ZodError") {
    // Extraer el primer error relevante con su mensaje
    const firstError = error.errors?.[0];
    const errorPath = firstError?.path?.join(".") || "";
    
    return {
      ...result,
      details: error.errors,
      field: errorPath, // Agregar el campo que falló
    };
  }

  return result;
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
        // Mostrar solo inactivos (incluye los desactivados con soft delete)
        where.estado = false;
        // No excluimos deletedAt para incluir también los desactivados permanentemente
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

    // Verificar si existe un cliente eliminado con estos datos (para sugerir restauración)
    const deletedCliente = await prisma.clientes.findFirst({
      where: {
        numeroDocumento: numeroDoc,
        deletedAt: { not: null },
      },
      select: { id: true, nombre: true, apellidos: true, razonSocial: true, deletedAt: true },
    });

    // Si es RUC, también verificar por campo ruc en clientes eliminados
    let deletedRuc = null;
    if (tipoDoc === "RUC") {
      deletedRuc = await prisma.clientes.findFirst({
        where: {
          ruc: numeroDoc,
          deletedAt: { not: null },
        },
        select: { id: true, nombre: true, apellidos: true, razonSocial: true, deletedAt: true },
      });
    }

    if (deletedCliente || deletedRuc) {
      const clienteEliminado = deletedCliente || deletedRuc;
      const nombreCliente = clienteEliminado.razonSocial || 
        `${clienteEliminado.nombre} ${clienteEliminado.apellidos || ""}`.trim();
      const fechaEliminacion = clienteEliminado.deletedAt 
        ? new Date(clienteEliminado.deletedAt).toLocaleDateString("es-PE")
        : "fecha desconocida";
      
      return {
        success: false,
        error: `Ya existe un cliente eliminado con este número de documento (${nombreCliente}, eliminado el ${fechaEliminacion}). Puedes restaurarlo desde la sección de clientes eliminados.`,
        clienteEliminadoId: clienteEliminado.id,
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

// Obtener estadísticas de clientes
export async function getEstadisticasClientes() {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    // Obtener estadísticas agregadas
    const [
      totalClientes,
      activos,
      inactivos,
      empresas,
      personasNaturales,
      nuevosEsteMes,
    ] = await Promise.all([
      // Total de clientes (no eliminados)
      prisma.clientes.count({
        where: { deletedAt: null },
      }),
      // Clientes activos
      prisma.clientes.count({
        where: { estado: true, deletedAt: null },
      }),
      // Clientes inactivos (incluye los desactivados con soft delete)
      prisma.clientes.count({
        where: { estado: false },
      }),
      // Empresas
      prisma.clientes.count({
        where: { esEmpresa: true, deletedAt: null },
      }),
      // Personas naturales
      prisma.clientes.count({
        where: { esEmpresa: false, deletedAt: null },
      }),
      // Nuevos este mes
      prisma.clientes.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalClientes,
        activos,
        inactivos,
        empresas,
        personasNaturales,
        nuevosEsteMes,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Obtener clientes simples (para selects)
export async function getClientesSimple(searchQuery = "", limit = 50) {
  try {
    await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

    const where = { estado: true, deletedAt: null };

    // Si hay búsqueda, agregar filtros
    if (searchQuery?.trim()) {
      const q = searchQuery.trim();
      where.OR = [
        { nombre: { contains: q, mode: "insensitive" } },
        { apellidos: { contains: q, mode: "insensitive" } },
        { razonSocial: { contains: q, mode: "insensitive" } },
        { numeroDocumento: { contains: q } },
      ];
    }

    const clientes = await prisma.clientes.findMany({
      where,
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
      take: limit,
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
    const user = await checkPermissions(["SUPER_ADMIN", "ADMIN_SUCURSAL", "OPERADOR"]);

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

    // Log para debugging
    console.log("🔍 getClienteHistorial - clienteId:", clienteId);
    console.log("🔍 getClienteHistorial - filtros:", { tipo, estado, fechaDesde, fechaHasta, busqueda });
    console.log("🔍 getClienteHistorial - usuario:", user.role, user.sucursalId);

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
      console.log("❌ Cliente no encontrado con ID:", clienteId);
      return {
        success: false,
        error: "Cliente no encontrado",
      };
    }

    console.log("✅ Cliente encontrado:", cliente.nombre, cliente.apellidos);

    const skip = (page - 1) * limit;
    let historialData = [];
    
    // Construir filtro de sucursal si el usuario no es SUPER_ADMIN
    const sucursalFilter = user.role !== "SUPER_ADMIN" && user.sucursalId 
      ? {
          OR: [
            { sucursalOrigenId: user.sucursalId },
            { sucursalDestinoId: user.sucursalId },
          ],
        }
      : null;

    // Construir filtros de fecha
    const fechaFilter = {};
    if (fechaDesde && fechaDesde.trim() !== "") {
      const fechaDesdeDate = new Date(fechaDesde);
      fechaDesdeDate.setHours(0, 0, 0, 0);
      fechaFilter.gte = fechaDesdeDate;
    }
    if (fechaHasta && fechaHasta.trim() !== "") {
      const fechaHastaDate = new Date(fechaHasta);
      fechaHastaDate.setHours(23, 59, 59, 999);
      fechaFilter.lte = fechaHastaDate;
    }

    // Obtener envíos si se solicita
    if (tipo === "todos" || tipo === "envios") {
      // Construir filtro base
      const baseFilters = {
        clienteId: clienteId,
        deletedAt: null,
      };

      // Validar que el estado sea válido para envíos
      const estadosEnvioValidos = [
        "REGISTRADO",
        "EN_BODEGA",
        "EN_TRANSITO",
        "EN_AGENCIA_ORIGEN",
        "EN_AGENCIA_DESTINO",
        "EN_REPARTO",
        "ENTREGADO",
        "DEVUELTO",
        "ANULADO",
      ];
      if (
        estado &&
        estado !== "todos" &&
        estado.trim() !== "" &&
        estadosEnvioValidos.includes(estado)
      ) {
        baseFilters.estado = estado;
      }

      // Agregar filtro de fecha si existe
      if (Object.keys(fechaFilter).length > 0) {
        baseFilters.fechaRegistro = fechaFilter;
      }

      // Construir filtro final
      let enviosFilter;
      
      // Si hay búsqueda
      if (busqueda && busqueda.trim() !== "") {
        const searchConditions = [
          { guia: { contains: busqueda, mode: "insensitive" } },
          { descripcion: { contains: busqueda, mode: "insensitive" } },
          { destinatarioNombre: { contains: busqueda, mode: "insensitive" } },
        ];

        // Si hay filtro de sucursal, combinar todo con AND
        if (sucursalFilter) {
          enviosFilter = {
            clienteId: baseFilters.clienteId,
            deletedAt: baseFilters.deletedAt,
            AND: [
              sucursalFilter,
              { OR: searchConditions },
            ],
          };
          
          // Agregar otras condiciones al AND si existen
          if (baseFilters.estado) {
            enviosFilter.AND.push({ estado: baseFilters.estado });
          }
          if (baseFilters.fechaRegistro) {
            enviosFilter.AND.push({ fechaRegistro: baseFilters.fechaRegistro });
          }
        } else {
          // No hay filtro de sucursal, combinar normalmente
          enviosFilter = {
            AND: [
              baseFilters,
              { OR: searchConditions }
            ]
          };
        }
      } else {
        // Sin búsqueda
        if (sucursalFilter) {
          // Hay filtro de sucursal, combinarlo con AND
          enviosFilter = {
            clienteId: baseFilters.clienteId,
            deletedAt: baseFilters.deletedAt,
            AND: [sucursalFilter],
          };
          
          // Agregar otras condiciones al AND si existen
          if (baseFilters.estado) {
            enviosFilter.AND.push({ estado: baseFilters.estado });
          }
          if (baseFilters.fechaRegistro) {
            enviosFilter.AND.push({ fechaRegistro: baseFilters.fechaRegistro });
          }
        } else {
          // No hay filtro de sucursal, usar filtros base directamente
          enviosFilter = baseFilters;
        }
      }

      // Consultar envíos directamente desde la base de datos
      console.log("🔍 Consultando envíos con filtro:", JSON.stringify(enviosFilter, null, 2));
      
      const envios = await prisma.envios.findMany({
        where: enviosFilter,
        include: {
          sucursalOrigen: {
            select: {
              id: true,
              nombre: true,
              provincia: true,
              direccion: true,
            },
          },
          sucursalDestino: {
            select: {
              id: true,
              nombre: true,
              provincia: true,
              direccion: true,
            },
          },
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              razonSocial: true,
              numeroDocumento: true,
            },
          },
          eventos_envio: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { fechaRegistro: "desc" },
      });

      console.log(`📦 Envíos encontrados: ${envios.length}`);

      const enviosHistorial = envios.map((envio) => ({
        ...envio,
        tipo: "envio",
        identificador: envio.guia,
        fechaPrincipal: envio.fechaRegistro,
        // Mapear direcciones desde sucursales
        direccionOrigen: envio.sucursalOrigen?.direccion || envio.sucursalOrigen?.nombre || null,
        direccionDestino: envio.sucursalDestino?.direccion || envio.sucursalDestino?.nombre || null,
        // Mapear nombres de sucursales para compatibilidad
        sucursal_origen: envio.sucursalOrigen,
        sucursal_destino: envio.sucursalDestino,
        // Asegurar que numeroGuia esté disponible
        numeroGuia: envio.guia,
      }));

      historialData = [...historialData, ...enviosHistorial];
    }

    // Obtener cotizaciones si se solicita
    if (tipo === "todos" || tipo === "cotizaciones") {
      let cotizacionesFilter;

      // Construir filtro de búsqueda
      if (busqueda && busqueda.trim() !== "") {
        // Las cotizaciones no tienen guía, solo buscar en contenido y nombre
        // Cuando hay búsqueda, Prisma requiere que todos los filtros se combinen con AND
        const baseFilters = {
          clienteId: clienteId,
        };
        
        // Validar que el estado sea válido para cotizaciones
        const estadosCotizacionValidos = [
          "PENDIENTE",
          "APROBADA",
          "RECHAZADA",
          "CONVERTIDA_ENVIO",
          "EXPIRADA",
        ];
        if (
          estado &&
          estado !== "todos" &&
          estado.trim() !== "" &&
          estadosCotizacionValidos.includes(estado)
        ) {
          baseFilters.estado = estado;
        }
        
        if (Object.keys(fechaFilter).length > 0) {
          baseFilters.createdAt = fechaFilter;
        }

        const searchConditions = [
          { contenido: { contains: busqueda, mode: "insensitive" } },
          { nombreCliente: { contains: busqueda, mode: "insensitive" } },
        ];

        // Construir filtro con AND para combinar todos los filtros
        cotizacionesFilter = {
          AND: [
            baseFilters,
            { OR: searchConditions }
          ]
        };
      } else {
        // Sin búsqueda, usar filtros simples
        cotizacionesFilter = {
          clienteId: clienteId,
        };

        // Solo agregar filtro de estado si no es "todos" o está vacío
        // Validar que el estado sea válido para cotizaciones
        const estadosCotizacionValidos = [
          "PENDIENTE",
          "APROBADA",
          "RECHAZADA",
          "CONVERTIDA_ENVIO",
          "EXPIRADA",
        ];
        if (
          estado &&
          estado !== "todos" &&
          estado.trim() !== "" &&
          estadosCotizacionValidos.includes(estado)
        ) {
          cotizacionesFilter.estado = estado;
        }

        // Agregar filtro de fecha si existe
        if (Object.keys(fechaFilter).length > 0) {
          cotizacionesFilter.createdAt = fechaFilter;
        }
      }

      // Consultar cotizaciones directamente desde la base de datos
      console.log("🔍 Consultando cotizaciones con filtro:", JSON.stringify(cotizacionesFilter, null, 2));
      
      const cotizaciones = await prisma.cotizaciones.findMany({
        where: cotizacionesFilter,
        include: {
          sucursalOrigen: {
            select: {
              id: true,
              nombre: true,
              provincia: true,
            },
          },
          sucursalDestino: {
            select: {
              id: true,
              nombre: true,
              provincia: true,
            },
          },
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              razonSocial: true,
              numeroDocumento: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      console.log(`📋 Cotizaciones encontradas: ${cotizaciones.length}`);

      const cotizacionesHistorial = cotizaciones.map((cotizacion) => ({
        ...cotizacion,
        tipo: "cotizacion",
        identificador: cotizacion.id,
        fechaPrincipal: cotizacion.createdAt,
        total: cotizacion.precioFinal || 0,
      }));

      historialData = [...historialData, ...cotizacionesHistorial];
    }

    // Ordenar todo el historial por fecha
    historialData.sort(
      (a, b) => new Date(b.fechaPrincipal) - new Date(a.fechaPrincipal)
    );

    // Calcular estadísticas con TODOS los datos (sin paginación)
    const estadisticas = {
      totalEnvios: historialData.filter((item) => item.tipo === "envio").length,
      totalCotizaciones: historialData.filter((item) => item.tipo === "cotizacion").length,
      enviosEntregados: historialData.filter(
        (item) => item.tipo === "envio" && item.estado === "ENTREGADO"
      ).length,
      montoTotal: historialData.reduce(
        (sum, item) => sum + (item.total || item.precioFinal || 0),
        0
      ),
    };

    console.log(`📊 Estadísticas calculadas:`, estadisticas);
    console.log(`📊 Total items en historial: ${historialData.length}`);

    // Aplicar paginación
    const totalItems = historialData.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginatedData = historialData.slice(skip, skip + limit);

    console.log(`📄 Datos paginados: ${paginatedData.length} de ${totalItems}`);

    return {
      success: true,
      data: paginatedData,
      total: totalItems,
      totalPages,
      currentPage: page,
      estadisticas, // Devolver estadísticas calculadas con todos los datos
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

    // Buscar el cliente sin importar si tiene deletedAt o no
    const existingCliente = await prisma.clientes.findUnique({
      where: { id },
    });

    if (!existingCliente) {
      return {
        success: false,
        error: "Cliente no encontrado",
      };
    }

    // Reactivar: limpiar deletedAt y activar estado
    const updatedCliente = await prisma.clientes.update({
      where: { id },
      data: {
        estado: true,
        deletedAt: null, // Limpiar el soft delete
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
