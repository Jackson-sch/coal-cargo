# 🔧 Solución: pg_dump no está disponible

El sistema detectó que `pg_dump` no está instalado o no está en el PATH del sistema.

## 📋 Opciones de Solución

### Opción 1: Instalar PostgreSQL (Recomendado)

Si PostgreSQL no está instalado, necesitas instalarlo:

1. **Descargar PostgreSQL:**
   - Ve a: https://www.postgresql.org/download/windows/
   - Descarga el instalador para Windows

2. **Instalar PostgreSQL:**
   - Ejecuta el instalador
   - Durante la instalación, asegúrate de marcar la opción **"Add PostgreSQL bin directory to PATH"**
   - Esto agregará automáticamente `pg_dump` y `psql` al PATH

3. **Verificar instalación:**
   ```powershell
   pg_dump --version
   psql --version
   ```

### Opción 2: Agregar pg_dump al PATH (Si PostgreSQL ya está instalado)

Si PostgreSQL ya está instalado pero no está en el PATH:

1. **Encontrar la ubicación de pg_dump:**
   - Generalmente está en: `C:\Program Files\PostgreSQL\[VERSION]\bin\`
   - Por ejemplo: `C:\Program Files\PostgreSQL\15\bin\`

2. **Agregar al PATH del sistema:**
   
   **Método A: Desde la interfaz de Windows**
   - Presiona `Win + R`, escribe `sysdm.cpl` y presiona Enter
   - Ve a la pestaña "Opciones avanzadas"
   - Haz clic en "Variables de entorno"
   - En "Variables del sistema", busca "Path" y haz clic en "Editar"
   - Haz clic en "Nuevo" y agrega la ruta: `C:\Program Files\PostgreSQL\[VERSION]\bin`
   - Haz clic en "Aceptar" en todas las ventanas
   - **Reinicia tu terminal/IDE** para que los cambios surtan efecto

   **Método B: Desde PowerShell (como Administrador)**
   ```powershell
   # Reemplaza [VERSION] con tu versión de PostgreSQL (ej: 15, 16, etc.)
   $postgresPath = "C:\Program Files\PostgreSQL\15\bin"
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$postgresPath", [EnvironmentVariableTarget]::Machine)
   ```
   - **Reinicia tu terminal/IDE** después de ejecutar este comando

3. **Verificar:**
   ```powershell
   # Cierra y vuelve a abrir PowerShell/terminal
   pg_dump --version
   ```

### Opción 3: Usar PostgreSQL Portable (Alternativa)

Si no quieres instalar PostgreSQL completo, puedes usar una versión portable:

1. Descarga PostgreSQL portable desde: https://www.postgresql.org/download/windows/
2. Extrae los archivos
3. Agrega la carpeta `bin` al PATH temporalmente:
   ```powershell
   $env:Path += ";C:\ruta\a\postgresql\portable\bin"
   ```

## ✅ Verificar que funciona

Después de instalar o agregar al PATH, verifica:

```powershell
# Verificar que pg_dump está disponible
where pg_dump

# Verificar la versión
pg_dump --version

# Verificar que psql también está disponible
psql --version
```

## 🔄 Reiniciar el servidor de desarrollo

Después de agregar PostgreSQL al PATH:

1. **Cierra completamente** tu terminal/IDE
2. **Vuelve a abrirlo**
3. **Reinicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

## 📝 Nota importante

- Los cambios en el PATH solo surten efecto en **nuevas ventanas de terminal**
- Si tu servidor de desarrollo está corriendo, **debes reiniciarlo** después de agregar al PATH
- Si usas VSCode o Cursor, **cierra y vuelve a abrir** el editor para que detecte los cambios

## 🆘 Si el problema persiste

Si después de seguir estos pasos el problema persiste:

1. Verifica que PostgreSQL esté correctamente instalado
2. Verifica que la ruta al directorio `bin` sea correcta
3. Reinicia completamente tu computadora
4. Verifica nuevamente con el botón "Verificar Sistema" en la interfaz de respaldos

---

*Última actualización: $(date)*

