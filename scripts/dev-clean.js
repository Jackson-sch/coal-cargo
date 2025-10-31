#!/usr/bin/env node const { execSync } = require("child_process"); const fs = require("fs"); const path = require("path"); console.log("🧹 Limpiando memoria y archivos temporales..."); try { // Matar procesos de Node.js existentes try { execSync("taskkill /f /im node.exe", { stdio: "ignore" }); console.log("✅ Procesos Node.js terminados"); } catch (error) { console.log("ℹ️ No hay procesos Node.js activos"); }

  // Limpiar cache de Next.js const nextDir = path.join(process.cwd(), ".next"); if (fs.existsSync(nextDir)) { fs.rmSync(nextDir, { recursive: true, force: true }); console.log("✅ Cache de Next.js limpiado"); }

  // Limpiar node_modules/.cache si existe const cacheDir = path.join(process.cwd(), "node_modules", ".cache"); if (fs.existsSync(cacheDir)) { fs.rmSync(cacheDir, { recursive: true, force: true }); console.log("✅ Cache de node_modules limpiado"); }

  // Ejecutar garbage collection si está disponible if (global.gc) { global.gc(); console.log("✅ Garbage collection ejecutado"); }

  console.log("🚀 Iniciando servidor de desarrollo con memoria optimizada..."); // Iniciar el servidor con más memoria execSync("npm run dev", { stdio: "inherit" }); } catch (error) { console.error("❌ Error durante la limpieza:", error.message); process.exit(1); }
