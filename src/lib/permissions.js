/**
 * Sistema de Permisos Híbrido
 * Combina roles base (enum) con permisos granulares (BD)
 */

// Permisos base por rol (siempre activos)
export const PERMISOS_BASE_POR_ROL = {
  SUPER_ADMIN: [
    // Acceso completo
    "dashboard.view",
    "clientes.view",
    "clientes.create",
    "clientes.edit",
    "clientes.delete",
    "clientes.export",
    "envios.view",
    "envios.create",
    "envios.edit",
    "envios.delete",
    "envios.assign",
    "cotizaciones.view",
    "cotizaciones.create",
    "cotizaciones.edit",
    "cotizaciones.delete",
    "seguimiento.view",
    "seguimiento.all",
    "usuarios.view",
    "usuarios.create",
    "usuarios.edit",
    "usuarios.delete",
    "configuracion.view",
    "configuracion.edit",
    "reportes.view",
    "reportes.export",
    "tarifas.view",
    "tarifas.create",
    "tarifas.edit",
    "tarifas.delete",
    "sucursales.view",
    "sucursales.create",
    "sucursales.edit",
    "sucursales.delete",
    "vehiculos.view",
    "vehiculos.create",
    "vehiculos.edit",
    "vehiculos.delete",
    "rutas.view",
    "rutas.create",
    "rutas.edit",
    "rutas.delete",
    "pagos.view",
    "pagos.create",
    "pagos.edit",
    "facturacion.view",
    "facturacion.emitir",
    "facturacion.config",
    "notificaciones.view",
    "notificaciones.edit",
    "auditoria.view",
    "respaldos.view",
    "respaldos.create",
    "respaldos.restore",
  ],
  ADMIN_SUCURSAL: [
    // Dashboard
    "dashboard.view",
    // Clientes
    "clientes.view",
    "clientes.create",
    "clientes.edit",
    "clientes.export",
    // Envíos
    "envios.view",
    "envios.create",
    "envios.edit",
    "envios.assign",
    // Cotizaciones
    "cotizaciones.view",
    "cotizaciones.create",
    "cotizaciones.edit",
    // Seguimiento
    "seguimiento.view",
    "seguimiento.sucursal",
    // Usuarios (limitado a OPERADOR y CONDUCTOR de su sucursal)
    "usuarios.view",
    "usuarios.create",
    "usuarios.edit",
    // Reportes
    "reportes.view",
    "reportes.sucursal",
    "reportes.export",
    // Tarifas (solo lectura)
    "tarifas.view",
    // Vehículos (de su sucursal)
    "vehiculos.view",
    "vehiculos.create",
    "vehiculos.edit",
    // Rutas (de su sucursal)
    "rutas.view",
    "rutas.create",
    "rutas.edit",
    // Pagos (de su sucursal)
    "pagos.view",
    "pagos.create",
    // Facturación (emitir para su sucursal)
    "facturacion.view",
    "facturacion.emitir",
    // Notificaciones (configurar para su sucursal)
    "notificaciones.view",
    "notificaciones.edit",
    // Auditoría (solo de su sucursal)
    "auditoria.view",
  ],
  OPERADOR: [
    "dashboard.view",
    "clientes.view",
    "clientes.create",
    "clientes.edit",
    "envios.view",
    "envios.create",
    "envios.edit",
    "cotizaciones.view",
    "cotizaciones.create",
    "seguimiento.view",
    "tarifas.view",
    "pagos.view",
    "pagos.create",
  ],
  CONDUCTOR: [
    "dashboard.view",
    "envios.view",
    "envios.edit",
    "seguimiento.view",
    "seguimiento.update",
    "clientes.view",
  ],
  CONTADOR: [
    "dashboard.view",
    "reportes.view",
    "reportes.export",
    "reportes.financial",
    "envios.view",
    "clientes.view",
    "tarifas.view",
    "facturacion.view",
    "facturacion.emitir",
    "pagos.view",
    "pagos.create",
  ],
  CLIENTE: ["seguimiento.own", "cotizaciones.create", "cotizaciones.view"],
};

