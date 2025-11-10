# Guía de Testing - Sistema Coal Cargo

## 🧪 Configuración de Testing

El proyecto utiliza **Vitest** para tests unitarios e integración, y **Playwright** para tests E2E.

### Instalación

Las dependencias ya están instaladas en `package.json`:

```bash
npm install
```

### Scripts Disponibles

```bash
# Ejecutar todos los tests unitarios
npm run test

# Ejecutar tests con UI interactiva
npm run test:ui

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests E2E
npm run test:e2e

# Ejecutar tests E2E con UI
npm run test:e2e:ui

# Ejecutar todos los tests
npm run test:all
```

## 📁 Estructura de Tests

```
tests/
├── unit/                    # Tests unitarios
│   ├── lib/                # Tests de utilidades y acciones
│   │   ├── actions/        # Tests de server actions
│   │   └── utils/          # Tests de utilidades
│   └── components/         # Tests de componentes React
├── integration/            # Tests de integración
│   └── envios.test.js     # Tests de flujos completos
└── e2e/                    # Tests end-to-end (Playwright)
    └── ...
```

## ✍️ Escribir Tests

### Test Unitario Básico

```javascript
import { describe, it, expect } from 'vitest';
import { miFuncion } from '@/lib/utils/mi-utilidad';

describe('miFuncion', () => {
  it('debe hacer algo correctamente', () => {
    const result = miFuncion('input');
    expect(result).toBe('expected');
  });
});
```

### Test de Componente React

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MiComponente from '@/components/MiComponente';

describe('MiComponente', () => {
  it('debe renderizar correctamente', () => {
    render(<MiComponente />);
    expect(screen.getByText('Texto esperado')).toBeInTheDocument();
  });
});
```

### Test de Server Action

```javascript
import { describe, it, expect, vi } from 'vitest';
import { crearCliente } from '@/lib/actions/clientes';
import { prisma } from '@/lib/prisma';

// Mock de Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    clientes: {
      create: vi.fn(),
    },
  },
}));

describe('crearCliente', () => {
  it('debe crear un cliente correctamente', async () => {
    const clienteData = {
      nombre: 'Test',
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      telefono: '999999999',
    };

    prisma.clientes.create.mockResolvedValue({
      id: 'test-id',
      ...clienteData,
    });

    const result = await crearCliente(clienteData);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
```

## 🎯 Cobertura de Tests

### Prioridades de Testing

1. **Alta Prioridad** (Tests críticos):
   - Validaciones de documentos
   - Cálculos de cotizaciones
   - Validaciones de formularios
   - Manejo de errores

2. **Media Prioridad**:
   - Server Actions principales
   - Componentes de formulario
   - Utilidades de negocio

3. **Baja Prioridad**:
   - Componentes UI simples
   - Helpers genéricos

### Objetivo de Cobertura

- **Funciones críticas**: 80%+
- **Server Actions**: 70%+
- **Componentes**: 60%+
- **Utilidades**: 80%+

## 🔧 Configuración

### Vitest Config

La configuración está en `vitest.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    // ...
  },
});
```

### Setup File

El archivo `tests/setup.js` incluye:
- Configuración de jest-dom matchers
- Mocks de Next.js router
- Mocks de next-auth
- Mocks de componentes UI

## 📝 Mejores Prácticas

1. **Nombres descriptivos**: Usa nombres claros para tests y describe blocks
2. **AAA Pattern**: Arrange, Act, Assert
3. **Tests independientes**: Cada test debe poder ejecutarse independientemente
4. **Mock externo**: Mock servicios externos (API, BD)
5. **Tests rápidos**: Mantén los tests unitarios rápidos
6. **Un test, una aserción**: Preferiblemente un test por concepto

## 🐛 Debugging Tests

### Vitest UI

```bash
npm run test:ui
```

### Playwright UI

```bash
npm run test:e2e:ui
```

### Debug en VS Code

Agrega esta configuración a `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Current Test",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test", "--", "${relativeFile}"],
  "console": "integratedTerminal"
}
```

## 📚 Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)

