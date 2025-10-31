"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  ArrowRight,
  Package,
  User,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  FileText,
  Truck,
  AlertCircle,
  CheckCircle,
  Loader2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCotizacionById,
  convertirCotizacionAEnvio,
} from "@/lib/actions/cotizaciones";
import { formatSoles, formatDate } from "@/lib/utils/formatters";
import ModalDatosCliente from "./modal-datos-cliente";
const estadoColors = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  APROBADA: "bg-green-100 text-green-800",
  RECHAZADA: "bg-red-100 text-red-800",
  CONVERTIDA_ENVIO: "bg-blue-100 text-blue-800",
  EXPIRADA: "bg-gray-100 text-gray-800",
};
const estadoLabels = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  CONVERTIDA_ENVIO: "Convertida a Envío",
  EXPIRADA: "Expirada",
};
const tipoServicioLabels = {
  NORMAL: "Normal",
  EXPRESS: "Express",
  OVERNIGHT: "Overnight",
  ECONOMICO: "Económico",
};
const modalidadLabels = {
  SUCURSAL_SUCURSAL: "Sucursal a Sucursal",
  SUCURSAL_DOMICILIO: "Sucursal a Domicilio",
  DOMICILIO_SUCURSAL: "Domicilio a Sucursal",
  DOMICILIO_DOMICILIO: "Domicilio a Domicilio",
};
export default function ModalDetalleCotizacion({
  isOpen,
  onClose,
  cotizacionId,
  onCotizacionActualizada,
}) {
  const [cotizacion, setCotizacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [convirtiendo, setConvirtiendo] = useState(false);
  const [modalDatosCliente, setModalDatosCliente] = useState({
    isOpen: false,
    requiresData: false,
  });
  useEffect(() => {
    if (isOpen && cotizacionId) {
      cargarCotizacion();
    }
  }, [isOpen, cotizacionId]);
  const cargarCotizacion = async () => {
    try {
      setLoading(true);
      const result = await getCotizacionById(cotizacionId);
      if (result.success) {
        setCotizacion(result.data);
      } else {
        toast.error(result.error);
        onClose();
      }
    } catch (error) {
      toast.error("Error al cargar los detalles de la cotización");
      onClose();
    } finally {
      setLoading(false);
    }
  };
  const handleConvertirAEnvio = async (datosCliente = null) => {
    try {
      setConvirtiendo(true);
      const result = await convertirCotizacionAEnvio(
        cotizacionId,
        datosCliente
      );
      if (result.success) {
        toast.success(result.message);
        onCotizacionActualizada?.();
        setModalDatosCliente({ isOpen: false, requiresData: false });
        onClose();
      } else if (result.requiresClientData) {
        // Si se requieren datos del cliente, abrir el moda l
        setModalDatosCliente({ isOpen: true, requiresData: true });
        toast.info("Se requieren datos del cliente para crear el envío");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al convertir la cotización a envío");
    } finally {
      setConvirtiendo(false);
    }
  };
  const handleDatosClienteSubmit = (datosCliente) => {
    handleConvertirAEnvio(datosCliente);
  };
  const handleCerrarModalDatos = () => {
    setModalDatosCliente({ isOpen: false, requiresData: false });
    setConvirtiendo(false);
  };
  const isExpired = (validoHasta) => {
    return new Date(validoHasta) < new Date();
  };
  const puedeConvertirse =
    cotizacion &&
    (cotizacion.estado === "PENDIENTE" || cotizacion.estado === "APROBADA") &&
    !isExpired(cotizacion.validoHasta);
  if (!cotizacion && !loading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Detalles de Cotización
            {cotizacion && (
              <Badge className={`ml-2 ${estadoColors[cotizacion.estado]}`}>
                {estadoLabels[cotizacion.estado]}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Cargando detalles...
            </span>
          </div>
        ) : cotizacion ? (
          <div className="space-y-6">
            {/* Resumen Superior */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">ID</div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(cotizacion.id);
                        toast.success("ID copiado al portapapeles");
                      }}
                      title="Copiar ID"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="font-mono text-sm break-all">
                    {cotizacion.id}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {formatDate(cotizacion.createdAt)}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" /> Válido hasta:
                    {formatDate(cotizacion.validoHasta)}
                    {isExpired(cotizacion.validoHasta) && (
                      <span className="ml-1 text-red-600 font-medium">
                        (Expirada)
                      </span>
                    )}
                  </div>
                </div>
                <div className="md:border-l md:border-r border-dashed md:px-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">
                        {tipoServicioLabels[cotizacion.tipoServicio]}
                      </Badge>
                      <Badge variant="outline">
                        {modalidadLabels[cotizacion.modalidad]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="text-center">
                        <div className="font-medium">
                          {cotizacion.sucursalOrigen?.nombre}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {cotizacion.sucursalOrigen?.provincia}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <div className="text-center">
                        <div className="font-medium">
                          {cotizacion.sucursalDestino?.nombre}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {cotizacion.sucursalDestino?.provincia}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:text-right">
                  <div className="text-xs text-muted-foreground">
                    Precio Final
                  </div>
                  <div className="mt-1 inline-flex items-center rounded-md bg-green-50 px-3 py-2 text-green-700 ring-1 ring-inset ring-green-600/20">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span className="text-xl font-bold">
                      {formatSoles(cotizacion.precioFinal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Información General */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">ID:</span>
                    <span className="font-mono text-sm">
                      {cotizacion.id.slice(-12)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Fecha:
                    </span>
                    <span className="text-sm">
                      {formatDate(cotizacion.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Válido hasta:
                    </span>
                    <div className="text-right">
                      <div className="text-sm">
                        {formatDate(cotizacion.validoHasta)}
                      </div>
                      {isExpired(cotizacion.validoHasta) && (
                        <div className="text-xs text-red-600">Expirada</div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Servicio:
                    </span>
                    <Badge variant="outline">
                      {tipoServicioLabels[cotizacion.tipoServicio]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Modalidad:
                    </span>
                    <span className="text-sm">
                      {modalidadLabels[cotizacion.modalidad]}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Precios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Precio Base:
                    </span>
                    <span className="text-sm">
                      {formatSoles(cotizacion.precioBase)}
                    </span>
                  </div>
                  {cotizacion.descuento > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Descuento:
                      </span>
                      <span className="text-sm text-red-600">
                        -{formatSoles(cotizacion.descuento)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">Precio Final:</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatSoles(cotizacion.precioFinal)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Ruta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Ruta de Envío
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Origen</span>
                    </div>
                    <div className="text-sm">
                      {cotizacion.sucursalOrigen?.nombre}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cotizacion.sucursalOrigen?.provincia}
                    </div>
                  </div>
                  <ArrowRight className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Destino</span>
                    </div>
                    <div className="text-sm">
                      {cotizacion.sucursalDestino?.nombre}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cotizacion.sucursalDestino?.provincia}
                    </div>
                  </div>
                </div>
                {cotizacion.direccionEntrega && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        Dirección de Entrega
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="ml-auto"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            cotizacion.direccionEntrega
                          );
                          toast.success("Dirección copiada");
                        }}
                        title="Copiar dirección"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700">
                      {cotizacion.direccionEntrega}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Información del Paquete */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" /> Información del Paquete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Peso:</span>
                    <div className="font-medium">{cotizacion.peso} kg</div>
                  </div>
                  {cotizacion.alto && (
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Alto:
                      </span>
                      <div className="font-medium">{cotizacion.alto} cm</div>
                    </div>
                  )}
                  {cotizacion.ancho && (
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Ancho:
                      </span>
                      <div className="font-medium">{cotizacion.ancho} cm</div>
                    </div>
                  )}
                  {cotizacion.profundo && (
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Profundo:
                      </span>
                      <div className="font-medium">
                        {cotizacion.profundo} cm
                      </div>
                    </div>
                  )}
                </div>
                {cotizacion.volumen && (
                  <div className="mt-3">
                    <span className="text-sm text-muted-foreground">
                      Volumen:
                    </span>
                    <span className="ml-2 font-medium">
                      {cotizacion.volumen} m³
                    </span>
                  </div>
                )}
                {cotizacion.contenido && (
                  <div className="mt-3">
                    <span className="text-sm text-muted-foreground">
                      Contenido:
                    </span>
                    <p className="mt-1 text-sm">{cotizacion.contenido}</p>
                  </div>
                )}
                {cotizacion.valorDeclarado && (
                  <div className="mt-3">
                    <span className="text-sm text-muted-foreground">
                      Valor Declarado:
                    </span>
                    <span className="ml-2 font-medium">
                      {formatSoles(cotizacion.valorDeclarado)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Información del Cliente */}
            {(cotizacion.nombreCliente || cotizacion.cliente) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" /> Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Nombre:
                      </span>
                      <div className="font-medium">
                        {cotizacion.nombreCliente ||
                          (cotizacion.cliente &&
                            `${cotizacion.cliente.nombre} ${
                              cotizacion.cliente.apellidos || ""
                            }`) ||
                          "Cliente anónimo"}
                      </div>
                    </div>
                    {cotizacion.telefonoCliente && (
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Teléfono:
                        </span>
                        <div className="font-medium flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {cotizacion.telefonoCliente}
                        </div>
                      </div>
                    )}
                    {cotizacion.emailCliente && (
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Email:
                        </span>
                        <div className="font-medium flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {cotizacion.emailCliente}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Acciones */}
            <div className="sticky bottom-0 bg-background pt-4 border-t mt-2 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              {puedeConvertirse && (
                <Button
                  onClick={() => handleConvertirAEnvio()}
                  disabled={convirtiendo}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {convirtiendo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Convirtiendo...
                    </>
                  ) : (
                    <>
                      <Truck className="mr-2 h-4 w-4" /> Convertir a Envío
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : null}
        {/* Modal para capturar datos del cliente */}
        <ModalDatosCliente
          isOpen={modalDatosCliente.isOpen}
          onClose={handleCerrarModalDatos}
          onSubmit={handleDatosClienteSubmit}
          loading={convirtiendo}
          cotizacion={cotizacion}
        />
      </DialogContent>
    </Dialog>
  );
}
