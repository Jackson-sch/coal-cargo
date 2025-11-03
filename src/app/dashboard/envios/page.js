"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  Eye,
  Edit,
  Truck,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Building2,
  ArrowRight,
  Loader2,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getEnvios,
  createEnvio,
  actualizarEstadoEnvio,
  asignarEnvio,
  getEstadisticasEnvios,
} from "@/lib/actions/envios";
import { getSucursales } from "@/lib/actions/sucursales";
import { getClientes } from "@/lib/actions/clientes";
import { getUsuarios } from "@/lib/actions/usuarios";
import { calcularCotizacionSucursal } from "@/lib/actions/cotizacion-sucursales";
import HeaderEnvios from "@/components/envios/header";
import EstadisticasEnvios from "@/components/envios/estadisticas";
import FiltrosEnvios from "@/components/envios/filtros-envios";
import TablaEnvios from "@/components/envios/tabla-envios";
import ModalCrearEnvio from "@/components/envios/modal-crear-envio";
import ModalDetalle from "@/components/envios/modal-detalle";
import ModalActualizarEstado from "@/components/envios/modal-actualizar-estado";
import ModalAsignarUsuario from "@/components/envios/modal-asignar-usuario";
import { estadosEnvioArray, modalidadesArray } from "@/lib/constants/estados";

