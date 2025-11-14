"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Package,
  CreditCard,
  Printer,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { buscarEnvioPorGuia, buscarEnviosParaPago } from "@/lib/actions/envios";
import { registrarPago } from "@/lib/actions/pagos";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency } from "@/lib/utils/formatters";
import Modal from "@/components/ui/modal";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

const metodosPago = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA_CREDITO", label: "Tarjeta de Crédito" },
  { value: "TARJETA_DEBITO", label: "Tarjeta de Débito" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "DEPOSITO", label: "Depósito" },
  { value: "YAPE", label: "Yape" },
  { value: "PLIN", label: "Plin" },
  { value: "BILLETERA_DIGITAL", label: "Billetera Digital" },
];

export default function ModalRegistroPagoMejorado({
  isOpen,
  onClose,
  onPagoRegistrado,
}) {
  const [paso, setPaso] = useState(2); // 1: Buscar envío, 2: Registrar pago, 3: Voucher
  const [buscandoEnvio, setBuscandoEnvio] = useState(false);
  const [guardandoPago, setGuardandoPago] = useState(false);

  // Estados para búsqueda de envío
  const [queryGuia, setQueryGuia] = useState("");
  const [envioSeleccionado, setEnvioSeleccionado] = useState(null);
  const [sugerenciasEnvios, setSugerenciasEnvios] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const queryDebounced = useDebounce(queryGuia, 300);
  const inputRef = useRef(null);

  // Estados para el pago
  const [datosPago, setDatosPago] = useState({
    monto: "",
    metodo: "EFECTIVO",
    referencia: "",
    fecha: new Date(),
  });

  // Estado para el voucher
  const [pagoRegistrado, setPagoRegistrado] = useState(null);

  // Buscar envíos cuando cambia la query
  useEffect(() => {
    if (queryDebounced && queryDebounced.length >= 2) {
      buscarEnvios();
    } else {
      setSugerenciasEnvios([]);
      setMostrarSugerencias(false);
    }
  }, [queryDebounced]);

  const buscarEnvios = async () => {
    try {
      const resultado = await buscarEnviosParaPago(queryDebounced);
      if (resultado.success) {
        setSugerenciasEnvios(resultado.data);
        setMostrarSugerencias(true);
      }
    } catch (error) {
      console.error("Error al buscar envíos:", error);
    }
  };

  const seleccionarEnvio = async (guia) => {
    try {
      setBuscandoEnvio(true);
      const resultado = await buscarEnvioPorGuia(guia);

      if (resultado.success) {
        setEnvioSeleccionado(resultado.data);
        setDatosPago((prev) => ({
          ...prev,
          monto: resultado.data.saldoPendiente.toFixed(2),
        }));
        setQueryGuia(guia);
        setMostrarSugerencias(false);
        setPaso(2);
      } else {
        toast.error(resultado.error);
      }
    } catch (error) {
      toast.error("Error al obtener datos del envío");
    } finally {
      setBuscandoEnvio(false);
    }
  };

  const registrarPagoHandler = async () => {
    if (!envioSeleccionado || !datosPago.monto || !datosPago.metodo) {
      toast.error("Complete todos los campos requeridos");
      return;
    }

    const montoNumerico = parseFloat(datosPago.monto);
    if (montoNumerico <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    if (montoNumerico > envioSeleccionado.saldoPendiente) {
      toast.error("El monto no puede ser mayor al saldo pendiente");
      return;
    }

    try {
      setGuardandoPago(true);

      const datosEnvio = {
        guia: envioSeleccionado.guia,
        monto: montoNumerico,
        metodo: datosPago.metodo,
        referencia: datosPago.referencia,
        fecha: format(datosPago.fecha, "yyyy-MM-dd"),
      };

      console.log("💰 Registrando pago con datos:", datosEnvio);

      const resultado = await registrarPago(datosEnvio);

      if (resultado.success) {
        setPagoRegistrado({
          ...resultado.data,
          envio: envioSeleccionado,
          datosPago,
        });
        setPaso(3);
        toast.success("Pago registrado correctamente");
        onPagoRegistrado?.();
      } else {
        toast.error(resultado.error || "Error al registrar pago");
      }
    } catch (error) {
      toast.error("Error al registrar pago");
    } finally {
      setGuardandoPago(false);
    }
  };

  const abrirVoucherCompleto = () => {
    if (pagoRegistrado?.id) {
      // Abrir el voucher completo en nueva ventana con parámetro de impresión
      const voucherUrl = `/dashboard/pagos/voucher/${pagoRegistrado.id}?print=true&format=80`;
      window.open(voucherUrl, "_blank");
    }
  };

  const verVoucherCompleto = () => {
    if (pagoRegistrado?.id) {
      // Abrir el voucher completo en nueva ventana sin impresión automática
      const voucherUrl = `/dashboard/pagos/voucher/${pagoRegistrado.id}`;
      window.open(voucherUrl, "_blank");
    }
  };

  const resetModal = () => {
    setPaso(1);
    setQueryGuia("");
    setEnvioSeleccionado(null);
    setSugerenciasEnvios([]);
    setMostrarSugerencias(false);
    setDatosPago({
      monto: "",
      metodo: "EFECTIVO",
      referencia: "",
      fecha: new Date(),
    });
    setPagoRegistrado(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const renderPaso1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Buscar Envío</h3>
        <p className="text-muted-foreground">
          Ingrese el número de guía para buscar el envío
        </p>
      </div>

      <div className="relative">
        <Label htmlFor="guia">Número de Guía</Label>
        <Input
          ref={inputRef}
          id="guia"
          placeholder="Ej: LA-20251029-150603"
          value={queryGuia}
          onChange={(e) => setQueryGuia(e.target.value)}
          className="mt-1"
          autoComplete="off"
        />

        {buscandoEnvio && (
          <div className="absolute right-3 top-9">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}

        {/* Sugerencias */}
        {mostrarSugerencias && sugerenciasEnvios.length > 0 && (
          <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
            <CardContent className="p-0">
              {sugerenciasEnvios.map((envio) => (
                <div
                  key={envio.id}
                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                  onClick={() => seleccionarEnvio(envio.guia)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-sm font-medium">
                        {envio.guia}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {envio.cliente}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        S/ {envio.saldoPendiente.toFixed(2)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {envio.estado}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {queryGuia && sugerenciasEnvios.length === 0 && !buscandoEnvio && (
        <div className="text-center py-4">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            No se encontraron envíos con esa guía
          </p>
        </div>
      )}
    </div>
  );

  const renderPaso2 = () => (
    <div className="space-y-6">
      {/* Información del envío */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Información del Envío
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Guía</Label>
              <p className="font-mono font-medium">{envioSeleccionado?.guia}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Estado</Label>
              <Badge variant="outline">{envioSeleccionado?.estado}</Badge>
            </div>
            <div>
              <Label className="text-muted-foreground capitalize">
                Cliente
              </Label>
              <p>{envioSeleccionado?.cliente}</p>
            </div>
            <div>
              <Label className="text-muted-foreground capitalize">
                Destinatario
              </Label>
              <p>{envioSeleccionado?.destinatario}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Ruta</Label>
              <p className="text-sm">
                {envioSeleccionado?.sucursalOrigen} →
                {envioSeleccionado?.sucursalDestino}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Total Envío</Label>
              <p className="font-semibold">
                {formatCurrency(envioSeleccionado?.total)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Total Pagado</Label>
              <p>{formatCurrency(envioSeleccionado?.totalPagado)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Saldo Pendiente</Label>
              <p className="font-semibold text-lg text-red-600">
                {formatCurrency(envioSeleccionado?.saldoPendiente)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario de pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Datos del Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto">Monto a Pagar *</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0.01"
                max={envioSeleccionado?.saldoPendiente}
                value={datosPago.monto}
                onChange={(e) =>
                  setDatosPago((prev) => ({ ...prev, monto: e.target.value }))
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metodo">Método de Pago *</Label>
              <Select
                value={datosPago.metodo}
                onValueChange={(value) =>
                  setDatosPago((prev) => ({ ...prev, metodo: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metodosPago.map((metodo) => (
                    <SelectItem key={metodo.value} value={metodo.value}>
                      {metodo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referencia">Referencia</Label>
            <Input
              id="referencia"
              placeholder="Número de operación, voucher, etc."
              value={datosPago.referencia}
              onChange={(e) =>
                setDatosPago((prev) => ({
                  ...prev,
                  referencia: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha del Pago *</Label>
            <DatePicker
              date={datosPago.fecha}
              setDate={(date) => ({ ...prev, fecha: date || new Date() })}
              placeholder="Selecciona la fecha de pago"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setPaso(1)}>
          Volver
        </Button>
        <Button onClick={registrarPagoHandler} disabled={guardandoPago}>
          {guardandoPago ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Registrando...
            </>
          ) : (
            "Registrar Pago"
          )}
        </Button>
      </div>
    </div>
  );

  const renderPaso3 = () => (
    <div className="space-y-6">
      {/* Confirmación de pago registrado */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <span className="text-xl font-semibold text-green-600">
            ¡Pago Registrado Exitosamente!
          </span>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Guía:</span>
              <div className="font-mono">{pagoRegistrado?.envio?.guia}</div>
            </div>
            <div>
              <span className="font-medium">Monto:</span>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(pagoRegistrado?.datosPago?.monto)}
              </div>
            </div>
            <div>
              <span className="font-medium">Método:</span>
              <div>
                {
                  metodosPago.find(
                    (m) => m.value === pagoRegistrado?.datosPago?.metodo
                  )?.label
                }
              </div>
            </div>
            <div>
              <span className="font-medium">Fecha:</span>
              <div>
                {new Date(
                  pagoRegistrado?.datosPago?.fecha
                ).toLocaleDateString()}
              </div>
            </div>
          </div>

          {pagoRegistrado?.datosPago?.referencia && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <span className="font-medium">Referencia:</span>
              <div className="font-mono">
                {pagoRegistrado.datosPago.referencia}
              </div>
            </div>
          )}
        </div>

        <div className="text-sm">
          <p>El voucher completo se abrirá en una nueva ventana.</p>
          <p>Puede imprimirlo o compartirlo desde allí.</p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleClose}>
          Cerrar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={verVoucherCompleto}>
            <Eye className="h-4 w-4 mr-2" />
            Ver Voucher
          </Button>
          <Button onClick={abrirVoucherCompleto}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Voucher
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              resetModal();
              setPaso(1);
            }}
          >
            Registrar Otro Pago
          </Button>
        </div>
      </div>
    </div>
  );

  const title = {
    1: "Buscar Envío",
    2: "Registrar Pago",
    3: "Voucher de Pago",
  };

  return (
    <Modal open={isOpen} onOpenChange={handleClose} title={title[paso]}>
      {paso === 1 && renderPaso1()}
      {paso === 2 && renderPaso2()}
      {paso === 3 && renderPaso3()}
    </Modal>
  );
}
