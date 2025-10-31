"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getSucursales } from "@/lib/actions/sucursales";
export function useSucursalesDisponibles() {
  const { data: session } = useSession();
  const [sucursales, setSucursales] = useState([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    const cargarSucursales = async () => {
      // Solo cargar sucursales para SUPER_ADMI N
      if (session?.user?.role !== "SUPER_ADMIN") {
        setSucursales([]);
        return;
      }

      try {
        setLoadingSucursales(true);
        const result = await getSucursales();
        if (result.success) {
          setSucursales(result.data || []);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingSucursales(false);
      }
    };
    if (session !== undefined) {
      cargarSucursales();
    }
  }, [session]);
  return { sucursales, loadingSucursales, error };
}