const estadosEnvio = estadosEnvioArray;
const modalidades = modalidadesArray;
export default function EnviosPage() {
  const [loading, setLoading] = useState(false);
  const [envios, setEnvios] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]); // Estados de modale s
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEnvio, setSelectedEnvio] = useState(null);
  const [saving, setSaving] = useState(false); // Estado para el botón de copi a
  const [copiedGuia, setCopiedGuia] = useState(null); // Filtro s
  const [filtros, setFiltros] = useState({
    estado: "all-states",
    sucursalOrigenId: "all-branches",
    sucursalDestinoId: "all-branches",
    clienteId: "all-clients",
    numeroGuia: "",
    fechaRango: { from: null, to: null },
    page: 1,
  }); // Formulario de nuevo enví o
  const [formData, setFormData] = useState({
    clienteId: "",
    sucursalOrigenId: "",
    sucursalDestinoId: "",
    peso: "",
    descripcion: "",
    valorDeclarado: "",
    tipoServicio: "NORMAL",
    modalidad: "SUCURSAL_SUCURSAL",
    largo: "",
    ancho: "",
    alto: "",
    observaciones: "", // ✅ Datos del remitent e
    remitenteNombre: "",
    remitenteTelefono: "",
    remitenteEmail: "",
    remitenteDireccion: "", // ✅ Datos del destinatari o
    destinatarioNombre: "",
    destinatarioTelefono: "",
    destinatarioEmail: "",
    destinatarioDireccion: "",
  }); // Estado para cotización previ a
  const [cotizacionPrevia, setCotizacionPrevia] = useState(null);
  const [calculandoCotizacion, setCalculandoCotizacion] = useState(false);   // Estados para actualización de estad o
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [descripcionEvento, setDescripcionEvento] = useState("");
  const [ubicacionEvento, setUbicacionEvento] = useState("");
  const [usuarioAsignado, setUsuarioAsignado] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [firmaUrl, setFirmaUrl] = useState("");
  useEffect(() => {
    cargarDatos();
    cargarDatosIniciales();
  }, []);
  useEffect(() => {
    cargarEnvios();
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      const estadisticasResult = await getEstadisticasEnvios();
      if (estadisticasResult.success) {
        setEstadisticas(estadisticasResult.data);
      }
    } catch (error) {}
  }; // Función para copiar número de guí a
  const copiarNumeroGuia = async (numeroGuia) => {
    try {
      await navigator.clipboard.writeText(numeroGuia);
      setCopiedGuia(numeroGuia);
      toast.success(`Número de guía ${numeroGuia} copiado al portapapeles`); // Resetear el estado después de 2 segundo s
      setTimeout(() => {
        setCopiedGuia(null);
      }, 2000);
    } catch (error) {
      toast.error("Error al copiar el número de guía");
    }
  };
  const cargarDatosIniciales = async () => {
    try {
      const [sucursalesResult, clientesResult, usuariosResult] =
        await Promise.all([getSucursales(), getClientes(), getUsuarios()]);
      if (sucursalesResult.success) setSucursales(sucursalesResult.data);
      if (clientesResult.success) setClientes(clientesResult.data);
      if (usuariosResult.success) setUsuarios(usuariosResult.data);
    } catch (error) {}
  };
  const cargarEnvios = async () => {
    try {
      setLoading(true);
      const result = await getEnvios(filtros);
      if (result.success) {
        setEnvios(result.data.envios);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al cargar envíos");
    } finally {
      setLoading(false);
    }
  };
  const calcularCotizacionPrevia = async () => {
    if (
      !formData.sucursalOrigenId ||
      !formData.sucursalDestinoId ||
      !formData.peso
    ) {
      return;
    }

    try {
      setCalculandoCotizacion(true);
      const result = await calcularCotizacionSucursal({
        sucursalOrigenId: formData.sucursalOrigenId,
        sucursalDestinoId: formData.sucursalDestinoId,
        peso: parseFloat(formData.peso),
        tipoServicio: formData.tipoServicio,
        modalidad: formData.modalidad,
        valorDeclarado: formData.valorDeclarado,
        largo: formData.largo,
        ancho: formData.ancho,
        alto: formData.alto,
      });
      if (result.success) {
        setCotizacionPrevia(result.data);
      } else {
        setCotizacionPrevia(null);
        toast.error(result.error);
      }
    } catch (error) {
      setCotizacionPrevia(null);
    } finally {
      setCalculandoCotizacion(false);
    }
  };
  const handleCreateEnvio = async (payloadFromForm) => {
    // Validar usando datos combinados y contemplando paquete del formulari o
    const combinado = { ...formData, ...payloadFromForm };
    const pesoFinal = combinado?.paquete?.peso ?? combinado?.peso;
    const descripcionFinal =
      combinado?.paquete?.descripcion ?? combinado?.descripcion; // Construir errores de campos faltantes para mostrarlos en el formulari o
    const fieldErrors = {};
    if (!combinado?.sucursalOrigenId)
      fieldErrors.sucursalOrigenId = "Seleccione sucursal de origen";
    if (!combinado?.sucursalDestinoId)
      fieldErrors.sucursalDestinoId = "Seleccione sucursal de destino";
    if (!pesoFinal) fieldErrors["paquete.peso"] = "Ingrese el peso del paquete";
    if (!descripcionFinal)
      fieldErrors["paquete.descripcion"] = "Ingrese la descripción del paquete";
    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        error: "Complete los campos requeridos",
        fieldErrors,
      };
    }

    try {
      setSaving(true);
      const extraObservaciones = [
        combinado?.quienPaga ? `Pago: ${combinado.quienPaga}` : null,
        combinado?.facturarA ? `Facturar a: ${combinado.facturarA}` : null,
      ]
        .filter(Boolean)
        .join(" | ");
      const observacionesCombinadas = [
        combinado?.observaciones?.trim(),
        extraObservaciones,
      ]
        .filter(Boolean)
        .join(" | ");
      const finalData = {
        ...combinado,
        observaciones: observacionesCombinadas,
      };
      const result = await createEnvio(finalData);
      if (result.success) {
        toast.success("Envío creado correctamente");
        setShowCreateModal(false);
        resetForm();
        await cargarEnvios();
        await cargarDatos();
        return result;
      } else {
        return result;
      }
    } catch (error) {
      return { success: false, error: "Error al crear envío" };
    } finally {
      setSaving(false);
    }
  };
  const handleUpdateStatus = async () => {
    if (!selectedEnvio || !nuevoEstado) {
      toast.error("Seleccione un estado válido");
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
        await cargarEnvios();
        await cargarDatos();
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
        await cargarEnvios();
        await cargarDatos();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al asignar envío");
    } finally {
      setSaving(false);
    }
  };
  const resetForm = () => {
    setFormData({
      clienteId: "",
      sucursalOrigenId: "",
      sucursalDestinoId: "",
      peso: "",
      descripcion: "",
      valorDeclarado: "",
      tipoServicio: "NORMAL",
      modalidad: "SUCURSAL_SUCURSAL",
      largo: "",
      ancho: "",
      alto: "",
      observaciones: "", // ✅ Datos del remitent e
      remitenteNombre: "",
      remitenteTelefono: "",
      remitenteEmail: "",
      remitenteDireccion: "", // ✅ Datos del destinatari o
      destinatarioNombre: "",
      destinatarioTelefono: "",
      destinatarioEmail: "",
      destinatarioDireccion: "",
    });
    setCotizacionPrevia(null);
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

  // Efecto para calcular cotización cuando cambian los datos relevantes
  useEffect(() => {
    const timer = setTimeout(() => {
      calcularCotizacionPrevia();
    }, 500);
    return () => clearTimeout(timer);
  }, [
    formData.sucursalOrigenId,
    formData.sucursalDestinoId,
    formData.peso,
    formData.tipoServicio,
    formData.modalidad,
    formData.valorDeclarado,
    formData.largo,
    formData.ancho,
    formData.alto,
  ]);
  return (
    <div className="space-y-6">
      {/* Header */}
      <HeaderEnvios setShowCreateModal={setShowCreateModal} />

      {/* Estadísticas */}
      {estadisticas && <EstadisticasEnvios estadisticas={estadisticas} />}

      {/* Filtros */}
      <FiltrosEnvios
        filtros={filtros}
        setFiltros={setFiltros}
        estadosEnvio={estadosEnvio}
        sucursales={sucursales}
        clientes={clientes}
      />

      {/* Tabla de Envíos */}
      <TablaEnvios
        loading={loading}
        envios={envios}
        pagination={pagination}
        filtros={filtros}
        setFiltros={setFiltros}
        setSelectedEnvio={setSelectedEnvio}
        setShowDetailModal={setShowDetailModal}
        setShowStatusModal={setShowStatusModal}
        setShowAssignModal={setShowAssignModal}
        setNuevoEstado={setNuevoEstado}
        copiedGuia={copiedGuia}
        getEstadoBadge={getEstadoBadge}
        setUsuarioAsignado={setUsuarioAsignado}
        copiarNumeroGuia={copiarNumeroGuia}
      />

      {/* Modal Crear Envío (v2) */}
      <ModalCrearEnvio
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        cotizacionPrevia={cotizacionPrevia}
        handleCreateEnvio={handleCreateEnvio}
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
