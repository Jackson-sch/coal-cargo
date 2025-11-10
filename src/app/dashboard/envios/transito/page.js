"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  getEnvios,
  actualizarEstadoEnvio,
  asignarEnvio,
} from "@/lib/actions/envios";
import { getUsuarios } from "@/lib/actions/usuarios";
import ModalDetalle from "@/components/envios/modal-detalle";
import ModalActualizarEstado from "@/components/envios/modal-actualizar-estado";
import ModalAsignarUsuario from "@/components/envios/modal-asignar-usuario";
import { estadosEnvioArray, modalidadesArray } from "@/lib/constants/estados";
import { useCopiarGuia } from "@/hooks/useCopiarGuia";
import TablaEnviosTransito from "@/components/envios/transito/tabla-envios-transito";
import FiltrosBusquedaTransito from "@/components/envios/transito/filtros-busqueda";
import EstadisticaRapidasTransito from "@/components/envios/transito/estadistica-rapidas";
import { useGuia, usePage } from "@/hooks/useQueryParams";

const estadosEnvio = estadosEnvioArray;
const modalidades = modalidadesArray;
export default function EnviosTransitoPage() {
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Query params con nuqs (sincronizados con URL)
  const [searchQuery, setSearchQuery] = useGuia("");
  const [currentPage, setCurrentPage] = usePage(1);

  const [totalPages, setTotalPages] = useState(1);
  const [totalEnvios, setTotalEnvios] = useState(0); // Estados para modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEnvio, setSelectedEnvio] = useState(null);
  const [usuarios, setUsuarios] = useState([]);

  // Hook para copiar número de guía
  const { copiarNumeroGuia, copiedGuia } = useCopiarGuia();
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [descripcionEvento, setDescripcionEvento] = useState("");
  const [ubicacionEvento, setUbicacionEvento] = useState("");
  const [usuarioAsignado, setUsuarioAsignado] = useState("");
  const [saving, setSaving] = useState(false);
  const [fotoUrl, setFotoUrl] = useState("");
  const [firmaUrl, setFirmaUrl] = useState("");
  const itemsPerPage = 8;

  // Estados considerados "en tránsito"
  const estadosTransito = [
    "EN_TRANSITO",
    "EN_AGENCIA_ORIGEN",
    "EN_AGENCIA_DESTINO",
    "EN_REPARTO",
  ];

  // Cargar envíos en tránsito
  const fetchEnvios = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: itemsPerPage };
      if (searchQuery) params.guia = searchQuery;
      // Filtrar por múltiples estados de tránsito
      params.estados = estadosTransito;
      const result = await getEnvios(params);
      if (result.success) {
        setEnvios(result.data.envios);
        setTotalPages(result.data.pagination.totalPages);
        setTotalEnvios(result.data.pagination.total);
      } else {
        toast.error(result.error || "Error al cargar envíos en tránsito");
      }
    } catch (error) {
      toast.error("Error al cargar envíos en tránsito");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvios();
    cargarUsuarios();
  }, [currentPage, searchQuery]);

  const cargarUsuarios = async () => {
    try {
      const result = await getUsuarios();
      if (result.success) {
        setUsuarios(result.data);
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  // Manejar búsqueda (resetear página al cambiar)
  const handleSearch = (value) => {
    setSearchQuery(value || null); // null elimina el query param de la URL
    setCurrentPage(1);
  };

  const handleUpdateStatus = async () => {
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
        setShowStatusModal(false);
        resetStatusForm();
        await fetchEnvios();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al actualizar estado");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignUser = async () => {
    if (!selectedEnvio || !usuarioAsignado) {
      toast.error("Seleccione un usuario válido");
      return;
    }

    try {
      setSaving(true);
      const result = await asignarEnvio(selectedEnvio.id, usuarioAsignado);
      if (result.success) {
        toast.success("Envío asignado correctamente");
        setShowAssignModal(false);
        setUsuarioAsignado("");
        await fetchEnvios();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al asignar envío");
    } finally {
      setSaving(false);
    }
  };

  const resetStatusForm = () => {
    setNuevoEstado("");
    setDescripcionEvento("");
    setUbicacionEvento("");
    setFotoUrl("");
    setFirmaUrl("");
  };

  const getEstadoBadge = (estado) => {
    const estadoInfo = estadosEnvio.find((e) => e.value === estado);
    if (!estadoInfo) return null;
    const Icon = estadoInfo.icon;
    return (
      <Badge className={`${estadoInfo.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" /> {estadoInfo.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Envíos en Tránsito
          </h1>
          <p className="text-muted-foreground">
            Gestiona todos los envíos que están en proceso de entrega
          </p>
        </div>
        <Button onClick={fetchEnvios} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </div>
      {/* Estadísticas rápidas */}
      <EstadisticaRapidasTransito totalEnvios={totalEnvios} envios={envios} />

      {/* Filtros y búsqueda */}
      <FiltrosBusquedaTransito
        searchQuery={searchQuery}
        handleSearch={handleSearch}
      />

      {/* Tabla de envíos */}
      <TablaEnviosTransito
        loading={loading}
        envios={envios}
        totalEnvios={totalEnvios}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setSelectedEnvio={setSelectedEnvio}
        setShowDetailModal={setShowDetailModal}
        setShowStatusModal={setShowStatusModal}
        setShowAssignModal={setShowAssignModal}
        setNuevoEstado={setNuevoEstado}
        copiedGuia={copiedGuia}
        getEstadoBadge={getEstadoBadge}
        setUsuarioAsignado={setUsuarioAsignado}
        copiarNumeroGuia={copiarNumeroGuia}
        totalPages={totalPages}
      />

      {/* Modal Detalle de Envío */}
      <ModalDetalle
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        envio={selectedEnvio}
        getEstadoBadge={getEstadoBadge}
        modalidades={modalidades}
      />

      {/* Modal Actualizar Estado */}
      <ModalActualizarEstado
        open={showStatusModal}
        onOpenChange={setShowStatusModal}
        envio={selectedEnvio}
        getEstadoBadge={getEstadoBadge}
        modalidades={modalidades}
        estadosEnvio={estadosEnvio}
        setShowStatusModal={setShowStatusModal}
        handleUpdateStatus={handleUpdateStatus}
        saving={saving}
        nuevoEstado={nuevoEstado}
        setNuevoEstado={setNuevoEstado}
        descripcionEvento={descripcionEvento}
        setDescripcionEvento={setDescripcionEvento}
        ubicacionEvento={ubicacionEvento}
        setUbicacionEvento={setUbicacionEvento}
        fotoUrl={fotoUrl}
        setFotoUrl={setFotoUrl}
        firmaUrl={firmaUrl}
        setFirmaUrl={setFirmaUrl}
      />

      {/* Modal Asignar Usuario */}
      <ModalAsignarUsuario
        open={showAssignModal}
        onOpenChange={setShowAssignModal}
        envio={selectedEnvio}
        usuarios={usuarios}
        usuarioAsignado={usuarioAsignado}
        setUsuarioAsignado={setUsuarioAsignado}
        handleAssignUser={handleAssignUser}
        saving={saving}
        setShowAssignModal={setShowAssignModal}
      />
    </div>
  );
}
