"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
  getErrorMessage,
  classifyError,
  logError,
  ErrorTypes,
} from "@/lib/utils/error-handler";

/**
 * Hook personalizado para manejar errores en componentes
 * Proporciona funciones para manejar errores de forma consistente
 */
export function useErrorHandler() {
  const handleError = useCallback(
    (error, options = {}) => {
      const {
        showToast = true,
        toastMessage,
        onError,
        context = {},
        defaultMessage = "Ocurrió un error inesperado",
      } = options;

      // Log del error
      logError(error, context);

      // Obtener mensaje de error
      const message = toastMessage || getErrorMessage(error, defaultMessage);
      const type = classifyError(error);

      // Mostrar toast si está habilitado
      if (showToast) {
        switch (type) {
          case ErrorTypes.VALIDATION:
            toast.warning(message);
            break;
          case ErrorTypes.NETWORK:
            toast.error(message, {
              duration: 5000,
            });
            break;
          case ErrorTypes.AUTHENTICATION:
            toast.error(message, {
              action: {
                label: "Iniciar sesión",
                onClick: () => {
                  window.location.href = "/login";
                },
              },
            });
            break;
          default:
            toast.error(message);
        }
      }

      // Ejecutar callback personalizado si existe
      if (onError) {
        onError(error, type, message);
      }

      return { message, type, error };
    },
    []
  );

  const handleAsyncError = useCallback(
    async (asyncFn, options = {}) => {
      try {
        return await asyncFn();
      } catch (error) {
        handleError(error, options);
        throw error;
      }
    },
    [handleError]
  );

  return {
    handleError,
    handleAsyncError,
  };
}

