# 🔐 Sistema de Roles y Permisos - Coal Cargo

## 📋 Roles del Sistema

### 1. **SUPER_ADMIN** (Super Administrador)

- **Descripción**: Acceso completo al sistema sin restricciones
- **Acceso**: Todos los módulos y funcionalidades
- **Uso**: Administrador principal del sistema

### 2. **ADMIN_SUCURSAL** (Administrador de Sucursal)

- **Descripción**: Gestión completa de una sucursal específica
- **Acceso**: Módulos relacionados con su sucursal
- **Restricciones**: No puede gestionar otras sucursales ni configuraciones globales
- **Uso**: Gerente o administrador de una sucursal

### 3. **OPERADOR** (Operador)

- **Descripción**: Operaciones básicas del sistema
- **Acceso**: Operaciones de registro y consulta
- **Restricciones**: No puede eliminar ni modificar configuraciones
- **Uso**: Personal operativo de la sucursal

### 4. **CONDUCTOR** (Conductor)

- **Descripción**: Gestión de envíos y rutas asignadas
- **Acceso**: Envíos asignados, seguimiento, actualización de estados
- **Restricciones**: Solo puede ver y actualizar envíos asignados
- **Uso**: Conductor de vehículos

### 5. **CONTADOR** (Contador)

- **Descripción**: Acceso a reportes financieros y facturación
- **Acceso**: Reportes, facturación, cuentas por cobrar
- **Restricciones**: No puede modificar operaciones
- **Uso**: Personal de contabilidad

### 6. **CLIENTE** (Cliente)

- **Descripción**: Acceso limitado para clientes externos
- **Acceso**: Seguimiento de envíos propios, crear cotizaciones
- **Restricciones**: Solo puede ver sus propios envíos
- **Uso**: Clientes externos del sistema

---

## 🎯 Permisos por Módulo - ADMIN_SUCURSAL

### ✅ **ACCESO COMPLETO** (con filtro por sucursal)

#### 1. **Dashboard** ✅

- **Ver**: Dashboard principal con métricas de su sucursal
- **Ver**: Estadísticas de su sucursal
- **Ver**: Reportes de su sucursal
- **Restricción**: Solo datos relacionados con su sucursal

#### 2. **Operaciones** ✅

##### 2.1. **Envíos** ✅

- **Ver**: Todos los envíos de su sucursal (origen o destino)
- **Crear**: Nuevos envíos desde su sucursal
- **Editar**: Envíos de su sucursal
- **Asignar**: Asignar envíos a conductores/vehículos de su sucursal
- **Ver**: Envíos en tránsito de su sucursal
- **Ver**: Envíos entregados de su sucursal
- **Restricción**: No puede eliminar envíos (solo anular)
- **Restricción**: Solo puede ver envíos relacionados con su sucursal

##### 2.2. **Cotizaciones** ✅

- **Ver**: Cotizaciones de su sucursal
- **Crear**: Nuevas cotizaciones
- **Editar**: Cotizaciones de su sucursal
- **Convertir**: Convertir cotizaciones en envíos
- **Restricción**: Solo cotizaciones de su sucursal

##### 2.3. **Seguimiento** ✅

- **Ver**: Seguimiento de envíos de su sucursal
- **Actualizar**: Estados de envíos de su sucursal
- **Crear**: Eventos de seguimiento
- **Restricción**: Solo envíos de su sucursal

#### 3. **Clientes** ✅

- **Ver**: Todos los clientes (sin restricción)
- **Crear**: Nuevos clientes
- **Editar**: Información de clientes
- **Ver**: Historial de envíos (filtrado por sucursal)
- **Exportar**: Lista de clientes
- **Restricción**: No puede eliminar clientes permanentemente
- **Restricción**: Historial muestra solo envíos relacionados con su sucursal

#### 4. **Vehículos** ✅

- **Ver**: Vehículos asignados a su sucursal
- **Crear**: Nuevos vehículos (asignados a su sucursal)
- **Editar**: Información de vehículos de su sucursal
- **Ver**: Estado de vehículos de su sucursal
- **Restricción**: Solo puede gestionar vehículos de su sucursal
- **Restricción**: No puede eliminar vehículos (solo desactivar)

#### 5. **Rutas** ✅

- **Ver**: Rutas que involucren su sucursal
- **Crear**: Nuevas rutas (con su sucursal como origen o destino)
- **Editar**: Rutas de su sucursal
- **Ver**: Estado de rutas
- **Restricción**: Solo rutas relacionadas con su sucursal
- **Restricción**: No puede eliminar rutas (solo cancelar)

