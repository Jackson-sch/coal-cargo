# 💾 Sistema de Respaldos - Guía de Configuración

Este documento explica cómo configurar y usar el sistema de respaldos del sistema Coal Cargo.

## 📋 Características

- ✅ Respaldos manuales y automáticos
- ✅ Restauración de respaldos con validación de integridad
- ✅ Compresión de respaldos (opcional)
- ✅ Limpieza automática de respaldos antiguos
- ✅ Notificaciones por email
- ✅ Verificación de checksum (SHA-256)
- ✅ Soporte para respaldos completos y parciales

## 🚀 Configuración Inicial

### 1. Configurar Variables de Entorno

```env
# URL de la base de datos (requerido)
DATABASE_URL=postgresql://user:password@localhost:5432/coalcargo

# Token secreto para respaldos automáticos (opcional pero recomendado)
BACKUP_CRON_SECRET=tu_token_secreto_muy_largo_y_seguro
```

### 2. Verificar Instalación de Herramientas

El sistema requiere:
- **PostgreSQL**: `pg_dump` y `psql` deben estar instalados y en el PATH
- **gzip**: Para compresión (opcional, generalmente ya está instalado)

Verificar instalación:
```bash
pg_dump --version
psql --version
gzip --version
```

### 3. Configurar Respaldos Automáticos

#### Opción A: Vercel Cron Jobs (Recomendado para Vercel)

Crea un archivo `vercel.json` en la raíz del proyecto:

```json
{
  "crons": [
    {
      "path": "/api/respaldos/ejecutar-automatico?token=TU_SECRET_TOKEN",
      "schedule": "0 2 * * *"
    }
  ]
}
```

#### Opción B: Cron Job Externo (cron-job.org, GitHub Actions, etc.)

Configura un cron job que llame a:
```
https://tudominio.com/api/respaldos/ejecutar-automatico?token=TU_SECRET_TOKEN
```

**Frecuencias disponibles:**
- `0 * * * *` - Cada hora
- `0 */6 * * *` - Cada 6 horas
- `0 */12 * * *` - Cada 12 horas
- `0 2 * * *` - Diario a las 2 AM
- `0 2 * * 0` - Semanal (domingos a las 2 AM)
- `0 2 1 * *` - Mensual (primer día del mes a las 2 AM)

## 📝 Configuración en el Sistema

### Acceder a la Configuración

1. Ir a `/dashboard/respaldo`
2. Configurar los parámetros:
   - **Respaldos automáticos**: Habilitar/deshabilitar
   - **Frecuencia**: Cada hora, 6 horas, 12 horas, diario, semanal, mensual
   - **Hora de ejecución**: Formato HH:MM (ej: 02:00)
   - **Días de retención**: Cuántos días mantener los respaldos
   - **Máximo de respaldos**: Número máximo de respaldos a mantener
   - **Ruta local**: Directorio donde guardar los respaldos (ej: `./backups`)
   - **Comprimir respaldos**: Habilitar compresión gzip
   - **Nivel de compresión**: 1-9 (mayor número = más compresión, más lento)
   - **Notificar éxito/error**: Enviar emails de notificación
   - **Emails de notificación**: Lista de emails separados por coma

## 🔧 Uso del Sistema

### Crear Respaldo Manual

1. Ir a `/dashboard/respaldo`
2. Click en "Crear Respaldo"
3. Llenar el formulario:
   - **Nombre**: Nombre descriptivo
   - **Descripción**: (Opcional)
   - **Tipo**: Manual, Automático, Programado, Emergencia
4. Click en "Crear"

El respaldo se ejecutará en segundo plano. Puedes ver el progreso en tiempo real.

### Restaurar Respaldo

1. Ir a `/dashboard/respaldo`
2. Seleccionar un respaldo completado
3. Click en "Restaurar"
4. Configurar opciones:
   - **Crear respaldo antes**: Recomendado (crea un respaldo del estado actual)
   - **Restaurar completo**: Restaurar toda la base de datos
   - **Tablas seleccionadas**: (Si no es completo) Seleccionar tablas específicas
   - **Sobrescribir datos**: Sobrescribir datos existentes
5. Click en "Restaurar"

