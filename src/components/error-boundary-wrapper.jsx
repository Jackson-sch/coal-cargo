"use client";

import ErrorBoundary from "./error-boundary";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Wrapper con fallback personalizado para diferentes tipos de errores
 */
export function ErrorBoundaryWrapper({ children, fallback, resetOnReload = false }) {
  return (
    <ErrorBoundary fallback={fallback} resetOnReload={resetOnReload}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error Boundary específico para componentes de formulario
 */
export function FormErrorBoundary({ children }) {
  const formFallback = (error, reset) => (
    <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-destructive mb-1">
            Error en el formulario
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {error?.message || "Ocurrió un error al procesar el formulario"}
          </p>
          <Button onClick={reset} size="sm" variant="outline">
            Reintentar
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={formFallback}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error Boundary específico para tablas y listas
 */
export function TableErrorBoundary({ children }) {
  const tableFallback = (error, reset) => (
    <div className="p-8 text-center">
      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-semibold mb-2">Error al cargar los datos</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {error?.message || "No se pudieron cargar los datos"}
      </p>
      <Button onClick={reset} variant="outline">
        Reintentar
      </Button>
    </div>
  );

  return (
    <ErrorBoundary fallback={tableFallback}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundaryWrapper;