#### 6. **Pagos** ✅

- **Ver**: Pagos de envíos de su sucursal
- **Registrar**: Nuevos pagos
- **Ver**: Vouchers de pago
- **Restricción**: Solo pagos de envíos de su sucursal

#### 7. **Finanzas** (Limitado) ⚠️

##### 7.1. **Facturación** ⚠️

- **Ver**: Comprobantes de su sucursal
- **Emitir**: Comprobantes para envíos de su sucursal
- **Ver**: Estados de comprobantes
- **Restricción**: Solo puede emitir para envíos de su sucursal
- **Restricción**: No puede configurar datos de facturación (SUNAT)

##### 7.2. **Reportes Financieros** ✅

- **Ver**: Reportes financieros de su sucursal
- **Exportar**: Reportes de su sucursal
- **Restricción**: Solo datos de su sucursal

##### 7.3. **Cuentas por Cobrar** ✅

- **Ver**: Cuentas por cobrar de su sucursal
- **Ver**: Detalle de cuentas pendientes
- **Restricción**: Solo de su sucursal

#### 8. **Configuraciones** (Limitado) ⚠️

##### 8.1. **Tarifas** ⚠️

- **Ver**: Tarifas de su sucursal
- **Restricción**: Solo lectura (no puede crear/editar tarifas)

##### 8.2. **Usuarios** ✅

- **Ver**: Usuarios de su sucursal
- **Crear**: Nuevos usuarios (solo OPERADOR y CONDUCTOR)
- **Editar**: Usuarios de su sucursal (solo OPERADOR y CONDUCTOR)
- **Restricción**: Solo puede gestionar usuarios de su sucursal
- **Restricción**: Solo puede crear/editar OPERADOR y CONDUCTOR
- **Restricción**: No puede crear/editar ADMIN_SUCURSAL o SUPER_ADMIN
- **Restricción**: No puede eliminar usuarios (solo desactivar)

##### 8.3. **Notificaciones** ✅

- **Ver**: Configuración de notificaciones
- **Editar**: Configuración de notificaciones de su sucursal
- **Restricción**: Solo configuración de su sucursal

##### 8.4. **General** ❌

- **Acceso**: DENEGADO
- **Razón**: Configuración global del sistema (solo SUPER_ADMIN)

##### 8.5. **Sistema** ❌

- **Acceso**: DENEGADO
- **Razón**: Configuración del sistema (solo SUPER_ADMIN)

#### 9. **Administración** (Limitado) ⚠️

##### 9.1. **Sucursales** ❌

- **Acceso**: DENEGADO
- **Razón**: Solo SUPER_ADMIN puede gestionar sucursales
- **Nota**: Puede ver información de su propia sucursal en el dashboard

##### 9.2. **Auditoría** ⚠️

- **Ver**: Logs de auditoría de su sucursal
- **Restricción**: Solo eventos relacionados con su sucursal
- **Restricción**: No puede eliminar logs

##### 9.3. **Respaldos** ❌

- **Acceso**: DENEGADO
- **Razón**: Solo SUPER_ADMIN puede gestionar respaldos del sistema

---

## 🔒 Resumen de Restricciones - ADMIN_SUCURSAL

### ❌ **NO PUEDE**:

1. Gestionar otras sucursales
2. Crear/editar usuarios con rol SUPER_ADMIN o ADMIN_SUCURSAL
3. Eliminar registros permanentemente (solo soft delete/desactivar)
4. Configurar datos globales del sistema
5. Gestionar respaldos del sistema
6. Configurar datos de facturación (SUNAT)
7. Crear/editar tarifas (solo lectura)
8. Ver datos de otras sucursales

### ✅ **PUEDE**:

1. Gestionar completamente su sucursal
2. Crear/editar usuarios OPERADOR y CONDUCTOR de su sucursal
3. Gestionar envíos, clientes, vehículos, rutas de su sucursal
4. Ver reportes y estadísticas de su sucursal
5. Emitir comprobantes para envíos de su sucursal
6. Configurar notificaciones de su sucursal
7. Ver logs de auditoría de su sucursal

---

## 📊 Matriz de Acceso por Módulo