⚠️ **ADVERTENCIA**: La restauración sobrescribirá los datos actuales. Asegúrate de crear un respaldo previo.

### Ver Historial de Respaldos

El historial muestra:
- Estado del respaldo (Completado, Fallido, En progreso)
- Tamaño del archivo
- Fecha y hora de creación
- Duración del proceso
- Checksum (para verificación de integridad)

## 🔐 Seguridad

### Token de Seguridad

Para proteger la API de respaldos automáticos, configura `BACKUP_CRON_SECRET`:

```env
BACKUP_CRON_SECRET=tu_token_secreto_muy_largo_y_seguro_1234567890
```

Luego, usa este token en la URL del cron job:
```
https://tudominio.com/api/respaldos/ejecutar-automatico?token=tu_token_secreto_muy_largo_y_seguro_1234567890
```

### Permisos

Solo usuarios con rol `SUPER_ADMIN` o `ADMIN_SUCURSAL` pueden:
- Crear respaldos
- Restaurar respaldos
- Configurar respaldos automáticos
- Eliminar respaldos

### Encriptación

Los respaldos se almacenan en el servidor. Para mayor seguridad:
1. Almacena los respaldos en una ubicación segura
2. Considera usar almacenamiento en la nube (AWS S3, Google Cloud Storage, etc.)
3. Encripta los archivos antes de almacenarlos en la nube

## 📊 Monitoreo

### Estadísticas

El sistema proporciona estadísticas en tiempo real:
- Total de respaldos
- Respaldos exitosos vs fallidos
- Tasa de éxito
- Tiempo promedio de respaldo
- Espacio utilizado

### Notificaciones

El sistema puede enviar notificaciones por email cuando:
- Un respaldo se completa exitosamente
- Un respaldo falla
- Una restauración se completa exitosamente
- Una restauración falla

## 🛠️ Solución de Problemas

### Error: "DATABASE_URL no configurada"

Verifica que la variable de entorno `DATABASE_URL` esté configurada correctamente.

### Error: "pg_dump no encontrado"

Instala PostgreSQL o agrega `pg_dump` al PATH del sistema.

### Error: "Timeout después de X segundos"

Aumenta el timeout en la configuración de respaldos (configuración avanzada).

### Error: "No se pudo crear el archivo de respaldo"

Verifica que el directorio de respaldos tenga permisos de escritura.

### Error: "Checksum del archivo no coincide"

El archivo puede estar corrupto. Intenta crear un nuevo respaldo.

## 📚 API Reference

### Endpoints

#### `GET /api/respaldos/ejecutar-automatico?token=TOKEN`

Ejecuta un respaldo automático según la configuración.

**Parámetros:**
- `token` (query, requerido): Token de seguridad

**Respuesta:**
```json
{
  "success": true,
  "message": "Respaldo automático ejecutado",
  "executed": true,
  "result": {
    "respaldoId": "respaldo-123"
  }
}
```

## 🔄 Flujo de Respaldo Automático

1. El cron job llama a `/api/respaldos/ejecutar-automatico`
2. El sistema verifica la configuración
3. Si debe ejecutarse según la frecuencia, crea un respaldo
4. El respaldo se ejecuta en segundo plano
5. Se limpian respaldos antiguos si es necesario
6. Se envían notificaciones si están configuradas

## 📦 Almacenamiento

### Local

Por defecto, los respaldos se almacenan en `./backups`. Puedes cambiar esta ruta en la configuración.

### Nube (Próximamente)

El sistema está preparado para almacenamiento en la nube (AWS S3, Google Cloud Storage, Azure). Esta funcionalidad se implementará en una versión futura.

## ⚙️ Configuración Avanzada

### Timeout

El timeout por defecto es de 3600 segundos (1 hora). Puedes ajustarlo en la configuración.

### Compresión

La compresión reduce el tamaño de los respaldos pero aumenta el tiempo de ejecución. El nivel de compresión va de 1 (rápido, menos compresión) a 9 (lento, máxima compresión).

### Retención

El sistema automáticamente elimina respaldos antiguos según:
- **Días de retención**: Respaldos más antiguos que X días
- **Máximo de respaldos**: Si hay más de X respaldos, elimina los más antiguos

---

*Última actualización: $(date)*

