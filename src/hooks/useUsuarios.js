"use client";

import { useState, useEffect } from "react";
import { getUsuarios } from "@/lib/actions/usuarios";

/**
 * Hook personalizado para cargar y manejar usuarios
 * @returns {Object} Objeto con la lista de usuarios y estado de carga
 */
export function useUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const result = await getUsuarios();
      if (result.success) {
        setUsuarios(result.data);
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  return {
    usuarios,
    loading,
    cargarUsuarios,
  };
}