| Módulo                    | SUPER_ADMIN | ADMIN_SUCURSAL                   | OPERADOR        | CONDUCTOR       | CONTADOR        | CLIENTE      |
| ------------------------- | ----------- | -------------------------------- | --------------- | --------------- | --------------- | ------------ |
| **Dashboard**             | ✅ Completo | ✅ Sucursal                      | ✅ Sucursal     | ✅ Limitado     | ✅ Limitado     | ❌           |
| **Envíos**                | ✅ Completo | ✅ Sucursal                      | ✅ Sucursal     | ⚠️ Asignados    | ⚠️ Solo lectura | ⚠️ Propios   |
| **Cotizaciones**          | ✅ Completo | ✅ Sucursal                      | ✅ Sucursal     | ❌              | ❌              | ✅ Crear/Ver |
| **Clientes**              | ✅ Completo | ✅ Completo                      | ✅ Completo     | ⚠️ Solo lectura | ⚠️ Solo lectura | ❌           |
| **Vehículos**             | ✅ Completo | ✅ Sucursal                      | ⚠️ Solo lectura | ⚠️ Asignados    | ❌              | ❌           |
| **Rutas**                 | ✅ Completo | ✅ Sucursal                      | ⚠️ Solo lectura | ⚠️ Asignadas    | ❌              | ❌           |
| **Pagos**                 | ✅ Completo | ✅ Sucursal                      | ✅ Sucursal     | ❌              | ✅ Completo     | ❌           |
| **Facturación**           | ✅ Completo | ⚠️ Sucursal                      | ❌              | ❌              | ✅ Completo     | ❌           |
| **Reportes**              | ✅ Completo | ✅ Sucursal                      | ⚠️ Solo lectura | ❌              | ✅ Completo     | ❌           |
| **Tarifas**               | ✅ Completo | ⚠️ Solo lectura                  | ⚠️ Solo lectura | ❌              | ⚠️ Solo lectura | ❌           |
| **Usuarios**              | ✅ Completo | ⚠️ Sucursal (Operador/Conductor) | ❌              | ❌              | ❌              | ❌           |
| **Notificaciones**        | ✅ Completo | ✅ Sucursal                      | ❌              | ❌              | ❌              | ❌           |
| **Sucursales**            | ✅ Completo | ❌                               | ❌              | ❌              | ❌              | ❌           |
| **Auditoría**             | ✅ Completo | ⚠️ Sucursal                      | ❌              | ❌              | ❌              | ❌           |
| **Respaldos**             | ✅ Completo | ❌                               | ❌              | ❌              | ❌              | ❌           |
| **Configuración General** | ✅ Completo | ❌                               | ❌              | ❌              | ❌              | ❌           |
| **Configuración Sistema** | ✅ Completo | ❌                               | ❌              | ❌              | ❌              | ❌           |

**Leyenda**:

- ✅ **Completo**: Acceso total sin restricciones
- ✅ **Sucursal**: Acceso completo pero filtrado por sucursal
- ⚠️ **Limitado**: Acceso parcial con restricciones
- ⚠️ **Solo lectura**: Solo puede ver, no puede modificar
- ⚠️ **Asignados/Propios**: Solo puede ver sus propios/asignados
- ❌ **Denegado**: Sin acceso

---

## 🛠️ Implementación Técnica

### Filtrado por Sucursal

- Todos los módulos deben filtrar automáticamente por `user.sucursalId` cuando `user.role === "ADMIN_SUCURSAL"`
- El filtro debe aplicarse en:
  - Queries de base de datos
  - Dashboard y estadísticas
  - Reportes
  - Listados y búsquedas

### Validación de Permisos

- Validar permisos en cada acción del servidor
- Validar en el frontend para ocultar opciones no permitidas
- Mostrar mensajes claros cuando se intenta acceder a funciones no permitidas

### Jerarquía de Roles

- ADMIN_SUCURSAL no puede crear/editar usuarios con rol superior o igual
- ADMIN_SUCURSAL solo puede asignar usuarios a su sucursal
- ADMIN_SUCURSAL no puede eliminar usuarios, solo desactivar

---

## 📝 Notas de Implementación

1. **Filtrado Automático**: Todos los módulos deben implementar filtrado automático por sucursal
2. **Validación en Servidor**: Siempre validar permisos en las server actions
3. **UI Condicional**: Mostrar/ocultar opciones según permisos del usuario
4. **Mensajes Claros**: Informar al usuario cuando intenta realizar una acción no permitida
5. **Auditoría**: Registrar todos los intentos de acceso no autorizado

---

_Última actualización: 2025-01-XX_