// Definición de todos los permisos disponibles
export const PERMISOS_DISPONIBLES = [
  // Dashboard
  {
    codigo: "dashboard.view",
    nombre: "Ver Dashboard",
    categoria: "Dashboard",
    descripcion: "Acceso al panel principal",
  },
  // Clientes
  {
    codigo: "clientes.view",
    nombre: "Ver Clientes",
    categoria: "Clientes",
    descripcion: "Visualizar lista de clientes",
  },
  {
    codigo: "clientes.create",
    nombre: "Crear Clientes",
    categoria: "Clientes",
    descripcion: "Registrar nuevos clientes",
  },
  {
    codigo: "clientes.edit",
    nombre: "Editar Clientes",
    categoria: "Clientes",
    descripcion: "Modificar datos de clientes",
  },
  {
    codigo: "clientes.delete",
    nombre: "Eliminar Clientes",
    categoria: "Clientes",
    descripcion: "Eliminar clientes del sistema",
  },
  {
    codigo: "clientes.export",
    nombre: "Exportar Clientes",
    categoria: "Clientes",
    descripcion: "Exportar datos de clientes",
  },
  // Envíos
  {
    codigo: "envios.view",
    nombre: "Ver Envíos",
    categoria: "Envíos",
    descripcion: "Visualizar lista de envíos",
  },
  {
    codigo: "envios.create",
    nombre: "Crear Envíos",
    categoria: "Envíos",
    descripcion: "Registrar nuevos envíos",
  },
  {
    codigo: "envios.edit",
    nombre: "Editar Envíos",
    categoria: "Envíos",
    descripcion: "Modificar datos de envíos",
  },
  {
    codigo: "envios.delete",
    nombre: "Eliminar Envíos",
    categoria: "Envíos",
    descripcion: "Eliminar envíos del sistema",
  },
  {
    codigo: "envios.assign",
    nombre: "Asignar Envíos",
    categoria: "Envíos",
    descripcion: "Asignar envíos a conductores",
  },
  // Cotizaciones
  {
    codigo: "cotizaciones.view",
    nombre: "Ver Cotizaciones",
    categoria: "Cotizaciones",
    descripcion: "Visualizar cotizaciones",
  },
  {
    codigo: "cotizaciones.create",
    nombre: "Crear Cotizaciones",
    categoria: "Cotizaciones",
    descripcion: "Generar nuevas cotizaciones",
  },
  {
    codigo: "cotizaciones.edit",
    nombre: "Editar Cotizaciones",
    categoria: "Cotizaciones",
    descripcion: "Modificar cotizaciones",
  },
  {
    codigo: "cotizaciones.delete",
    nombre: "Eliminar Cotizaciones",
    categoria: "Cotizaciones",
    descripcion: "Eliminar cotizaciones",
  },
  // Seguimiento
  {
    codigo: "seguimiento.view",
    nombre: "Ver Seguimiento",
    categoria: "Seguimiento",
    descripcion: "Acceso básico al seguimiento",
  },
  {
    codigo: "seguimiento.all",
    nombre: "Seguimiento Completo",
    categoria: "Seguimiento",
    descripcion: "Ver todos los envíos del sistema",
  },
  {
    codigo: "seguimiento.sucursal",
    nombre: "Seguimiento Sucursal",
    categoria: "Seguimiento",
    descripcion: "Ver envíos de su sucursal",
  },
  {
    codigo: "seguimiento.own",
    nombre: "Seguimiento Propio",
    categoria: "Seguimiento",
    descripcion: "Ver solo sus propios envíos",
  },
  {
    codigo: "seguimiento.update",
    nombre: "Actualizar Seguimiento",
    categoria: "Seguimiento",
    descripcion: "Actualizar estado de envíos",
  },
  // Usuarios
  {
    codigo: "usuarios.view",
    nombre: "Ver Usuarios",
    categoria: "Usuarios",
    descripcion: "Visualizar lista de usuarios",
  },
  {
    codigo: "usuarios.create",
    nombre: "Crear Usuarios",
    categoria: "Usuarios",
    descripcion: "Registrar nuevos usuarios",
  },
  {
    codigo: "usuarios.edit",
    nombre: "Editar Usuarios",
    categoria: "Usuarios",
    descripcion: "Modificar datos de usuarios",
  },
  {
    codigo: "usuarios.delete",
    nombre: "Eliminar Usuarios",
    categoria: "Usuarios",
    descripcion: "Eliminar usuarios del sistema",
  },
  // Configuración
  {
    codigo: "configuracion.view",
    nombre: "Ver Configuración",
    categoria: "Configuración",
    descripcion: "Acceso a configuraciones",
  },
  {
    codigo: "configuracion.edit",
    nombre: "Editar Configuración",
    categoria: "Configuración",
    descripcion: "Modificar configuraciones del sistema",
  },
  // Reportes
  {
    codigo: "reportes.view",
    nombre: "Ver Reportes",
    categoria: "Reportes",
    descripcion: "Acceso a reportes básicos",
  },
  {
    codigo: "reportes.export",
    nombre: "Exportar Reportes",
    categoria: "Reportes",
    descripcion: "Exportar reportes a archivos",
  },
  {
    codigo: "reportes.financial",
    nombre: "Reportes Financieros",
    categoria: "Reportes",
    descripcion: "Acceso a reportes financieros",
  },
  {
    codigo: "reportes.sucursal",
    nombre: "Reportes Sucursal",
    categoria: "Reportes",
    descripcion: "Reportes de su sucursal",
  },
  // Tarifas
  {
    codigo: "tarifas.view",
    nombre: "Ver Tarifas",
    categoria: "Tarifas",
    descripcion: "Visualizar tarifas del sistema",
  },
  {
    codigo: "tarifas.create",
    nombre: "Crear Tarifas",
    categoria: "Tarifas",
    descripcion: "Registrar nuevas tarifas",
  },
  {
    codigo: "tarifas.edit",
    nombre: "Editar Tarifas",
    categoria: "Tarifas",
    descripcion: "Modificar tarifas existentes",
  },
  {
    codigo: "tarifas.delete",
    nombre: "Eliminar Tarifas",
    categoria: "Tarifas",
    descripcion: "Eliminar tarifas del sistema",
  },
  // Sucursales
  {
    codigo: "sucursales.view",
    nombre: "Ver Sucursales",
    categoria: "Sucursales",
    descripcion: "Visualizar sucursales",
  },
  {
    codigo: "sucursales.create",
    nombre: "Crear Sucursales",
    categoria: "Sucursales",
    descripcion: "Registrar nuevas sucursales",
  },
  {
    codigo: "sucursales.edit",
    nombre: "Editar Sucursales",
    categoria: "Sucursales",
    descripcion: "Modificar datos de sucursales",
  },
  {
    codigo: "sucursales.delete",
    nombre: "Eliminar Sucursales",
    categoria: "Sucursales",
    descripcion: "Eliminar sucursales",
  },
  // Vehículos
  {
    codigo: "vehiculos.view",
    nombre: "Ver Vehículos",
    categoria: "Vehículos",
    descripcion: "Visualizar vehículos",
  },
  {
    codigo: "vehiculos.create",
    nombre: "Crear Vehículos",
    categoria: "Vehículos",
    descripcion: "Registrar nuevos vehículos",
  },
  {
    codigo: "vehiculos.edit",
    nombre: "Editar Vehículos",
    categoria: "Vehículos",
    descripcion: "Modificar datos de vehículos",
  },
  {
    codigo: "vehiculos.delete",
    nombre: "Eliminar Vehículos",
    categoria: "Vehículos",
    descripcion: "Eliminar vehículos",
  },
  // Rutas
  {
    codigo: "rutas.view",
    nombre: "Ver Rutas",
    categoria: "Rutas",
    descripcion: "Visualizar rutas",
  },
  {
    codigo: "rutas.create",
    nombre: "Crear Rutas",
    categoria: "Rutas",
    descripcion: "Registrar nuevas rutas",
  },
  {
    codigo: "rutas.edit",
    nombre: "Editar Rutas",
    categoria: "Rutas",
    descripcion: "Modificar datos de rutas",
  },
  {
    codigo: "rutas.delete",
    nombre: "Eliminar Rutas",
    categoria: "Rutas",
    descripcion: "Eliminar rutas",
  },
  // Pagos
  {
    codigo: "pagos.view",
    nombre: "Ver Pagos",
    categoria: "Pagos",
    descripcion: "Visualizar pagos",
  },
  {
    codigo: "pagos.create",
    nombre: "Crear Pagos",
    categoria: "Pagos",
    descripcion: "Registrar nuevos pagos",
  },
  {
    codigo: "pagos.edit",
    nombre: "Editar Pagos",
    categoria: "Pagos",
    descripcion: "Modificar datos de pagos",
  },
  // Facturación
  {
    codigo: "facturacion.view",
    nombre: "Ver Facturación",
    categoria: "Facturación",
    descripcion: "Visualizar comprobantes",
  },
  {
    codigo: "facturacion.emitir",
    nombre: "Emitir Comprobantes",
    categoria: "Facturación",
    descripcion: "Emitir comprobantes electrónicos",
  },
  {
    codigo: "facturacion.config",
    nombre: "Configurar Facturación",
    categoria: "Facturación",
    descripcion: "Configurar datos de facturación (SUNAT)",
  },
  // Notificaciones
  {
    codigo: "notificaciones.view",
    nombre: "Ver Notificaciones",
    categoria: "Notificaciones",
    descripcion: "Visualizar notificaciones",
  },
  {
    codigo: "notificaciones.edit",
    nombre: "Editar Notificaciones",
    categoria: "Notificaciones",
    descripcion: "Configurar notificaciones",
  },
  // Auditoría
  {
    codigo: "auditoria.view",
    nombre: "Ver Auditoría",
    categoria: "Auditoría",
    descripcion: "Visualizar logs de auditoría",
  },
  // Respaldos
  {
    codigo: "respaldos.view",
    nombre: "Ver Respaldos",
    categoria: "Respaldos",
    descripcion: "Visualizar respaldos",
  },
  {
    codigo: "respaldos.create",
    nombre: "Crear Respaldos",
    categoria: "Respaldos",
    descripcion: "Crear respaldos del sistema",
  },
  {
    codigo: "respaldos.restore",
    nombre: "Restaurar Respaldos",
    categoria: "Respaldos",
    descripcion: "Restaurar respaldos del sistema",
  },
];

