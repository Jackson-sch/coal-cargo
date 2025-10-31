"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { obtenerConfiguracionGeneral } from "@/lib/actions/configuracion";

export function useEmpresaSucursalConfig() {
  const { data: session } = useSession();
  const [config, setConfig] = useState({
    empresa: {
      nombre: "Mi Empresa",
      email: "contacto@miempresa.com",
      telefono: "",
      direccion: "",
      ruc: "",
      sitioWeb: "",
      logoEmpresa: null,
    },
    sucursal: {
      nombre: null,
      direccion: null,
      telefono: null,
    },
    usuario: {
      nombre: "",
      email: "",
      rol: "",
      sucursalId: null,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        setLoading(true);

        // Cargar configuración general de la empresa
        const empresaResult = await obtenerConfiguracionGeneral();
        let empresaData = {
          nombre: "Mi Empresa",
          email: "contacto@miempresa.com",
          telefono: "",
          direccion: "",
          ruc: "",
          sitioWeb: "",
          logoEmpresa: null,
        };

        if (empresaResult.success && empresaResult.data) {
          empresaData = {
            nombre: empresaResult.data.nombreEmpresa || "Mi Empresa",
            email: empresaResult.data.email || "contacto@miempresa.com",
            telefono: empresaResult.data.telefono || "",
            direccion: empresaResult.data.direccion || "",
            ruc: empresaResult.data.ruc || "",
            sitioWeb: empresaResult.data.sitioWeb || "",
            logoEmpresa: empresaResult.data.logoEmpresa || null,
          };
        }

        // Información del usuario y sucursal desde la sesión
        let sucursalData = {
          nombre: null,
          direccion: null,
          telefono: null,
        };

        let usuarioData = {
          nombre: session?.user?.name || "",
          email: session?.user?.email || "",
          rol: session?.user?.role || "",
          sucursalId: session?.user?.sucursalId || null,
        };

        // Si el usuario tiene sucursal asignada, obtener información de la sucursal
        if (session?.user?.sucursal) {
          sucursalData = {
            nombre: session.user.sucursal.nombre,
            direccion: session.user.sucursal.direccion,
            telefono: session.user.sucursal.telefono,
          };
        }

        setConfig({
          empresa: empresaData,
          sucursal: sucursalData,
          usuario: usuarioData,
        });
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    // Solo cargar si hay sesión o si no hay sesión pero queremos mostrar datos por defecto
    if (session !== undefined) {
      cargarConfiguracion();
    }
  }, [session]);

  // Función para obtener el nombre completo (empresa + sucursal)
  const getNombreCompleto = () => {
    const nombreEmpresa = config.empresa.nombre;
    const nombreSucursal = config.sucursal.nombre;

    if (config.usuario.rol === "SUPER_ADMIN") {
      return `${nombreEmpresa} - Administración General`;
    } else if (nombreSucursal) {
      return `${nombreEmpresa} - ${nombreSucursal}`;
    } else {
      return nombreEmpresa;
    }
  };

  // Función para obtener el plan/tipo
  const getPlan = () => {
    if (config.usuario.rol === "SUPER_ADMIN") {
      return "Administración";
    } else if (config.usuario.rol === "ADMIN_SUCURSAL") {
      return "Sucursal";
    } else {
      return "Usuario";
    }
  };

  return {
    config,
    loading,
    error,
    getNombreCompleto,
    getPlan,
    // Mantener compatibilidad con el hook anterior
    empresaConfig: config.empresa,
  };
}
