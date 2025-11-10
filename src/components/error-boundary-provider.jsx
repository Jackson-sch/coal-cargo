"use client";

import ErrorBoundary from "./error-boundary";

/**
 * Provider de Error Boundary para usar en Server Components
 * Este componente debe ser usado en layouts que son Server Components
 */
export default function ErrorBoundaryProvider({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

