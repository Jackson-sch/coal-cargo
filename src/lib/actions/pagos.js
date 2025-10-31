"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Listar pagos con filtros opcionales
 */
export async function getPagos(searchParams = {}) {
  try {
    const {
      envioId,
      clienteId,
      metodo,
      fechaDesde,
      fechaHasta,
      busqueda,
      page = 1,
      limit = 20,
    } = searchParams;

    const where = { deletedAt: null };

    if (envioId) where.envioId = envioId;

    if (clienteId) {
      // Filtrar por cliente a través de relación con envíos
      where.envios = { clienteId };
    }

    if (metodo && metodo !== "ALL") where.metodo = metodo;

    // Filtros de fecha
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) {
        const end = new Date(fechaHasta);
        end.setHours(23, 59, 59, 999);
        where.fecha.lte = end;
      }
    }

    // Búsqueda libre: referencia, método, guía de envío y nombre/razón social del cliente
    if (busqueda) {
      where.OR = [
        { referencia: { contains: busqueda, mode: "insensitive" } },
        { metodo: { contains: busqueda, mode: "insensitive" } },
        { envios: { guia: { contains: busqueda, mode: "insensitive" } } },
        {
          envios: {
            cliente: { nombre: { contains: busqueda, mode: "insensitive" } },
          },
        },
        {
          envios: {
            cliente: {
              razonSocial: { contains: busqueda, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const [pagosRaw, total] = await Promise.all([
      prisma.pagos.findMany({
        where,
        include: {
          envios: {
            include: {
              cliente: true,
              sucursalOrigen: true,
              sucursalDestino: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pagos.count({ where }),
    ]);

    // Transformar los datos para que coincidan con lo que espera la página
    const pagos = pagosRaw.map((pago) => ({
      id: pago.id,
      envioId: pago.envioId,
      monto: pago.monto,
      metodo: pago.metodo,
      referencia: pago.referencia || "",
      fecha: pago.fecha,
      createdAt: pago.createdAt,
      updatedAt: pago.updatedAt,
      // Campos derivados para compatibilidad con la página
      estado: "CONFIRMADO", // Como no hay estado en la tabla, asumimos confirmado
      cliente: pago.envios?.cliente?.esEmpresa
        ? pago.envios.cliente.razonSocial || pago.envios.cliente.nombre
        : `${pago.envios?.cliente?.nombre || ""} ${
            pago.envios?.cliente?.apellidos || ""
          }`.trim() || "Cliente desconocido",
      envio: pago.envios?.guia || "Sin guía",
      clienteNombre: pago.envios?.cliente?.esEmpresa
        ? pago.envios.cliente.razonSocial || pago.envios.cliente.nombre
        : `${pago.envios?.cliente?.nombre || ""} ${
            pago.envios?.cliente?.apellidos || ""
          }`.trim() || "Cliente desconocido",
      numeroGuia: pago.envios?.guia || "Sin guía",
      totalEnvio: pago.envios?.total || 0,
      saldoEnvio: 0, // Calcularíamos el saldo si fuera necesario
      // Datos del envío para referencia
      envioData: pago.envios,
    }));

    return {
      success: true,
      data: {
        pagos,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    };
  } catch (error) {
    return { success: false, error: "Error al listar pagos" };
  }
}

/**
 * Obtener pagos por envío
 */
export async function getPagosPorEnvio(envioId) {
  try {
    if (!envioId) {
      return { success: false, error: "ID de envío requerido" };
    }

    const pagos = await prisma.pagos.findMany({
      where: { envioId, deletedAt: null },
      orderBy: { fecha: "desc" },
    });

    return { success: true, data: pagos };
  } catch (error) {
    return { success: false, error: "Error al obtener pagos por envío" };
  }
}

/**
 * Obtener detalle de pago por ID, incluyendo relaciones del envío
 */
export async function getPagoDetalle(pagoId) {
  try {
    if (!pagoId) {
      return { success: false, error: "ID de pago requerido" };
    }

    // Usar el ID tal como viene (puede ser string o número)
    const id = pagoId;

    const pago = await prisma.pagos.findUnique({
      where: { id: id },
      include: {
        envios: {
          include: {
            cliente: true,
            sucursalOrigen: true,
            sucursalDestino: true,
          },
        },
      },
    });

    if (!pago || pago.deletedAt) {
      return { success: false, error: "Pago no encontrado" };
    }

    return { success: true, data: pago };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener el detalle de pago: " + error.message,
    };
  }
}

/**
 * Registrar pago asociado a un envío
 */
export async function registrarPago(data) {
  try {
    const { envioId, guia, monto, metodo, referencia, fecha } = data || {};

    if ((!envioId && !guia) || monto === undefined || !metodo) {
      return {
        success: false,
        error: "envioId o guía, monto y método son requeridos",
      };
    }

    // Verificar envío existente y activo
    const envio = await prisma.envios.findFirst({
      where: envioId
        ? { id: envioId, deletedAt: null }
        : { guia, deletedAt: null },
      select: { id: true, total: true },
    });

    if (!envio) {
      return { success: false, error: "Envío no encontrado" };
    }

    // Calcular saldo pendiente: total - suma de pagos activos
    const pagosPrevios = await prisma.pagos.findMany({
      where: { envioId: envio.id, deletedAt: null },
      select: { monto: true },
    });

    const pagado = pagosPrevios.reduce((sum, p) => sum + (p.monto || 0), 0);
    const saldoPendiente = (envio.total || 0) - pagado;
    const montoNum = parseFloat(monto);

    if (isNaN(montoNum) || montoNum <= 0) {
      return { success: false, error: "Monto inválido" };
    }

    if (montoNum - saldoPendiente > 0.0001) {
      return {
        success: false,
        error: "El monto excede el saldo pendiente del envío",
        meta: { saldoPendiente, totalEnvio: envio.total, pagado },
      };
    }

    // Crear pago
    const nuevoPago = await prisma.pagos.create({
      data: {
        id: `pago_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        envioId: envio.id,
        monto: montoNum,
        metodo,
        referencia: referencia || null,
        fecha: fecha ? new Date(fecha) : new Date(),
      },
    });

    // Revalidar páginas relacionadas
    revalidatePath("/dashboard/pagos");
    revalidatePath("/dashboard/envios");

    return { success: true, data: nuevoPago };
  } catch (error) {
    return { success: false, error: "Error al registrar el pago" };
  }
}

/**
 * Anular pago (soft delete)
 */
export async function anularPago(pagoId, motivo) {
  try {
    if (!pagoId) {
      return { success: false, error: "ID de pago requerido" };
    }

    const pago = await prisma.pagos.findUnique({ where: { id: pagoId } });

    if (!pago || pago.deletedAt) {
      return { success: false, error: "Pago no encontrado" };
    }

    const pagoAnulado = await prisma.pagos.update({
      where: { id: pagoId },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/dashboard/pagos");

    return { success: true, data: pagoAnulado, message: "Pago anulado" };
  } catch (error) {
    return { success: false, error: "Error al anular el pago" };
  }
}

/**
 * Obtener resumen de pagos (totales y pendientes por período)
 */
export async function getResumenPagos({
  fechaDesde,
  fechaHasta,
  metodo,
  sucursalOrigenId,
  clienteId,
  estadoEnvio,
} = {}) {
  try {
    const where = { deletedAt: null };

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) {
        const end = new Date(fechaHasta);
        end.setHours(23, 59, 59, 999);
        where.fecha.lte = end;
      }
    }

    // Filtros adicionales
    if (metodo) where.metodo = metodo;

    const envioFilter = {};
    if (sucursalOrigenId) envioFilter.sucursalOrigenId = sucursalOrigenId;
    if (clienteId) envioFilter.clienteId = clienteId;
    if (estadoEnvio) envioFilter.estado = estadoEnvio;
    if (Object.keys(envioFilter).length > 0) where.envios = envioFilter;

    const pagos = await prisma.pagos.findMany({ where });
    const totalPagos = pagos.reduce((sum, p) => sum + (p.monto || 0), 0);
    const cantidadPagos = pagos.length;

    // Calcular totales de envíos y saldos
    const envios = await prisma.envios.findMany({
      where: { deletedAt: null },
    });
    const totalEnvios = envios.reduce((sum, e) => sum + (e.total || 0), 0);
    const porcentajeCobrado =
      totalEnvios > 0 ? (totalPagos / totalEnvios) * 100 : 0;
    const ticketPromedio = cantidadPagos > 0 ? totalPagos / cantidadPagos : 0;

    return {
      success: true,
      data: {
        totalPagos,
        totalEnvios,
        saldoPorCobrar: Math.max(totalEnvios - totalPagos, 0),
        porcentajeCobrado,
        ticketPromedio,
        cantidadPagos,
      },
    };
  } catch (error) {
    return { success: false, error: "Error al obtener el resumen de pagos" };
  }
}

/**
 * Obtener resumen de pagos por método (sumas y cantidades)
 */
export async function getResumenPagosPorMetodo({
  fechaDesde,
  fechaHasta,
  metodo,
  sucursalOrigenId,
  clienteId,
  estadoEnvio,
} = {}) {
  try {
    const where = { deletedAt: null };

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) {
        const end = new Date(fechaHasta);
        end.setHours(23, 59, 59, 999);
        where.fecha.lte = end;
      }
    }

    if (metodo) where.metodo = metodo;

    const envioFilter = {};
    if (sucursalOrigenId) envioFilter.sucursalOrigenId = sucursalOrigenId;
    if (clienteId) envioFilter.clienteId = clienteId;
    if (estadoEnvio) envioFilter.estado = estadoEnvio;
    if (Object.keys(envioFilter).length > 0) where.envios = envioFilter;

    const grupos = await prisma.pagos.groupBy({
      by: ["metodo"],
      where,
      _sum: { monto: true },
      _count: { _all: true },
    });

    const data = grupos.map((g) => ({
      metodo: g.metodo || "SIN_METODO",
      total: Number(g._sum?.monto || 0),
      cantidad: Number(g._count?._all || 0),
    }));

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Error al obtener resumen por método" };
  }
}

/**
 * Obtener resumen de pagos por sucursal de origen (sumas y cantidades)
 */
export async function getResumenPagosPorSucursal({
  fechaDesde,
  fechaHasta,
  metodo,
  sucursalOrigenId,
  clienteId,
  estadoEnvio,
} = {}) {
  try {
    const where = { deletedAt: null };

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) {
        const end = new Date(fechaHasta);
        end.setHours(23, 59, 59, 999);
        where.fecha.lte = end;
      }
    }

    if (metodo) where.metodo = metodo;

    const envioFilter = {};
    if (sucursalOrigenId) envioFilter.sucursalOrigenId = sucursalOrigenId;
    if (clienteId) envioFilter.clienteId = clienteId;
    if (estadoEnvio) envioFilter.estado = estadoEnvio;
    if (Object.keys(envioFilter).length > 0) where.envios = envioFilter;

    const pagos = await prisma.pagos.findMany({
      where,
      include: { envios: { include: { sucursalOrigen: true } } },
    });

    const mapa = new Map();
    for (const p of pagos) {
      const suc = p.envios?.sucursalOrigen;
      const key = suc?.id || "SIN_SUCURSAL";
      const nombre = suc?.nombre || "Sin Sucursal";
      const prev = mapa.get(key) || {
        sucursalId: key,
        sucursalNombre: nombre,
        total: 0,
        cantidad: 0,
      };
      prev.total += Number(p.monto || 0);
      prev.cantidad += 1;
      mapa.set(key, prev);
    }

    return { success: true, data: Array.from(mapa.values()) };
  } catch (error) {
    return { success: false, error: "Error al obtener resumen por sucursal" };
  }
}

/**
 * Obtener resumen de pagos por cliente (sumas y cantidades)
 */
export async function getResumenPagosPorCliente({
  fechaDesde,
  fechaHasta,
  metodo,
  sucursalOrigenId,
  clienteId,
  estadoEnvio,
} = {}) {
  try {
    const where = { deletedAt: null };

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) {
        const end = new Date(fechaHasta);
        end.setHours(23, 59, 59, 999);
        where.fecha.lte = end;
      }
    }

    if (metodo) where.metodo = metodo;

    const envioFilter = {};
    if (sucursalOrigenId) envioFilter.sucursalOrigenId = sucursalOrigenId;
    if (clienteId) envioFilter.clienteId = clienteId;
    if (estadoEnvio) envioFilter.estado = estadoEnvio;
    if (Object.keys(envioFilter).length > 0) where.envios = envioFilter;

    const pagos = await prisma.pagos.findMany({
      where,
      include: { envios: { include: { cliente: true } } },
    });

    const mapa = new Map();
    for (const p of pagos) {
      const cli = p.envios?.cliente;
      const key = cli?.id || "SIN_CLIENTE";
      const nombre = cli?.razonSocial || cli?.nombre || "Sin Cliente";
      const prev = mapa.get(key) || {
        clienteId: key,
        clienteNombre: nombre,
        total: 0,
        cantidad: 0,
      };
      prev.total += Number(p.monto || 0);
      prev.cantidad += 1;
      mapa.set(key, prev);
    }

    // Ordenar por total desc y limitar a top 20
    const arr = Array.from(mapa.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    return { success: true, data: arr };
  } catch (error) {
    return { success: false, error: "Error al obtener resumen por cliente" };
  }
}

/**
 * Obtener resumen de pagos por estado del envío
 */
export async function getResumenPagosPorEstado({
  fechaDesde,
  fechaHasta,
  metodo,
  sucursalOrigenId,
  clienteId,
  estadoEnvio,
} = {}) {
  try {
    const where = { deletedAt: null };

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) {
        const end = new Date(fechaHasta);
        end.setHours(23, 59, 59, 999);
        where.fecha.lte = end;
      }
    }

    if (metodo) where.metodo = metodo;

    const envioFilter = {};
    if (sucursalOrigenId) envioFilter.sucursalOrigenId = sucursalOrigenId;
    if (clienteId) envioFilter.clienteId = clienteId;
    if (estadoEnvio) envioFilter.estado = estadoEnvio;
    if (Object.keys(envioFilter).length > 0) where.envios = envioFilter;

    const pagos = await prisma.pagos.findMany({
      where,
      include: { envios: true },
    });

    const mapa = new Map();
    for (const p of pagos) {
      const estado = p.envios?.estado || "SIN_ESTADO";
      const prev = mapa.get(estado) || { estado, total: 0, cantidad: 0 };
      prev.total += Number(p.monto || 0);
      prev.cantidad += 1;
      mapa.set(estado, prev);
    }

    return { success: true, data: Array.from(mapa.values()) };
  } catch (error) {
    return { success: false, error: "Error al obtener resumen por estado" };
  }
}

/**
 * Listar cuentas por cobrar: envíos con saldo pendiente
 */
export async function getCuentasPorCobrar({
  fechaDesde,
  fechaHasta,
  sucursalOrigenId,
  sucursalDestinoId,
  clienteId,
  busquedaCliente,
  estadoEnvio,
  metodoPago,
  fechaPagoDesde,
  fechaPagoHasta,
  page = 1,
  limit = 50,
} = {}) {
  try {
    // Filtros para envíos
    const envioWhere = { deletedAt: null };

    if (fechaDesde || fechaHasta) {
      envioWhere.fechaRegistro = {};
      if (fechaDesde) envioWhere.fechaRegistro.gte = new Date(fechaDesde);
      if (fechaHasta) {
        const end = new Date(fechaHasta);
        end.setHours(23, 59, 59, 999);
        envioWhere.fechaRegistro.lte = end;
      }
    }

    if (sucursalOrigenId) envioWhere.sucursalOrigenId = sucursalOrigenId;
    if (sucursalDestinoId) envioWhere.sucursalDestinoId = sucursalDestinoId;
    if (clienteId) envioWhere.clienteId = clienteId;
    if (estadoEnvio) envioWhere.estado = estadoEnvio;

    if (busquedaCliente) {
      envioWhere.cliente = {
        OR: [
          { nombre: { contains: busquedaCliente, mode: "insensitive" } },
          { apellidos: { contains: busquedaCliente, mode: "insensitive" } },
          { razonSocial: { contains: busquedaCliente, mode: "insensitive" } },
          {
            numeroDocumento: { contains: busquedaCliente, mode: "insensitive" },
          },
        ],
      };
    }

    // Obtener envíos paginados
    const [envios, totalEnvios] = await Promise.all([
      prisma.envios.findMany({
        where: envioWhere,
        include: {
          cliente: true,
          sucursalOrigen: true,
          sucursalDestino: true,
        },
        orderBy: { fechaRegistro: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.envios.count({ where: envioWhere }),
    ]);

    // Sumas de pagos por envío en el rango
    const pagoWhere = { deletedAt: null };

    // Rango por fecha de pago (si se especifica) de lo contrario usa rango de envíos
    if (fechaPagoDesde || fechaPagoHasta || fechaDesde || fechaHasta) {
      pagoWhere.fecha = {};
      const desde = fechaPagoDesde || fechaDesde;
      const hasta = fechaPagoHasta || fechaHasta;
      if (desde) pagoWhere.fecha.gte = new Date(desde);
      if (hasta) {
        const end = new Date(hasta);
        end.setHours(23, 59, 59, 999);
        pagoWhere.fecha.lte = end;
      }
    }

    if (metodoPago) pagoWhere.metodo = metodoPago;

    // Sólo pagos de los envíos listados (optimización por IDs)
    const envioIds = envios.map((e) => e.id);
    if (envioIds.length > 0) pagoWhere.envioId = { in: envioIds };

    const pagosGrouped = await prisma.pagos.groupBy({
      by: ["envioId"],
      where: pagoWhere,
      _sum: { monto: true },
    });

    const pagadoPorEnvio = new Map(
      pagosGrouped.map((p) => [p.envioId, Number(p._sum.monto || 0)])
    );

    // Construir resultado con saldo
    const items = envios
      .map((e) => {
        const pagado = pagadoPorEnvio.get(e.id) || 0;
        const total = Number(e.total || 0);
        const saldo = Math.max(total - pagado, 0);

        return {
          id: e.id,
          guia: e.guia,
          clienteId: e.clienteId,
          clienteNombre: e.cliente?.razonSocial || e.cliente?.nombre || "—",
          sucursalOrigenId: e.sucursalOrigenId,
          sucursalOrigenNombre: e.sucursalOrigen?.nombre || "—",
          sucursalDestinoNombre: e.sucursalDestino?.nombre || "—",
          estado: e.estado,
          fechaRegistro: e.fechaRegistro,
          total,
          pagado,
          saldo,
        };
      })
      .filter((i) => i.saldo > 0.0001);

    const totalSaldo = items.reduce((sum, i) => sum + i.saldo, 0);
    const totalPagado = items.reduce((sum, i) => sum + i.pagado, 0);

    return {
      success: true,
      data: {
        items,
        resumen: {
          totalEnvios: totalEnvios,
          enviosConSaldo: items.length,
          totalSaldo,
          totalPagado,
        },
        pagination: {
          page,
          limit,
          total: totalEnvios,
          totalPages: Math.ceil(totalEnvios / limit),
        },
      },
    };
  } catch (error) {
    return { success: false, error: "Error al obtener cuentas por cobrar" };
  }
}

/**
 * Obtener serie de pagos por día (para gráficos)
 */
export async function getSeriePagosPorDia({
  fechaDesde,
  fechaHasta,
  metodo,
  sucursalOrigenId,
  clienteId,
  estadoEnvio,
} = {}) {
  try {
    const where = { deletedAt: null };

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) {
        const end = new Date(fechaHasta);
        end.setHours(23, 59, 59, 999);
        where.fecha.lte = end;
      }
    }

    if (metodo) where.metodo = metodo;

    const envioFilter = {};
    if (sucursalOrigenId) envioFilter.sucursalOrigenId = sucursalOrigenId;
    if (clienteId) envioFilter.clienteId = clienteId;
    if (estadoEnvio) envioFilter.estado = estadoEnvio;
    if (Object.keys(envioFilter).length > 0) where.envios = envioFilter;

    const pagos = await prisma.pagos.findMany({ where });

    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    };

    const mapa = new Map();
    for (const p of pagos) {
      const key = fmt(new Date(p.fecha));
      const prev = mapa.get(key) || { fecha: key, total: 0, cantidad: 0 };
      prev.total += Number(p.monto || 0);
      prev.cantidad += 1;
      mapa.set(key, prev);
    }

    const arr = Array.from(mapa.values()).sort((a, b) =>
      a.fecha < b.fecha ? -1 : 1
    );

    return { success: true, data: arr };
  } catch (error) {
    return { success: false, error: "Error al obtener serie de pagos por día" };
  }
}
