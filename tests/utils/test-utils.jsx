import React from 'react';
import { render } from '@testing-library/react';

/**
 * Utilidades de testing para componentes React
 */

/**
 * Renderiza un componente con providers necesarios
 */
export function renderWithProviders(ui, { ...renderOptions } = {}) {
  function Wrapper({ children }) {
    return <>{children}</>;
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

/**
 * Crea un mock de usuario para testing
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'OPERADOR',
    sucursalId: 'test-sucursal-id',
    ...overrides,
  };
}

/**
 * Crea un mock de sesión para testing
 */
export function createMockSession(overrides = {}) {
  return {
    user: createMockUser(overrides.user),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

/**
 * Helper para esperar que una promesa se resuelva
 */
export async function waitForAsync() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

