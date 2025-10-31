"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  obtenerEstadisticasRespaldo,
  obtenerHistorialRespaldos,
  obtenerConfiguracionRespaldos,
  crearRespaldo as crearRespaldoAction,
  restaurarRespaldo as restaurarRespaldoAction,
  eliminarRespaldo as eliminarRespaldoAction,
  actualizarConfiguracionRespaldos,
} from "@/lib/actions/respaldos";
export function useRespaldos() {
  const [estadisticas, setEstadisticas] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [configuracion, setConfiguracion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  }); // Cargar estadística s
  const cargarEstadisticas = useCallback(async () => {
    try {
      const result = await obtenerEstadisticasRespaldo();
      if (result.success) {
        setEstadisticas(result.data);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (error) {
      setError("Error al cargar estadísticas");
      toast.error("Error al cargar estadísticas");
    }
  }, []); // Cargar historia l
  const cargarHistorial = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const result = await obtenerHistorialRespaldos(page, limit);
      if (result.success) {
        setHistorial(result.data.respaldos);
        setPagination(result.data.pagination);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (error) {
      setError("Error al cargar historial");
      toast.error("Error al cargar historial");
    } finally {
      setLoading(false);
    }
  }, []); // Cargar configuració n
  const cargarConfiguracion = useCallback(async () => {
    try {
      const result = await obtenerConfiguracionRespaldos();
      if (result.success) {
        setConfiguracion(result.data);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (error) {
      setError("Error al cargar configuración");
      toast.error("Error al cargar configuración");
    }
  }, []); // Crear respald o
  const crearRespaldo = useCallback(
    async (datos) => {
      try {
        const result = await crearRespaldoAction(datos);
        if (result.success) {
          toast.success("Respaldo iniciado correctamente");
          await cargarHistorial(pagination.page, pagination.limit);
          await cargarEstadisticas();
          return result.data;
        } else {
          toast.error(result.error);
          throw new Error(result.error);
        }
      } catch (error) {
        toast.error("Error al crear respaldo");
        throw error;
      }
    },
    [pagination.page, pagination.limit, cargarHistorial, cargarEstadisticas]
  ); // Restaurar respald o
  const restaurarRespaldo = useCallback(
    async (respaldoId, opciones = {}) => {
      try {
        const result = await restaurarRespaldoAction(respaldoId, opciones);
        if (result.success) {
          toast.success("Restauración iniciada correctamente");
          await cargarHistorial(pagination.page, pagination.limit);
          await cargarEstadisticas();
          return result.data;
        } else {
          toast.error(result.error);
          throw new Error(result.error);
        }
      } catch (error) {
        toast.error("Error al restaurar respaldo");
        throw error;
      }
    },
    [pagination.page, pagination.limit, cargarHistorial, cargarEstadisticas]
  ); // Eliminar respald o
  const eliminarRespaldo = useCallback(
    async (respaldoId) => {
      try {
        const result = await eliminarRespaldoAction(respaldoId);
        if (result.success) {
          toast.success("Respaldo eliminado correctamente");
          await cargarHistorial(pagination.page, pagination.limit);
          await cargarEstadisticas();
        } else {
          toast.error(result.error);
          throw new Error(result.error);
        }
      } catch (error) {
        toast.error("Error al eliminar respaldo");
        throw error;
      }
    },
    [pagination.page, pagination.limit, cargarHistorial, cargarEstadisticas]
  ); // Actualizar configuració n
  const actualizarConfiguracion = useCallback(
    async (nuevaConfiguracion) => {
      try {
        const result = await actualizarConfiguracionRespaldos(
          nuevaConfiguracion
        );
        if (result.success) {
          toast.success("Configuración actualizada correctamente");
          setConfiguracion(result.data);
          await cargarEstadisticas();
        } else {
          toast.error(result.error);
          throw new Error(result.error);
        }
      } catch (error) {
        toast.error("Error al actualizar configuración");
        throw error;
      }
    },
    [cargarEstadisticas]
  ); // Refrescar dato s
  const refrescar = useCallback(async () => {
    await Promise.all([
      cargarEstadisticas(),
      cargarHistorial(pagination.page, pagination.limit),
      cargarConfiguracion(),
    ]);
  }, [
    cargarEstadisticas,
    cargarHistorial,
    cargarConfiguracion,
    pagination.page,
    pagination.limit,
  ]); // Cargar datos iniciale s
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      await Promise.all([
        cargarEstadisticas(),
        cargarHistorial(),
        cargarConfiguracion(),
      ]);
      setLoading(false);
    };
    cargarDatos();
  }, []); // Auto-refresh cada 30 segundos para estadística s
  useEffect(() => {
    const interval = setInterval(() => {
      cargarEstadisticas();
    }, 30000);
    return () => clearInterval(interval);
  }, [cargarEstadisticas]);
  return {
    // Estado s
    estadisticas,
    historial,
    configuracion,
    loading,
    error,
    pagination, // Accione s
    crearRespaldo,
    restaurarRespaldo,
    eliminarRespaldo,
    actualizarConfiguracion,
    cargarHistorial,
    refrescar, // Utilidade s
    formatBytes: (bytes) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },
    formatDuration: (seconds) => {
      if (!seconds) return "0 min";
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes === 0) {
        return `${remainingSeconds}s`;
      } else if (remainingSeconds === 0) {
        return `${minutes} min`;
      } else {
        return `${minutes} min ${remainingSeconds}s`;
      }
    },
    getStatusColor: (estado) => {
      const colors = {
        COMPLETADO: "text-green-600",
        FALLIDO: "text-red-600",
        EN_PROGRESO: "text-blue-600",
        INICIADO: "text-yellow-600",
        CANCELADO: "text-gray-600",
      };
      return colors[estado] || "text-gray-600";
    },
    getStatusBadgeColor: (estado) => {
      const colors = {
        COMPLETADO: "bg-green-100 text-green-800",
        FALLIDO: "bg-red-100 text-red-800",
        EN_PROGRESO: "bg-blue-100 text-blue-800",
        INICIADO: "bg-yellow-100 text-yellow-800",
        CANCELADO: "bg-gray-100 text-gray-800",
      };
      return colors[estado] || "bg-gray-100 text-gray-800";
    },
  };
}
