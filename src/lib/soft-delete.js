// Utilidades para manejar soft delete de manera consistente

import { Prisma } from "@prisma/client";

/**
 * Agrega condiciones de soft delete a las consultas de Prisma
 * @param {Object} where - Condiciones WHERE existentes
 * @param {boolean} includeDeleted - Si incluir registros eliminados
 * @returns {Object} - Condiciones WHERE con soft delete
 */
export function withSoftDelete(where = {}, includeDeleted = false) {
  if (!includeDeleted) {
    return {
      ...where,
      deletedAt: null,
    };
  }
  return where;
}

/**
 * Agrega condiciones para mostrar solo registros eliminados
 * @param {Object} where - Condiciones WHERE existentes
 * @returns {Object} - Condiciones WHERE para solo eliminados
 */
export function onlyDeleted(where = {}) {
  return {
    ...where,
    deletedAt: {
      not: null,
    },
  };
}

/**
 * Realiza soft delete estableciendo deletedAt
 * @param {Object} prismaModel - Modelo de Prisma
 * @param {string} id - ID del registro
 * @returns {Promise} - Resultado de la operación
 */
export async function softDelete(prismaModel, id) {
  return await prismaModel.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
}

/**
 * Restaura un registro eliminado (soft delete)
 * @param {Object} prismaModel - Modelo de Prisma
 * @param {string} id - ID del registro
 * @returns {Promise} - Resultado de la operación
 */
export async function restoreDeleted(prismaModel, id) {
  return await prismaModel.update({
    where: { id },
    data: {
      deletedAt: null,
    },
  });
}

/**
 * Realiza hard delete (eliminación física)
 * @param {Object} prismaModel - Modelo de Prisma
 * @param {string} id - ID del registro
 * @returns {Promise} - Resultado de la operación
 */
export async function hardDelete(prismaModel, id) {
  return await prismaModel.delete({
    where: { id },
  });
}

/**
 * Opciones de filtro para soft delete
 */
export const SOFT_DELETE_FILTERS = {
  ACTIVE_ONLY: "active_only", // Solo registros activos (deletedAt = null)
  DELETED_ONLY: "deleted_only", // Solo registros eliminados (deletedAt != null)
  ALL: "all", // Todos los registros
};

/**
 * Aplica filtro de soft delete basado en el tipo
 * @param {Object} where - Condiciones WHERE existentes
 * @param {string} filter - Tipo de filtro (ACTIVE_ONLY, DELETED_ONLY, ALL)
 * @returns {Object} - Condiciones WHERE con filtro aplicado
 */
export function applySoftDeleteFilter(
  where = {},
  filter = SOFT_DELETE_FILTERS.ACTIVE_ONLY
) {
  switch (filter) {
    case SOFT_DELETE_FILTERS.ACTIVE_ONLY:
      return withSoftDelete(where, false);
    case SOFT_DELETE_FILTERS.DELETED_ONLY:
      return onlyDeleted(where);
    case SOFT_DELETE_FILTERS.ALL:
      return where;
    default:
      return withSoftDelete(where, false);
  }
}
/**
 * Middleware para agregar automáticamente condiciones de soft delete
 * @param {Object} params - Parámetros de la consulta
 * @returns {Object} - Parámetros modificados
 */
export function softDeleteMiddleware(params) {
  // Si no se especifica includeDeleted, excluir eliminados por defecto
  if (params.args?.where && params.args.includeDeleted !== true) {
    params.args.where = withSoftDelete(params.args.where);
  }

  return params;
}

/**
 * Extensión para Prisma Client que agrega métodos de soft delete
 */
export const softDeleteExtension = {
  model: {
    $allModels: {
      // Método para soft delete
      async softDelete(id) {
        const context = Prisma.getExtensionContext(this);
        return await context.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      },

      // Método para restaurar
      async restore(id) {
        const context = Prisma.getExtensionContext(this);
        return await context.update({
          where: { id },
          data: { deletedAt: null },
        });
      },

      // Método para encontrar solo activos
      async findManyActive(args = {}) {
        const context = Prisma.getExtensionContext(this);
        return await context.findMany({
          ...args,
          where: withSoftDelete(args.where),
        });
      },

      // Método para encontrar solo eliminados
      async findManyDeleted(args = {}) {
        const context = Prisma.getExtensionContext(this);
        return await context.findMany({
          ...args,
          where: onlyDeleted(args.where),
        });
      },

      // Método para contar solo activos
      async countActive(args = {}) {
        const context = Prisma.getExtensionContext(this);
        return await context.count({
          ...args,
          where: withSoftDelete(args.where),
        });
      },
    },
  },
};
/**
 * Estados de registro para soft delete
 */
export const RECORD_STATES = {
  ACTIVE: "active", // Registro activo (deletedAt = null)
  SOFT_DELETED: "deleted", // Registro eliminado (deletedAt != null)
  INACTIVE: "inactive", // Registro inactivo (estado = false, pero no eliminado)
};

/**
 * Determina el estado de un registro
 * @param {Object} record - Registro de la base de datos
 * @returns {string} - Estado del registro
 */
export function getRecordState(record) {
  if (record.deletedAt) {
    return RECORD_STATES.SOFT_DELETED;
  }

  if (record.estado === false) {
    return RECORD_STATES.INACTIVE;
  }

  return RECORD_STATES.ACTIVE;
}

/**
 * Verifica si un registro está eliminado (soft delete)
 * @param {Object} record - Registro de la base de datos
 * @returns {boolean} - True si está eliminado
 */
export function isDeleted(record) {
  return record.deletedAt !== null;
}

/**
 * Verifica si un registro está activo
 * @param {Object} record - Registro de la base de datos
 * @returns {boolean} - True si está activo
 */
export function isActive(record) {
  return record.deletedAt === null && record.estado !== false;
}
