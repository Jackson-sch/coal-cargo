"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  actualizarEstadoEnvio,
  asignarEnvio,
} from "@/lib/actions/envios";

/**
 * Hook personalizado para manejar acciones comunes de envíos
 * @param {Function} onSuccess - Callback que se ejecuta después de una acción exitosa (para recargar datos)
 * @returns {Object} Objeto con funciones y estados para manejar acciones de envíos
 */
export function useEnviosActions(onSuccess = null) {
  const [saving, setSaving] = useState(false);
  
  // Estados del formulario de actualización de estado
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [descripcionEvento, setDescripcionEvento] = useState("");
  const [ubicacionEvento, setUbicacionEvento] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [firmaUrl, setFirmaUrl] = useState("");
  
  // Estado para asignación de usuario
  const [usuarioAsignado, setUsuarioAsignado] = useState("");

  /**
   * Actualiza el estado de un envío
   * @param {Object} selectedEnvio - El envío seleccionado
   * @param {Function} onModalClose - Función para cerrar el modal
   */
  const handleUpdateStatus = async (selectedEnvio, onModalClose = null) => {
    if (!selectedEnvio || !nuevoEstado) {
      toast.error("Complete todos los campos requeridos");
      return;
    }

    try {
      setSaving(true);
      const result = await actualizarEstadoEnvio(
        selectedEnvio.id,
        nuevoEstado,
        descripcionEvento,
        ubicacionEvento,
        fotoUrl || null,
        firmaUrl || null
      );
      
      if (result.success) {
        toast.success("Estado actualizado correctamente");
        if (onModalClose) onModalClose(false);
        resetStatusForm();
        if (onSuccess) await onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al actualizar estado");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Asigna un usuario (conductor) a un envío
   * @param {Object} selectedEnvio - El envío seleccionado
   * @param {Function} onModalClose - Función para cerrar el modal
   */
  const handleAssignUser = async (selectedEnvio, onModalClose = null) => {
    if (!selectedEnvio || !usuarioAsignado) {
      toast.error("Seleccione un usuario válido");
      return;
    }

    try {
      setSaving(true);
      const result = await asignarEnvio(selectedEnvio.id, usuarioAsignado);
      
      if (result.success) {
        toast.success("Envío asignado correctamente");
        if (onModalClose) onModalClose(false);
        setUsuarioAsignado("");
        if (onSuccess) await onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al asignar envío");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Resetea el formulario de actualización de estado
   */
  const resetStatusForm = () => {
    setNuevoEstado("");
    setDescripcionEvento("");
    setUbicacionEvento("");
    setFotoUrl("");
    setFirmaUrl("");
  };

  return {
    // Estados
    saving,
    nuevoEstado,
    setNuevoEstado,
    descripcionEvento,
    setDescripcionEvento,
    ubicacionEvento,
    setUbicacionEvento,
    fotoUrl,
    setFotoUrl,
    firmaUrl,
    setFirmaUrl,
    usuarioAsignado,
    setUsuarioAsignado,
    
    // Funciones
    handleUpdateStatus,
    handleAssignUser,
    resetStatusForm,
  };
}
