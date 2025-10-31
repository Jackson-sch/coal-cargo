"use client";

import { useState, useEffect } from "react";
import { getClientes } from "@/lib/actions/clientes";

// Hook personalizado para manejar el estado de clientes
export function useClientes(initialData, searchParams) {
  const [clientes, setClientes] = useState(initialData.data || []);
  const [totalPages, setTotalPages] = useState(initialData.totalPages || 1);
  const [totalClientes, setTotalClientes] = useState(initialData.total || 0);
  const [loading, setLoading] = useState(false);

  // Función para recargar datos
  const refreshClientes = async () => {
    setLoading(true);
    try {
      const result = await getClientes(searchParams);
      if (result.success) {
        setClientes(result.data);
        setTotalPages(result.totalPages);
        setTotalClientes(result.total);
      }
    } catch (error) {
      console.error("Error al recargar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    clientes,
    totalPages,
    totalClientes,
    loading,
    refreshClientes,
  };
}