/**
 * Obtener permisos base de un rol
 */
export function getPermisosBaseRol(rol) {
  return PERMISOS_BASE_POR_ROL[rol] || [];
}

/**
 * Verificar si un usuario tiene un permiso específico
 */
export function tienePermiso(usuario, permiso) {
  // 1. Verificar permisos base del rol
  const permisosBase = getPermisosBaseRol(usuario.role);
  if (permisosBase.includes(permiso)) {
    return true;
  }

  // 2. Verificar permisos adicionales de la BD
  if (usuario.permisos) {
    const permisoAdicional = usuario.permisos.find(
      (p) => p.permiso.codigo === permiso && p.otorgado
    );
    if (permisoAdicional) {
      return true;
    }
  }
  return false;
}

/**
 * Obtener todos los permisos de un usuario (base + adicionales)
 */
export function getPermisosUsuario(usuario) {
  const permisosBase = getPermisosBaseRol(usuario.role);
  const permisosAdicionales = usuario.permisos
    ? usuario.permisos.filter((p) => p.otorgado).map((p) => p.permiso.codigo)
    : [];
  return [...new Set([...permisosBase, ...permisosAdicionales])];
}

/**
 * Agrupar permisos por categoría
 */
export function agruparPermisosPorCategoria() {
  const grupos = {};
  PERMISOS_DISPONIBLES.forEach((permiso) => {
    if (!grupos[permiso.categoria]) {
      grupos[permiso.categoria] = [];
    }
    grupos[permiso.categoria].push(permiso);
  });
  return grupos;
}
