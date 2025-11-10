"use client";
import { useState } from "react";
import { getSeguimientoPublicoMejorado } from "@/lib/actions/seguimiento-mejorado";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { estadosEnvioArray, modalidadesArray } from "@/lib/constants/estados";
import Seguimiento from "@/components/envios/detalle/seguimiento";
import HeaderSeguimiento from "@/components/seguimiento/header";
import BuscadorSeguimiento from "@/components/seguimiento/buscador";
import InformacionGeneral from "@/components/envios/detalle/informacion-general";
import Remitente from "@/components/envios/detalle/remitente";
import Destinatario from "@/components/envios/detalle/destinatario";
import Origen from "@/components/envios/detalle/origen";
import Destino from "@/components/envios/detalle/destino";

const estadosEnvio = estadosEnvioArray;
const modalidades = modalidadesArray;

export default function SeguimientoPage() {
  const [guia, setGuia] = useState("");
  const [loading, setLoading] = useState(false);
  const [envio, setEnvio] = useState(null);
  const [envioAdaptado, setEnvioAdaptado] = useState(null);
  const [error, setError] = useState("");

  // Función para adaptar datos de seguimiento al formato de componentes del modal
  const adaptarEnvio = (envioSeguimiento) => {
    if (!envioSeguimiento) return null;

    return {
      ...envioSeguimiento,
      numeroGuia: envioSeguimiento.guia,
      createdAt: envioSeguimiento.fechaRegistro,
      progreso: envioSeguimiento.progreso || 0,
      // Adaptar remitente y destinatario
      remitenteNombre: envioSeguimiento.remitente?.nombre,
      remitenteTelefono: envioSeguimiento.remitente?.telefono,
      remitenteEmail: envioSeguimiento.remitente?.email,
      remitenteDireccion: envioSeguimiento.remitente?.direccion,
      remitenteTipoDocumento: envioSeguimiento.remitente?.tipoDocumento,
      remitenteNumeroDocumento: envioSeguimiento.remitente?.numeroDocumento,
      destinatarioNombre: envioSeguimiento.destinatario?.nombre,
      destinatarioTelefono: envioSeguimiento.destinatario?.telefono,
      destinatarioEmail: envioSeguimiento.destinatario?.email,
      destinatarioDireccion: envioSeguimiento.destinatario?.direccion,
      // Adaptar sucursales
      sucursal_origen: envioSeguimiento.sucursalOrigen,
      sucursal_destino: envioSeguimiento.sucursalDestino,
    };
  };

  const buscarEnvio = async () => {
    if (!guia.trim()) {
      toast.error("Ingresa un número de guía");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setEnvio(null);
      setEnvioAdaptado(null);
      const result = await getSeguimientoPublicoMejorado(
        guia.trim().toUpperCase()
      );
      if (result.success) {
        setEnvio(result.data);
        setEnvioAdaptado(adaptarEnvio(result.data));
        toast.success("Envío encontrado");
      } else {
        setError(result.error || "Envío no encontrado");
        toast.error(result.error || "Envío no encontrado");
      }
    } catch (error) {
      setError("Error al buscar el envío");
      toast.error("Error al buscar el envío");
    } finally {
      setLoading(false);
    }
  };
  const limpiarBusqueda = () => {
    setGuia("");
    setEnvio(null);
    setEnvioAdaptado(null);
    setError("");
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
      <HeaderSeguimiento />

      {/* Buscador */}
      <BuscadorSeguimiento
        guia={guia}
        setGuia={setGuia}
        buscarEnvio={buscarEnvio}
        limpiarBusqueda={limpiarBusqueda}
        loading={loading}
      />

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado del Seguimiento */}
      {envioAdaptado && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Información General */}
            <InformacionGeneral
              envio={envioAdaptado}
              modalidades={modalidades}
              getEstadoBadge={getEstadoBadge}
            />

            {/* Remitente */}
            <Remitente envio={envioAdaptado} />

            {/* Destinatario */}
            <Destinatario envio={envioAdaptado} />

            {/* Origen */}
            <Origen envio={envioAdaptado} />

            {/* Destino */}
            <Destino envio={envioAdaptado} />
          </div>

          {/* Historial de Eventos - ocupa todo el ancho */}
          {envio.eventos && envio.eventos.length > 0 && (
            <div className="w-full">
              <Seguimiento envio={envio} />
            </div>
          )}
        </div>
      )}
      {/* Información de ayuda cuando no hay búsqueda */}
      {!envio && !error && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Rastrea tu envío</h3>
              <p className="text-muted-foreground mb-4">
                Ingresa el número de guía en el campo de búsqueda para ver el
                estado actual y el historial completo de tu envío.
              </p>
              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>Ejemplo de guía:</strong> CG2025000001
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
