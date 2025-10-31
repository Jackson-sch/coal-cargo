/** * Sistema de Permisos Híbrido * Combina roles base (enum) con permisos granulares (BD) */ // Permisos base por rol (siempre activo s) export const PERMISOS_BASE_POR_ROL = { SUPER_ADMIN: [ // Acceso complet o "dashboard.view", "clientes.view", "clientes.create", "clientes.edit", "clientes.delete", "clientes.export", "envios.view", "envios.create", "envios.edit", "envios.delete", "envios.assign", "cotizaciones.view", "cotizaciones.create", "cotizaciones.edit", "cotizaciones.delete", "seguimiento.view", "seguimiento.all", "usuarios.view", "usuarios.create", "usuarios.edit", "usuarios.delete", "configuracion.view", "configuracion.edit", "reportes.view", "reportes.export", "tarifas.view", "tarifas.create", "tarifas.edit", "tarifas.delete", "sucursales.view", "sucursales.create", "sucursales.edit", "sucursales.delete", "vehiculos.view", "vehiculos.create", "vehiculos.edit", "vehiculos.delete", ], ADMIN_SUCURSAL: [ "dashboard.view", "clientes.view", "clientes.create", "clientes.edit", "clientes.export", "envios.view", "envios.create", "envios.edit", "envios.assign", "cotizaciones.view", "cotizaciones.create", "cotizaciones.edit", "seguimiento.view", "seguimiento.sucursal", "usuarios.view", "usuarios.create", "usuarios.edit", "reportes.view", "reportes.sucursal", "tarifas.view", "vehiculos.view", "vehiculos.edit", ], OPERADOR: [ "dashboard.view", "clientes.view", "clientes.create", "clientes.edit", "envios.view", "envios.create", "envios.edit", "cotizaciones.view", "cotizaciones.create", "seguimiento.view", "tarifas.view", ], CONDUCTOR: [ "dashboard.view", "envios.view", "envios.edit", "seguimiento.view", "seguimiento.update", "clientes.view", ], CONTADOR: [ "dashboard.view", "reportes.view", "reportes.export", "reportes.financial", "envios.view", "clientes.view", "tarifas.view", ], CLIENTE: ["seguimiento.own", "cotizaciones.create", "cotizaciones.view"], }; // Definición de todos los permisos disponible s
export const PERMISOS_DISPONIBLES = [
  // Dashboar d
  {
    codigo: "dashboard.view",
    nombre: "Ver Dashboard",
    categoria: "Dashboard",
    descripcion: "Acceso al panel principal",
  }, // Cliente s
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
  }, // Envío s
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
  }, // Cotizacione s
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
  }, // Seguimient o
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
  }, // Usuario s
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
  }, // Configuració n
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
  }, // Reporte s
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
  }, // Tarifa s
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
  }, // Sucursale s
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
  }, // Vehículo s
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
];
/** * Obtener permisos base de un rol */ export function getPermisosBaseRol(
  rol
) {
  return PERMISOS_BASE_POR_ROL[rol] || [];
}

/** * Verificar si un usuario tiene un permiso específico */ export function tienePermiso(
  usuario,
  permiso
) {
  // 1. Verificar permisos base del ro l
  const permisosBase = getPermisosBaseRol(usuario.role);
  if (permisosBase.includes(permiso)) {
    return true;
  }

  // 2. Verificar permisos adicionales de la B D
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

/** * Obtener todos los permisos de un usuario (base + adicionales) */ export function getPermisosUsuario(
  usuario
) {
  const permisosBase = getPermisosBaseRol(usuario.role);
  const permisosAdicionales = usuario.permisos
    ? usuario.permisos.filter((p) => p.otorgado).map((p) => p.permiso.codigo)
    : [];
  return [...new Set([...permisosBase, ...permisosAdicionales])];
}

/** * Agrupar permisos por categoría */ export function agruparPermisosPorCategoria() {
  const grupos = {};
  PERMISOS_DISPONIBLES.forEach((permiso) => {
    if (!grupos[permiso.categoria]) {
      grupos[permiso.categoria] = [];
    }
    grupos[permiso.categoria].push(permiso);
  });
  return grupos;
}
