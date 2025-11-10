# 🧪 Guía de Testing - Coal Cargo

Esta guía explica cómo ejecutar y escribir tests para el sistema Coal Cargo.

## 📋 Estructura de Tests

```
tests/
├── setup.js              # Configuración global de tests
├── unit/                 # Tests unitarios
│   └── lib/
│       ├── utils/        # Tests de utilidades
│       └── actions/      # Tests de server actions
├── integration/          # Tests de integración
│   └── envios.test.js    # Tests de integración de envíos
├── e2e/                  # Tests end-to-end
│   ├── auth.spec.js      # Tests E2E de autenticación
│   └── envios.spec.js    # Tests E2E de envíos
└── utils/                # Utilidades de testing
    └── test-utils.jsx    # Helpers para tests de React
```

## 🚀 Comandos Disponibles

### Tests Unitarios e Integración (Vitest)

```bash
# Ejecutar todos los tests
npm run test

# Ejecutar tests en modo watch
npm run test -- --watch

# Ejecutar tests con UI
npm run test:ui

# Ejecutar tests con coverage
npm run test:coverage
```

### Tests E2E (Playwright)

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar tests E2E con UI
npm run test:e2e:ui

# Ejecutar tests E2E en modo debug
npm run test:e2e -- --debug
```

### Todos los Tests

```bash
# Ejecutar unitarios e integración + E2E
npm run test:all
```

## ✍️ Escribir Tests

### Tests Unitarios

Los tests unitarios prueban funciones individuales o utilidades en aislamiento.

**Ejemplo:**

```javascript
import { describe, it, expect } from 'vitest';
import { validarDocumentoPeruano } from '@/lib/utils/documentos.js';

describe('validarDocumentoPeruano', () => {
  it('debe validar un DNI válido', () => {
    expect(validarDocumentoPeruano('DNI', '12345678')).toBe(true);
  });
});
```

### Tests de Integración

Los tests de integración prueban la interacción entre múltiples componentes, incluyendo la base de datos.

**Ejemplo:**

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Envíos - Tests de Integración', () => {
  it('debe crear un envío correctamente', async () => {
    const envio = await prisma.envios.create({...});
    expect(envio).toBeDefined();
  });
});
```

### Tests E2E

Los tests E2E prueban flujos completos desde la perspectiva del usuario.

**Ejemplo:**

```javascript
import { test, expect } from '@playwright/test';

test('debe mostrar la página de login', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveTitle(/Login/i);
});
```

## 🔧 Configuración

### Vitest

Configuración en `vitest.config.js`:
- Environment: jsdom (para componentes React)
- Setup files: `tests/setup.js`
- Coverage: v8 provider

### Playwright

Configuración en `playwright.config.js`:
- Base URL: `http://localhost:3000`
- Timeout: 30 segundos
- Servidor de desarrollo automático

## 📝 Mejores Prácticas

1. **Tests Unitarios**: Rápidos, aislados, sin dependencias externas
2. **Tests de Integración**: Prueban flujos reales, pueden usar BD
3. **Tests E2E**: Prueban flujos completos del usuario
4. **Naming**: Usar nombres descriptivos que expliquen qué se prueba
5. **Arrange-Act-Assert**: Estructurar tests en estas 3 fases
6. **Cleanup**: Limpiar datos de prueba después de cada test

## 🐛 Debugging

### Vitest

```bash
# Modo debug
npm run test -- --inspect-brk

# Ejecutar un test específico
npm run test -- documentos.test.js
```

### Playwright

```bash
# Modo debug con UI
npm run test:e2e:ui

# Modo headed (ver el navegador)
npm run test:e2e -- --headed
```

## 📊 Coverage

Para ver el coverage de los tests:

```bash
npm run test:coverage
```

Esto generará un reporte HTML en `coverage/index.html`.

## ⚠️ Notas Importantes

1. Los tests de integración requieren una base de datos de prueba
2. Los tests E2E requieren que el servidor de desarrollo esté corriendo
3. Usar variables de entorno de prueba para evitar afectar datos de producción
4. Limpiar datos de prueba después de cada test

