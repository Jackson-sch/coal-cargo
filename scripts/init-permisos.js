const { PrismaClient } = require('../src/generated/prisma/client'); // Permisos disponibles (versión CommonJS) const PERMISOS_DISPONIBLES = [ // Dashboard {
    codigo: "dashboard.view", nombre: "Ver Dashboard", categoria: "Dashboard", descripcion: "Acceso al panel principal", }, // Clientes {
    codigo: "clientes.view", nombre: "Ver Clientes", categoria: "Clientes", descripcion: "Visualizar lista de clientes", }, {
    codigo: "clientes.create", nombre: "Crear Clientes", categoria: "Clientes", descripcion: "Registrar nuevos clientes", }, {
    codigo: "clientes.edit", nombre: "Editar Clientes", categoria: "Clientes", descripcion: "Modificar datos de clientes", }, {
    codigo: "clientes.delete", nombre: "Eliminar Clientes", categoria: "Clientes", descripcion: "Eliminar clientes del sistema", }, {
    codigo: "clientes.export", nombre: "Exportar Clientes", categoria: "Clientes", descripcion: "Exportar datos de clientes", }, // Envíos {
    codigo: "envios.view", nombre: "Ver Envíos", categoria: "Envíos", descripcion: "Visualizar lista de envíos", }, {
    codigo: "envios.create", nombre: "Crear Envíos", categoria: "Envíos", descripcion: "Registrar nuevos envíos", }, {
    codigo: "envios.edit", nombre: "Editar Envíos", categoria: "Envíos", descripcion: "Modificar datos de envíos", }, {
    codigo: "envios.delete", nombre: "Eliminar Envíos", categoria: "Envíos", descripcion: "Eliminar envíos del sistema", }, {
    codigo: "envios.assign", nombre: "Asignar Envíos", categoria: "Envíos", descripcion: "Asignar envíos a conductores", }, // Cotizaciones {
    codigo: "cotizaciones.view", nombre: "Ver Cotizaciones", categoria: "Cotizaciones", descripcion: "Visualizar cotizaciones", }, {
    codigo: "cotizaciones.create", nombre: "Crear Cotizaciones", categoria: "Cotizaciones", descripcion: "Generar nuevas cotizaciones", }, {
    codigo: "cotizaciones.edit", nombre: "Editar Cotizaciones", categoria: "Cotizaciones", descripcion: "Modificar cotizaciones", }, {
    codigo: "cotizaciones.delete", nombre: "Eliminar Cotizaciones", categoria: "Cotizaciones", descripcion: "Eliminar cotizaciones", }, // Seguimiento {
    codigo: "seguimiento.view", nombre: "Ver Seguimiento", categoria: "Seguimiento", descripcion: "Acceso básico al seguimiento", }, {
    codigo: "seguimiento.all", nombre: "Seguimiento Completo", categoria: "Seguimiento", descripcion: "Ver todos los envíos del sistema", }, {
    codigo: "seguimiento.sucursal", nombre: "Seguimiento Sucursal", categoria: "Seguimiento", descripcion: "Ver envíos de su sucursal", }, {
    codigo: "seguimiento.own", nombre: "Seguimiento Propio", categoria: "Seguimiento", descripcion: "Ver solo sus propios envíos", }, {
    codigo: "seguimiento.update", nombre: "Actualizar Seguimiento", categoria: "Seguimiento", descripcion: "Actualizar estado de envíos", }, // Usuarios {
    codigo: "usuarios.view", nombre: "Ver Usuarios", categoria: "Usuarios", descripcion: "Visualizar lista de usuarios", }, {
    codigo: "usuarios.create", nombre: "Crear Usuarios", categoria: "Usuarios", descripcion: "Registrar nuevos usuarios", }, {
    codigo: "usuarios.edit", nombre: "Editar Usuarios", categoria: "Usuarios", descripcion: "Modificar datos de usuarios", }, {
    codigo: "usuarios.delete", nombre: "Eliminar Usuarios", categoria: "Usuarios", descripcion: "Eliminar usuarios del sistema", }, // Configuración {
    codigo: "configuracion.view", nombre: "Ver Configuración", categoria: "Configuración", descripcion: "Acceso a configuraciones", }, {
    codigo: "configuracion.edit", nombre: "Editar Configuración", categoria: "Configuración", descripcion: "Modificar configuraciones del sistema", }, // Reportes {
    codigo: "reportes.view", nombre: "Ver Reportes", categoria: "Reportes", descripcion: "Acceso a reportes básicos", }, {
    codigo: "reportes.export", nombre: "Exportar Reportes", categoria: "Reportes", descripcion: "Exportar reportes a archivos", }, {
    codigo: "reportes.financial", nombre: "Reportes Financieros", categoria: "Reportes", descripcion: "Acceso a reportes financieros", }, {
    codigo: "reportes.sucursal", nombre: "Reportes Sucursal", categoria: "Reportes", descripcion: "Reportes de su sucursal", }, // Tarifas {
    codigo: "tarifas.view", nombre: "Ver Tarifas", categoria: "Tarifas", descripcion: "Visualizar tarifas del sistema", }, {
    codigo: "tarifas.create", nombre: "Crear Tarifas", categoria: "Tarifas", descripcion: "Registrar nuevas tarifas", }, {
    codigo: "tarifas.edit", nombre: "Editar Tarifas", categoria: "Tarifas", descripcion: "Modificar tarifas existentes", }, {
    codigo: "tarifas.delete", nombre: "Eliminar Tarifas", categoria: "Tarifas", descripcion: "Eliminar tarifas del sistema", }, // Sucursales {
    codigo: "sucursales.view", nombre: "Ver Sucursales", categoria: "Sucursales", descripcion: "Visualizar sucursales", }, {
    codigo: "sucursales.create", nombre: "Crear Sucursales", categoria: "Sucursales", descripcion: "Registrar nuevas sucursales", }, {
    codigo: "sucursales.edit", nombre: "Editar Sucursales", categoria: "Sucursales", descripcion: "Modificar datos de sucursales", }, {
    codigo: "sucursales.delete", nombre: "Eliminar Sucursales", categoria: "Sucursales", descripcion: "Eliminar sucursales", }, // Vehículos {
    codigo: "vehiculos.view", nombre: "Ver Vehículos", categoria: "Vehículos", descripcion: "Visualizar vehículos", }, {
    codigo: "vehiculos.create", nombre: "Crear Vehículos", categoria: "Vehículos", descripcion: "Registrar nuevos vehículos", }, {
    codigo: "vehiculos.edit", nombre: "Editar Vehículos", categoria: "Vehículos", descripcion: "Modificar datos de vehículos", }, {
    codigo: "vehiculos.delete", nombre: "Eliminar Vehículos", categoria: "Vehículos", descripcion: "Eliminar vehículos", }, ]; const prisma = new PrismaClient(); async function inicializarPermisos() { try { console.log("🚀 Inicializando permisos en la base de datos..."); for (const permiso of PERMISOS_DISPONIBLES) { await prisma.permisos.upsert({ where: { codigo: permiso.codigo }, update: { nombre: permiso.nombre, descripcion: permiso.descripcion, categoria: permiso.categoria, }, create: { codigo: permiso.codigo, nombre: permiso.nombre, descripcion: permiso.descripcion, categoria: permiso.categoria, }, }); console.log(`✅ Permiso: ${permiso.codigo}`); }

    console.log( `\n🎉 ${PERMISOS_DISPONIBLES.length} permisos inicializados correctamente` ); } catch (error) { console.error("❌ Error al inicializar permisos:", error); } finally { await prisma.$disconnect(); }
} inicializarPermisos();
