# ✅ Verificación del Sistema de Respaldos

## Estado Actual

### ✅ PostgreSQL Instalado
- **Ubicación**: `C:\Program Files\PostgreSQL\17`
- **Versión**: PostgreSQL 17.4
- **pg_dump**: Disponible en `C:\Program Files\PostgreSQL\17\bin\pg_dump.exe`
- **psql**: Disponible en `C:\Program Files\PostgreSQL\17\bin\psql.exe`

### ✅ PATH Actualizado
- PostgreSQL 17/bin ha sido agregado al PATH del usuario
- **⚠️ IMPORTANTE**: Necesitas **reiniciar tu terminal/IDE** para que los cambios surtan efecto

## 🔍 Cómo Verificar que Funciona

### Opción 1: Verificar desde la Interfaz Web

1. **Reinicia tu servidor de desarrollo** (si está corriendo):
   ```bash
   # Detén el servidor (Ctrl+C) y vuelve a iniciarlo
   npm run dev
   ```

2. **Abre la aplicación en el navegador**:
   - Ve a: `http://localhost:3000/dashboard/respaldo`

3. **Haz clic en "Verificar Sistema"**:
   - Debería mostrar: ✅ "El sistema de respaldos está listo para usar"

4. **Intenta crear un respaldo**:
   - Haz clic en "Crear Respaldo"
   - El respaldo se ejecutará en segundo plano
   - Puedes ver el progreso en tiempo real

### Opción 2: Verificar desde Terminal

Abre una **nueva terminal** (importante: nueva, para que detecte el PATH actualizado):

```powershell
# Verificar pg_dump
pg_dump --version
# Debería mostrar: pg_dump (PostgreSQL) 17.4

# Verificar psql
psql --version
# Debería mostrar: psql (PostgreSQL) 17.4

# Verificar que puedes conectarte a la base de datos
# (Reemplaza con tus credenciales)
psql -h localhost -U tu_usuario -d tu_base_de_datos -c "SELECT version();"
```

## 🧪 Prueba de Respaldo Manual

Para probar que el respaldo funciona manualmente:

```powershell
# Asegúrate de que PostgreSQL esté en el PATH
$env:Path += ";C:\Program Files\PostgreSQL\17\bin"

# Crear un respaldo de prueba
# (Reemplaza DATABASE_URL con tu URL de conexión)
pg_dump "postgresql://usuario:contraseña@localhost:5432/coalcargo" > ./backups/test-backup.sql

# Verificar que el archivo se creó
Test-Path ./backups/test-backup.sql

# Ver el tamaño del archivo
(Get-Item ./backups/test-backup.sql).Length
```

## 🐛 Solución de Problemas

### Si pg_dump sigue sin funcionar después de reiniciar:

1. **Verifica el PATH manualmente**:
   ```powershell
   $env:Path -split ';' | Select-String "PostgreSQL"
   ```

2. **Si no aparece, agrégalo temporalmente**:
   ```powershell
   $env:Path += ";C:\Program Files\PostgreSQL\17\bin"
   ```

3. **Verifica que funciona**:
   ```powershell
   pg_dump --version
   ```

4. **Agrega permanentemente al PATH del sistema**:
   - Ve a: Panel de Control > Sistema > Configuración avanzada del sistema
   - Haz clic en "Variables de entorno"
   - En "Variables del sistema", busca "Path" y haz clic en "Editar"
   - Haz clic en "Nuevo" y agrega: `C:\Program Files\PostgreSQL\17\bin`
   - Reinicia tu computadora

### Si DATABASE_URL no está configurada:

1. Crea o edita el archivo `.env.local` en la raíz del proyecto
2. Agrega:
   ```env
   DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/coalcargo
   ```
3. Reinicia el servidor de desarrollo

### Si hay errores de permisos:

1. Verifica que tengas permisos de escritura en el directorio `./backups`:
   ```powershell
   Test-Path ./backups
   New-Item -ItemType Directory -Force -Path "./backups"
   ```

2. Si usas Windows, ejecuta PowerShell como Administrador si es necesario

## ✅ Checklist de Verificación

- [ ] PostgreSQL está instalado
- [ ] pg_dump está en el PATH (verificar con `pg_dump --version`)
- [ ] DATABASE_URL está configurada en `.env.local`
- [ ] El directorio `./backups` existe y tiene permisos de escritura
- [ ] El servidor de desarrollo está corriendo
- [ ] Has reiniciado tu terminal/IDE después de agregar al PATH
- [ ] La verificación del sistema pasa (botón "Verificar Sistema")
- [ ] Puedes crear un respaldo desde la interfaz

## 📝 Notas

- Los cambios en el PATH solo surten efecto en **nuevas ventanas de terminal**
- Si tu servidor de desarrollo está corriendo, **debes reiniciarlo** después de cambiar el PATH
- Si usas VSCode/Cursor, **cierra y vuelve a abrir** el editor completamente

---

*Última actualización: $(Get-Date)*

