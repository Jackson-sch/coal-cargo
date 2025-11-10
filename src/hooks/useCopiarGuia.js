"use client";

import { useState } from "react";
import { toast } from "sonner";

/**
 * Hook personalizado para copiar números de guía al portapapeles
 * @returns {Object} Objeto con la función copiarNumeroGuia y el estado copiedGuia
 */
export function useCopiarGuia() {
  const [copiedGuia, setCopiedGuia] = useState(null);

  const copiarNumeroGuia = async (numeroGuia) => {
    try {
      await navigator.clipboard.writeText(numeroGuia);
      setCopiedGuia(numeroGuia);
      toast.success(`Número de guía ${numeroGuia} copiado al portapapeles`);
      // Resetear el estado después de 2 segundos
      setTimeout(() => {
        setCopiedGuia(null);
      }, 2000);
    } catch (error) {
      toast.error("Error al copiar el número de guía");
    }
  };

  return { copiarNumeroGuia, copiedGuia };
}
