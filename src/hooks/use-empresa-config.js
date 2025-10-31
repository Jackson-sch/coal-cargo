"use client";
import { useState, useEffect } from "react";
import { obtenerConfiguracionGeneral } from "@/lib/actions/configuracion";
export function useEmpresaConfig() {
  const [empresaConfig, setEmpresaConfig] = useState({
    nombre: "Mi Empresa", // Valor por defect o
    email: "contacto@miempresa.com",
    telefono: "",
    direccion: "",
    ruc: "",
    sitioWeb: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        setLoading(true);
        const result = await obtenerConfiguracionGeneral();
        if (result.success && result.data) {
          setEmpresaConfig({
            nombre: result.data.nombreEmpresa || "Mi Empresa",
            email: result.data.email || "contacto@miempresa.com",
            telefono: result.data.telefono || "",
            direccion: result.data.direccion || "",
            ruc: result.data.ruc || "",
            sitioWeb: result.data.sitioWeb || "",
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargarConfiguracion();
  }, []);
  return { empresaConfig, loading, error };
}
