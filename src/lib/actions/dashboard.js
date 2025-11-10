"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cacheDashboardKpis, CACHE_TAGS } from "@/lib/utils/cache";

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

// Obtener KPIs del dashboard (función interna)
const _getDashboardKpis = async ({ sucursalId, filtroTipo = "ambos" } = {}) => {
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
    const buildWhereClause = (additionalConditions = {}) => {
      // Construir condiciones base
      const conditions = {
        deletedAt: null,
      };

      // Agregar condiciones adicionales (excepto si tienen OR, las manejamos después)
      const { OR: orConditions, ...otherConditions } = additionalConditions;
      Object.assign(conditions, otherConditions);

      // Determinar filtro de sucursal según el tipo seleccionado
      let sucursalFilter = null;
      const sucursalIdToFilter =
        user.role !== "SUPER_ADMIN" ? user.sucursalId : sucursalId;

      if (sucursalIdToFilter) {
        if (filtroTipo === "origen") {
          // Solo envíos que se registraron en esta sucursal
          sucursalFilter = { sucursalOrigenId: sucursalIdToFilter };
        } else if (filtroTipo === "destino") {
          // Solo envíos que van a esta sucursal
          sucursalFilter = { sucursalDestinoId: sucursalIdToFilter };
        } else {
          // Ambos: envíos desde y hacia esta sucursal (comportamiento por defecto)
          sucursalFilter = {
            OR: [
              { sucursalOrigenId: sucursalIdToFilter },
              { sucursalDestinoId: sucursalIdToFilter },
            ],
          };
        }
      }

      // Si no hay filtro de sucursal ni OR adicional, devolver condiciones simples
      if (!sucursalFilter && !orConditions) {
        return conditions;
      }

      // Si hay filtro de sucursal o OR adicional, usar AND para combinarlos
      const andConditions = [conditions];

      if (sucursalFilter) {
        andConditions.push(sucursalFilter);
      }

      if (orConditions) {
        andConditions.push({ OR: orConditions });
      }

      // Si solo hay una condición en AND, devolverla directamente
      if (andConditions.length === 1) {
        return andConditions[0];
      }

      return { AND: andConditions };
    };

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
        where: buildWhereClause({
          fechaRegistro: { gte: inicioHoy },
        }),
      }),
      // Envíos del mes
      prisma.envios.count({
        where: buildWhereClause({
          fechaRegistro: { gte: inicioMes },
        }),
      }),
      // Envíos entregados hoy
      prisma.envios.count({
        where: buildWhereClause({
          estado: "ENTREGADO",
          OR: [
            { fechaEntrega: { gte: inicioHoy } },
            {
              AND: [{ fechaEntrega: null }, { updatedAt: { gte: inicioHoy } }],
            },
          ],
        }),
      }),
      // Envíos en tránsito
      prisma.envios.count({
        where: buildWhereClause({
          estado: { in: ["EN_TRANSITO", "EN_REPARTO"] },
        }),
      }),
      // Envíos retrasados (más de 5 días sin actualizar)
      prisma.envios.count({
        where: buildWhereClause({
          estado: { notIn: ["ENTREGADO", "DEVUELTO", "ANULADO"] },
          updatedAt: {
            lt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
        }),
      }),
      // Ingresos del mes
      prisma.envios.aggregate({
        where: buildWhereClause({
          fechaRegistro: { gte: inicioMes },
          estado: { notIn: ["ANULADO"] },
        }),
        _sum: { total: true },
      }),
    ]);

    // Obtener envíos recientes
    const enviosRecientes = await prisma.envios.findMany({
      where: buildWhereClause(),
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
      orderBy: { fechaRegistro: "desc" },
      take: 10,
    });

    // Obtener estadísticas por estado (del mes actual o del mes seleccionado)
    // Estas estadísticas se usan para el gráfico de distribución
    // Se calcularán dinámicamente en el componente usando los datos de trend
    const estadisticasPorEstado = await prisma.envios.groupBy({
      by: ["estado"],
      where: buildWhereClause({
        fechaRegistro: { gte: inicioMes },
      }),
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
          fechaRegistro: envio.fechaRegistro,
          createdAt: envio.createdAt, // Mantener para compatibilidad
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
};

// Exportar getDashboardKpis (sin caché por ahora para evitar problemas con parámetros dinámicos)
export async function getDashboardKpis({
  sucursalId,
  filtroTipo = "ambos",
} = {}) {
  return _getDashboardKpis({ sucursalId, filtroTipo });
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
        deletedAt: null,
        fechaRegistro: { gte: fechaInicio },
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

// Obtener meses disponibles con datos
export async function getMesesDisponibles({
  sucursalId,
  filtroTipo = "ambos",
} = {}) {
  try {
    const user = await checkPermissions([
      "SUPER_ADMIN",
      "ADMIN_SUCURSAL",
      "OPERADOR",
    ]);

    // Determinar filtro de sucursal
    const whereSucursal = (() => {
      const sucursalIdToFilter =
        user.role !== "SUPER_ADMIN" ? user.sucursalId : sucursalId;

      if (!sucursalIdToFilter) {
        return {};
      }

      if (filtroTipo === "origen") {
        return { sucursalOrigenId: sucursalIdToFilter };
      } else if (filtroTipo === "destino") {
        return { sucursalDestinoId: sucursalIdToFilter };
      } else {
        return {
          OR: [
            { sucursalOrigenId: sucursalIdToFilter },
            { sucursalDestinoId: sucursalIdToFilter },
          ],
        };
      }
    })();

    // Obtener fechas únicas de envíos
    const envios = await prisma.envios.findMany({
      where: {
        ...whereSucursal,
        deletedAt: null,
      },
      select: {
        fechaRegistro: true,
      },
      orderBy: {
        fechaRegistro: "asc",
      },
    });

    // Extraer meses únicos
    const mesesSet = new Set();
    envios.forEach((envio) => {
      if (envio.fechaRegistro) {
        const fecha = new Date(envio.fechaRegistro);
        const mesKey = `${fecha.getFullYear()}-${String(
          fecha.getMonth() + 1
        ).padStart(2, "0")}`;
        mesesSet.add(mesKey);
      }
    });

    // Convertir a array de objetos
    const meses = Array.from(mesesSet)
      .map((mesKey) => {
        const [año, mes] = mesKey.split("-");
        const fecha = new Date(Number(año), Number(mes) - 1, 1);
        return {
          value: mesKey,
          label: fecha.toLocaleString("es-PE", {
            month: "long",
            year: "numeric",
          }),
          año: Number(año),
          mes: Number(mes),
        };
      })
      .sort((a, b) => {
        if (a.año !== b.año) return b.año - a.año;
        return b.mes - a.mes;
      });

    return {
      success: true,
      data: meses,
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
  filtroTipo = "ambos",
  mes, // Formato: "YYYY-MM" (ej: "2025-11")
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

    // Si se especifica mes (formato "YYYY-MM"), usarlo
    if (mes) {
      const partes = mes.split("-");
      if (partes.length === 2) {
        const añoNum = Number(partes[0]);
        const mesNum = Number(partes[1]);
        inicio = new Date(añoNum, mesNum - 1, 1);
        // Último día del mes
        fin = new Date(añoNum, mesNum, 0, 23, 59, 59, 999);
      }
    } else if (!inicio || !fin) {
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
      const sucursalIdToFilter =
        user.role !== "SUPER_ADMIN" ? user.sucursalId : sucursalId;

      if (!sucursalIdToFilter) {
        return {};
      }

      // Aplicar el mismo filtro que en getDashboardKpis
      if (filtroTipo === "origen") {
        return { sucursalOrigenId: sucursalIdToFilter };
      } else if (filtroTipo === "destino") {
        return { sucursalDestinoId: sucursalIdToFilter };
      } else {
        // Ambos (comportamiento por defecto)
        return {
          OR: [
            { sucursalOrigenId: sucursalIdToFilter },
            { sucursalDestinoId: sucursalIdToFilter },
          ],
        };
      }
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

    // Si se seleccionó un mes específico, siempre mostrar por día
    // Si no, usar lógica de agrupación según el rango
    const diasRango = (fin - inicio) / (1000 * 60 * 60 * 24);
    const esMesEspecifico = mes !== undefined && diasRango <= 31;

    // Si es un mes específico o rango corto, agrupar por día
    const usarDia = esMesEspecifico || diasRango <= 31;

    const keyFn = usarDia
      ? (d) => {
          const fecha = new Date(d);
          return `${fecha.getFullYear()}-${String(
            fecha.getMonth() + 1
          ).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
        }
      : (d) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const labelsFn = usarDia
      ? (key) => {
          const [y, m, d] = key.split("-");
          const date = new Date(Number(y), Number(m) - 1, Number(d));
          return date.toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "short",
          });
        }
      : (key) => {
          const [y, m] = key.split("-");
          const date = new Date(Number(y), Number(m) - 1, 1);
          return date.toLocaleString("es-PE", { month: "short" });
        };

    // Agrupar datos
    const agrupado = new Map();
    for (const e of enviosRango) {
      const key = keyFn(new Date(e.fechaRegistro));
      const row = agrupado.get(key) || { ingresos: 0, envios: 0 };
      row.envios += 1;
      if (e.estado !== "ANULADO") row.ingresos += e.total || 0;
      agrupado.set(key, row);
    }

    // Si es un mes específico, crear datos para todos los días del mes (incluso sin envíos)
    let ingresosPorMes = [];
    if (esMesEspecifico && usarDia) {
      // Crear array de todos los días del mes
      const [año, mesNum] = mes.split("-").map(Number);
      const primerDia = new Date(año, mesNum - 1, 1);
      const ultimoDia = new Date(año, mesNum, 0); // Último día del mes
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const todosLosDias = [];
      for (let d = 1; d <= ultimoDia.getDate(); d++) {
        const fecha = new Date(año, mesNum - 1, d);
        fecha.setHours(0, 0, 0, 0);

        // Solo incluir días hasta hoy si es el mes actual
        if (fecha <= hoy) {
          const key = keyFn(fecha);
          const datos = agrupado.get(key) || { ingresos: 0, envios: 0 };
          todosLosDias.push({
            fecha: fecha,
            key: key,
            ingresos: Math.round(datos.ingresos),
            envios: datos.envios,
          });
        }
      }

      ingresosPorMes = todosLosDias.map((item) => ({
        mes: labelsFn(item.key),
        ingresos: item.ingresos,
        envios: item.envios,
        fecha: item.fecha,
      }));
    } else {
      // Ordenar por fecha para rangos más largos
      const ordenKeys = Array.from(agrupado.keys()).sort();
      ingresosPorMes = ordenKeys.map((k) => ({
        mes: labelsFn(k),
        ingresos: Math.round(agrupado.get(k).ingresos),
        envios: agrupado.get(k).envios,
      }));
    }

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
    const clienteIds = Array.from(porCliente.keys()).filter(Boolean);
    const clientes =
      clienteIds.length > 0
        ? await prisma.clientes.findMany({
            where: {
              id: { in: clienteIds },
              deletedAt: null, // Solo clientes activos
            },
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              razonSocial: true,
              esEmpresa: true,
            },
          })
        : [];

    // Crear mapa de IDs a nombres para acceso rápido
    const mapaClientes = new Map();
    clientes.forEach((c) => {
      const nombreCompleto = c.esEmpresa
        ? c.razonSocial || c.nombre || "Cliente sin nombre"
        : [c.nombre, c.apellidos].filter(Boolean).join(" ") ||
          "Cliente sin nombre";
      mapaClientes.set(c.id, nombreCompleto);
    });

    const nombreCliente = (id) => {
      if (!id) return "Cliente sin nombre";
      return mapaClientes.get(id) || "Cliente sin nombre";
    };

    // Construir array de top clientes con nombres reales
    const topClientes = Array.from(porCliente.entries())
      .map(([id, v]) => {
        const nombre = nombreCliente(id);
        // Solo incluir si tiene un nombre válido
        if (!nombre || nombre === "Cliente sin nombre") {
          return null;
        }

        return {
          nombre: nombre,
          envios: v.envios,
          ingresos: Math.round(v.ingresos),
        };
      })
      .filter(Boolean) // Eliminar clientes sin nombre válido
      .sort((a, b) => {
        // Ordenar primero por ingresos (descendente), luego por envíos (descendente)
        if (b.ingresos !== a.ingresos) {
          return b.ingresos - a.ingresos;
        }
        return b.envios - a.envios;
      })
      .slice(0, 5);

    // Rutas populares (origen-destino)
    const porRuta = new Map();
    for (const e of enviosRango) {
      // Solo procesar envíos con sucursales válidas
      if (!e.sucursalOrigenId || !e.sucursalDestinoId) continue;

      // Usar un separador que no pueda estar en los IDs (por ejemplo, ":::")
      const key = `${e.sucursalOrigenId}:::${e.sucursalDestinoId}`;
      const row = porRuta.get(key) || { envios: 0, ingresos: 0 };
      row.envios += 1;
      if (e.estado !== "ANULADO") row.ingresos += e.total || 0;
      porRuta.set(key, row);
    }

    // Si no hay rutas, retornar array vacío
    if (porRuta.size === 0) {
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
          rutasPopulares: [],
        },
      };
    }

    // Obtener todos los IDs únicos de sucursales
    const rutaIds = Array.from(porRuta.keys()).flatMap((k) => {
      const [o, d] = k.split(":::");
      return [o, d].filter(Boolean);
    });
    const idsUnicos = [...new Set(rutaIds)].filter(Boolean);

    // Obtener nombres de sucursales (incluyendo eliminadas para mostrar nombres históricos)
    const sucursalesRutas =
      idsUnicos.length > 0
        ? await prisma.sucursales.findMany({
            where: {
              id: { in: idsUnicos },
              // NO filtrar por deletedAt aquí, para poder mostrar rutas históricas
            },
            select: { id: true, nombre: true, deletedAt: true },
          })
        : [];

    // Crear mapa de IDs a nombres para acceso rápido
    const mapaSucursales = new Map(
      sucursalesRutas.map((s) => [s.id, s.nombre])
    );

    const nombreSucursal = (id) => {
      if (!id) return "Sucursal desconocida";
      const nombre = mapaSucursales.get(id);
      return nombre || `Sucursal ${id.substring(0, 8)}...`; // Mostrar parte del ID si no se encuentra
    };

    // Construir array de rutas populares con nombres reales
    const rutasPopulares = Array.from(porRuta.entries())
      .map(([key, v]) => {
        const [origenId, destinoId] = key.split(":::");
        const origenNombre = nombreSucursal(origenId);
        const destinoNombre = nombreSucursal(destinoId);

        return {
          origen: origenNombre,
          destino: destinoNombre,
          envios: v.envios,
          ingresos: Math.round(v.ingresos),
        };
      })
      .sort((a, b) => {
        // Ordenar primero por ingresos (descendente), luego por envíos (descendente)
        if (b.ingresos !== a.ingresos) {
          return b.ingresos - a.ingresos;
        }
        return b.envios - a.envios;
      })
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
