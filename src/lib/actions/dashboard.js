"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

// Obtener KPIs del dashboard
export async function getDashboardKpis({ sucursalId } = {}) {
  try {
    const user = await checkPermissions([
      "SUPER_ADMIN",
      "ADMIN_SUCURSAL",
      "OPERADOR",
    ]);

    const hoy = new Date();
    const inicioHoy = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate()
    );
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    // Filtrar por sucursal si no es SUPER_ADMIN o si SUPER_ADMIN selecciona una sucursal
    const whereClause = (() => {
      if (user.role !== "SUPER_ADMIN" && user.sucursalId) {
        return {
          OR: [
            { sucursalOrigenId: user.sucursalId },
            { sucursalDestinoId: user.sucursalId },
          ],
        };
      }

      if (user.role === "SUPER_ADMIN" && sucursalId) {
        return {
          OR: [
            { sucursalOrigenId: sucursalId },
            { sucursalDestinoId: sucursalId },
          ],
        };
      }

      return {};
    })();

    const [
      enviosHoy,
      enviosMes,
      enviosEntregadosHoy,
      enviosEnTransito,
      enviosRetrasados,
      ingresosMes,
    ] = await Promise.all([
      // Envíos de hoy
      prisma.envios.count({
        where: {
          ...whereClause,
          createdAt: { gte: inicioHoy },
        },
      }),
      // Envíos del mes
      prisma.envios.count({
        where: {
          ...whereClause,
          createdAt: { gte: inicioMes },
        },
      }),
      // Envíos entregados hoy
      prisma.envios.count({
        where: {
          ...whereClause,
          estado: "ENTREGADO",
          updatedAt: { gte: inicioHoy },
        },
      }),
      // Envíos en tránsito
      prisma.envios.count({
        where: {
          ...whereClause,
          estado: { in: ["EN_TRANSITO", "EN_REPARTO"] },
        },
      }),
      // Envíos retrasados (más de 5 días sin actualizar)
      prisma.envios.count({
        where: {
          ...whereClause,
          estado: { notIn: ["ENTREGADO", "DEVUELTO", "ANULADO"] },
          updatedAt: {
            lt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Ingresos del mes
      prisma.envios.aggregate({
        where: {
          ...whereClause,
          createdAt: { gte: inicioMes },
          estado: { notIn: ["ANULADO"] },
        },
        _sum: { total: true },
      }),
    ]);

    // Obtener envíos recientes
    const enviosRecientes = await prisma.envios.findMany({
      where: whereClause,
      include: {
        cliente: {
          select: {
            nombre: true,
            apellidos: true,
            razonSocial: true,
          },
        },
        sucursalOrigen: {
          select: {
            nombre: true,
          },
        },
        sucursalDestino: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Obtener estadísticas por estado
    const estadisticasPorEstado = await prisma.envios.groupBy({
      by: ["estado"],
      where: {
        ...whereClause,
        createdAt: { gte: inicioMes },
      },
      _count: { id: true },
    });

    return {
      success: true,
      data: {
        enviosHoy,
        enviosMes,
        enviosEntregadosHoy,
        enviosEnTransito,
        enviosRetrasados,
        ingresosMes: ingresosMes._sum.total || 0,
        fechaActualizacion: new Date().toISOString(),
        enviosRecientes: enviosRecientes.map((envio) => ({
          id: envio.id,
          numeroGuia: envio.guia,
          cliente:
            envio.cliente?.razonSocial ||
            (envio.cliente
              ? `${envio.cliente.nombre} ${
                  envio.cliente.apellidos || ""
                }`.trim()
              : "Cliente anónimo"),
          origen: envio.sucursalOrigen.nombre,
          destino: envio.sucursalDestino.nombre,
          estado: envio.estado,
          total: envio.total,
          createdAt: envio.createdAt,
        })),
        estadisticasPorEstado: estadisticasPorEstado.reduce((acc, item) => {
          acc[item.estado] = item._count.id;
          return acc;
        }, {}),
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Obtener estadísticas de envíos por período
export async function getEstadisticasEnvios(periodo = "mes") {
  try {
    const user = await checkPermissions([
      "SUPER_ADMIN",
      "ADMIN_SUCURSAL",
      "OPERADOR",
    ]);

    const hoy = new Date();
    let fechaInicio;

    switch (periodo) {
      case "semana":
        fechaInicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "mes":
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case "trimestre":
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
        break;
      case "año":
        fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        break;
      default:
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    }

    const whereClause =
      user.role !== "SUPER_ADMIN" && user.sucursalId
        ? {
            OR: [
              { sucursalOrigenId: user.sucursalId },
              { sucursalDestinoId: user.sucursalId },
            ],
          }
        : {};

    const estadisticas = await prisma.envios.groupBy({
      by: ["estado"],
      where: {
        ...whereClause,
        createdAt: { gte: fechaInicio },
      },
      _count: { id: true },
      _sum: { total: true },
    });

    const totalEnvios = estadisticas.reduce(
      (sum, item) => sum + item._count.id,
      0
    );

    const totalIngresos = estadisticas.reduce(
      (sum, item) => sum + (item._sum.total || 0),
      0
    );

    return {
      success: true,
      data: {
        periodo,
        fechaInicio,
        totalEnvios,
        totalIngresos,
        estadisticas: estadisticas.map((item) => ({
          estado: item.estado,
          cantidad: item._count.id,
          ingresos: item._sum.total || 0,
          porcentaje:
            totalEnvios > 0
              ? ((item._count.id / totalEnvios) * 100).toFixed(2)
              : 0,
        })),
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// Estadísticas completas para el dashboard de "Estadísticas"
export async function getEstadisticasDashboard({
  periodo = "mes",
  fechaDesde,
  fechaHasta,
  sucursalId,
} = {}) {
  try {
    const user = await checkPermissions([
      "SUPER_ADMIN",
      "ADMIN_SUCURSAL",
      "OPERADOR",
    ]);

    const hoy = new Date();
    let inicio = fechaDesde ? new Date(fechaDesde) : null;
    let fin = fechaHasta ? new Date(fechaHasta) : null;

    if (!inicio || !fin) {
      switch (periodo) {
        case "semana":
          inicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
          fin = hoy;
          break;
        case "trimestre":
          inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
          fin = hoy;
          break;
        case "año":
          inicio = new Date(hoy.getFullYear(), 0, 1);
          fin = hoy;
          break;
        case "mes":
        default:
          inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          fin = hoy;
      }
    }

    const whereSucursal = (() => {
      if (user.role !== "SUPER_ADMIN" && user.sucursalId) {
        return {
          OR: [
            { sucursalOrigenId: user.sucursalId },
            { sucursalDestinoId: user.sucursalId },
          ],
        };
      }

      if (user.role === "SUPER_ADMIN" && sucursalId) {
        return {
          OR: [
            { sucursalOrigenId: sucursalId },
            { sucursalDestinoId: sucursalId },
          ],
        };
      }

      return {};
    })();

    // Traer envíos en rango; usamos fechaRegistro como fecha de negocio
    const enviosRango = await prisma.envios.findMany({
      where: {
        ...whereSucursal,
        deletedAt: null,
        fechaRegistro: {
          gte: inicio,
          lte: fin,
        },
      },
      select: {
        id: true,
        total: true,
        estado: true,
        fechaRegistro: true,
        clienteId: true,
        sucursalOrigenId: true,
        sucursalDestinoId: true,
      },
    });

    // Resumen
    const totalEnvios = enviosRango.length;
    const ingresosTotales = enviosRango
      .filter((e) => e.estado !== "ANULADO")
      .reduce((sum, e) => sum + (e.total || 0), 0);

    const clientesActivos = new Set(
      enviosRango.map((e) => e.clienteId).filter(Boolean)
    ).size;

    const enviosEnTransito = enviosRango.filter((e) =>
      ["EN_TRANSITO", "EN_REPARTO"].includes(e.estado)
    ).length;

    // Envios por estado
    const enviosPorEstadoMap = enviosRango.reduce((acc, e) => {
      acc[e.estado] = (acc[e.estado] || 0) + 1;
      return acc;
    }, {});

    const enviosPorEstado = Object.entries(enviosPorEstadoMap).map(
      ([estado, cantidad]) => ({ estado, cantidad })
    );

    // Ingresos y envíos por mes (o por día si rango corto)
    const usarMes = (fin - inicio) / (1000 * 60 * 60 * 24) > 28;

    const keyFn = usarMes
      ? (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      : (d) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(d.getDate()).padStart(2, "0")}`;

    const labelsFn = usarMes
      ? (key) => {
          const [y, m] = key.split("-");
          const date = new Date(Number(y), Number(m) - 1, 1);
          return date.toLocaleString("es-PE", { month: "short" });
        }
      : (key) => {
          const [y, m, d] = key.split("-");
          const date = new Date(Number(y), Number(m) - 1, Number(d));
          return date.toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "short",
          });
        };

    const agrupado = new Map();
    for (const e of enviosRango) {
      const key = keyFn(new Date(e.fechaRegistro));
      const row = agrupado.get(key) || { ingresos: 0, envios: 0 };
      row.envios += 1;
      if (e.estado !== "ANULADO") row.ingresos += e.total || 0;
      agrupado.set(key, row);
    }

    // Ordenar por fecha
    const ordenKeys = Array.from(agrupado.keys()).sort();
    const ingresosPorMes = ordenKeys.map((k) => ({
      mes: labelsFn(k),
      ingresos: Math.round(agrupado.get(k).ingresos),
      envios: agrupado.get(k).envios,
    }));

    // Top clientes por ingresos
    const porCliente = new Map();
    for (const e of enviosRango) {
      if (!e.clienteId) continue;
      const row = porCliente.get(e.clienteId) || { envios: 0, ingresos: 0 };
      row.envios += 1;
      if (e.estado !== "ANULADO") row.ingresos += e.total || 0;
      porCliente.set(e.clienteId, row);
    }

    // Obtener nombres de clientes
    const clienteIds = Array.from(porCliente.keys());
    const clientes = clienteIds.length
      ? await prisma.clientes.findMany({
          where: { id: { in: clienteIds } },
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            razonSocial: true,
          },
        })
      : [];

    const nombreCliente = (id) => {
      const c = clientes.find((x) => x.id === id);
      return (
        c?.razonSocial ||
        [c?.nombre, c?.apellidos].filter(Boolean).join(" ") ||
        "Cliente"
      );
    };

    const topClientes = Array.from(porCliente.entries())
      .map(([id, v]) => ({
        nombre: nombreCliente(id),
        envios: v.envios,
        ingresos: Math.round(v.ingresos),
      }))
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5);

    // Rutas populares (origen-destino)
    const porRuta = new Map();
    for (const e of enviosRango) {
      const key = `${e.sucursalOrigenId}-${e.sucursalDestinoId}`;
      const row = porRuta.get(key) || { envios: 0, ingresos: 0 };
      row.envios += 1;
      if (e.estado !== "ANULADO") row.ingresos += e.total || 0;
      porRuta.set(key, row);
    }

    const rutaIds = Array.from(porRuta.keys()).flatMap((k) => k.split("-"));
    const sucursales = rutaIds.length
      ? await prisma.sucursales.findMany({
          where: { id: { in: rutaIds } },
          select: { id: true, nombre: true },
        })
      : [];

    const nombreSucursal = (id) =>
      sucursales.find((s) => s.id === id)?.nombre || "Sucursal";

    const rutasPopulares = Array.from(porRuta.entries())
      .map(([key, v]) => {
        const [o, d] = key.split("-");
        return {
          origen: nombreSucursal(o),
          destino: nombreSucursal(d),
          envios: v.envios,
          ingresos: Math.round(v.ingresos),
        };
      })
      .sort((a, b) => b.envios - a.envios)
      .slice(0, 5);

    return {
      success: true,
      data: {
        resumen: {
          totalEnvios,
          ingresosTotales,
          clientesActivos,
          enviosEnTransito,
        },
        enviosPorEstado,
        ingresosPorMes,
        topClientes,
        rutasPopulares,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
