"use client";

import { useEffect, useState, use as useUnwrap } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getPagoDetalle, getPagosPorEnvio } from "@/lib/actions/pagos";
import { toast } from "sonner";
import { useEmpresaConfig } from "@/hooks/use-empresa-config";
import { QRCodeCanvas } from "qrcode.react";
import { useVoucher } from "@/hooks/use-voucher";

export default function VoucherPage({ params }) {
  const resolvedParams = useUnwrap(params);
  const id = resolvedParams?.id;

  const [loading, setLoading] = useState(true);
  const [pago, setPago] = useState(null);
  const [pagosEnvio, setPagosEnvio] = useState([]);
  const { empresaConfig } = useEmpresaConfig();
  const { formato, setFormato, fullUrl, isPrintMode, shouldClose } = useVoucher(
    pago?.id
  );

  useEffect(() => {
    async function cargar() {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const res = await getPagoDetalle(id);

        if (!res?.success) {
          toast.error(res?.error || "No se encontró el pago");
          setLoading(false);
          return;
        }

        setPago(res.data);
      } catch (error) {
        toast.error("Error al cargar el voucher");
      } finally {
        setLoading(false);
      }
    }

    cargar();
  }, [id]);

  // Formato y URL ahora se manejan en el hook useVoucher
  useEffect(() => {
    async function cargarPagosEnvio() {
      if (!pago?.envioId) return;
      const res = await getPagosPorEnvio(pago.envioId);
      if (res?.success) {
        setPagosEnvio(res.data || []);
      }
    }
    cargarPagosEnvio();
  }, [pago?.envioId]);

  const imprimir = () => {
    try {
      window.print();
    } catch (e) {
      // noop
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isPrintMode || !pago) return; // Solo ejecutar cuando tengamos los datos

    const handleAfterPrint = () => {
      if (shouldClose) {
        try {
          if (window.opener) window.close();
        } catch {}
      }
    };

    const handleBeforePrint = () => {
      // Se ejecuta antes de imprimir
    };

    // Detectar si el usuario cancela la impresión
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && shouldClose) {
        try {
          if (window.opener) window.close();
        } catch {}
      }
    };

    // Esperar un poco más para asegurar que el DOM esté listo
    const timer = setTimeout(() => {
      try {
        window.print();
      } catch {}
    }, 800); // Aumentado a 800ms

    // Agregar un timeout para cerrar automáticamente si no se imprime
    const autoCloseTimer = setTimeout(() => {
      if (shouldClose && isPrintMode) {
        try {
          if (window.opener) window.close();
        } catch {}
      }
    }, 15000); // 15 segundos

    window.addEventListener("afterprint", handleAfterPrint);
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoCloseTimer);
      window.removeEventListener("afterprint", handleAfterPrint);
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPrintMode, shouldClose, pago]); // Agregar pago como dependencia

  // Siempre declarar hooks antes de cualquier return condicional (los del hook ya están arriba)
  if (loading && !pago) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Cargando voucher...</p>
          <p className="text-sm text-gray-500 mt-2">ID: {id}</p>
          {isPrintMode && (
            <p className="text-xs text-blue-600 mt-2">
              Preparando para impresión...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">ID de pago no válido</p>
          <Button onClick={() => window.history.back()} className="mt-4">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  if (!pago) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Pago no encontrado</p>
          <p className="text-sm text-gray-500 mt-2">ID: {id}</p>
          <Button onClick={() => window.history.back()} className="mt-4">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  // Verificar que tengamos todos los datos necesarios
  if (!pago.envios) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Cargando datos del envío...</p>
        </div>
      </div>
    );
  }

  const cliente = pago.envios?.cliente || {};
  const sucOrigen = pago.envios?.sucursalOrigen || {};
  const sucDestino = pago.envios?.sucursalDestino || {};
  const totalEnvio = Number(pago.envios?.total || 0);
  const pagadoTotal = pagosEnvio.reduce(
    (sum, p) => sum + Number(p.monto || 0),
    0
  );
  const saldoPendiente = Math.max(0, totalEnvio - pagadoTotal);
  const estadoEnvio =
    pagadoTotal >= totalEnvio - 0.0001
      ? "Cancelado"
      : pagadoTotal > 0
      ? "Parcial"
      : "Pendiente";
  const voucherNumero = `PG-${new Date(pago.fecha).getFullYear()}-${String(
    pago.id
  )
    .slice(0, 8)
    .toUpperCase()}`;

  // Formatear nombre del cliente
  const nombreCliente = cliente.esEmpresa
    ? cliente.razonSocial || cliente.nombre || "Cliente no especificado"
    : `${cliente.nombre || ""} ${cliente.apellidos || ""}`.trim() ||
      "Cliente no especificado";

  return (
    <div
      className={`max-w-2xl mx-auto p-4 space-y-2 ticket-print ${
        formato === "58" ? "ticket-58" : "ticket-80"
      }`}
    >
      {/* Nota: el tamaño de página para impresión se maneja globalmente en globals-print.css para evitar páginas en blanco. La anchura del ticket se controla con clases .ticket-58 y .ticket-80. */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-10 w-auto logo"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div>
            <div className="text-xl font-semibold">
              {empresaConfig?.nombre || "Mi Empresa"}
            </div>
            <div className="text-xs text-muted-foreground">
              RUC {empresaConfig?.ruc || "-"}
            </div>
            {empresaConfig?.direccion && (
              <div className="text-xs text-muted-foreground">
                {empresaConfig.direccion}
              </div>
            )}
            {empresaConfig?.telefono && (
              <div className="text-xs text-muted-foreground">
                Tel: {empresaConfig.telefono}
              </div>
            )}
          </div>
        </div>
        {!isPrintMode && (
          <div className="flex gap-2 header-actions">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              aria-label="Volver"
            >
              Volver
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                try {
                  const u = new URL(fullUrl);
                  navigator.clipboard?.writeText(u.toString());
                  toast.success("Enlace copiado", {
                    description: "El enlace del voucher fue copiado",
                  });
                } catch {}
              }}
              aria-label="Copiar enlace del voucher"
            >
              Copiar enlace
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setFormato((f) => {
                  const next = f === "80" ? "58" : "80";
                  try {
                    window.localStorage.setItem("voucherFormat", next);
                  } catch {}
                  return next;
                })
              }
              aria-label="Cambiar formato"
            >
              Formato: {formato === "58" ? "58mm" : "80mm"}
            </Button>
            <Button onClick={imprimir} aria-label="Descargar PDF">
              Descargar PDF
            </Button>
          </div>
        )}
      </div>
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:p-1">
          <CardTitle className="flex items-center justify-between text-base print:text-sm">
            <span>Comprobante de Pago</span>
            <span className="font-mono text-sm print:text-xs">
              {voucherNumero}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 print:space-y-1 print:p-1">
          <div className="grid grid-cols-2 gap-2 print:gap-1 print:text-xs">
            <div>
              <div className="text-sm text-muted-foreground print:text-xs">
                Voucher
              </div>
              <div className="font-mono text-sm print:text-xs">
                {voucherNumero}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground print:text-xs">
                Fecha
              </div>
              <div className="text-sm print:text-xs">
                {new Date(pago.fecha).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground print:text-xs">
                Cliente
              </div>
              <div className="text-sm print:text-xs">{nombreCliente}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground print:text-xs">
                Guía
              </div>
              <div className="font-mono text-sm print:text-xs">
                {pago.envios?.guia || pago.envioId}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground print:text-xs">
                Estado del envío
              </div>
              <div className="font-semibold text-sm print:text-xs">
                {estadoEnvio}
              </div>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-2 print:gap-1 print:text-xs">
            <div>
              <div className="text-sm text-muted-foreground print:text-xs">
                Sucursal Origen
              </div>
              <div className="text-sm print:text-xs">
                {sucOrigen?.nombre || "-"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground print:text-xs">
                Sucursal Destino
              </div>
              <div className="text-sm print:text-xs">
                {sucDestino?.nombre || "-"}
              </div>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-2 print:gap-1 print:text-xs">
            <div>
              <div className="text-sm text-muted-foreground print:text-xs">
                Método
              </div>
              <div className="text-sm print:text-xs">{pago.metodo}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground print:text-xs">
                Referencia
              </div>
              <div className="text-sm print:text-xs">
                {pago.referencia || "-"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground print:text-xs">
                Monto
              </div>
              <div className="font-semibold text-sm print:text-xs">
                S/ {Number(pago.monto || 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground print:text-xs">
                Total Envío
              </div>
              <div className="text-sm print:text-xs">
                S/ {Number(pago.envios?.total || 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground print:text-xs">
                Saldo pendiente
              </div>
              <div className="font-semibold text-sm print:text-xs">
                S/ {saldoPendiente.toFixed(2)}
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between qr-box print:flex-col print:items-center print:space-y-1">
            <div className="space-y-1 print:text-center">
              <div className="text-sm text-muted-foreground print:text-xs">
                QR del pago
              </div>
              <div className="text-xs text-muted-foreground print:text-[8px]">
                Escanee para abrir el voucher
              </div>
              <div className="text-[10px] text-muted-foreground break-all print:hidden">
                {fullUrl}
              </div>
            </div>
            <div className="qr">
              <QRCodeCanvas value={fullUrl} size={140} includeMargin={true} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial de pagos del envío (contexto de cajero) */}
      {estadoEnvio !== "Cancelado" && pagosEnvio?.length > 0 && (
        <Card className="no-print">
          <CardHeader>
            <CardTitle className="text-sm">
              Historial de pagos del envío
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pagosEnvio.map((pp) => (
                <div key={pp.id} className="grid grid-cols-4 gap-2 text-xs">
                  <div>{new Date(pp.fecha).toLocaleDateString()}</div>
                  <div>{pp.metodo}</div>
                  <div className="truncate">{pp.referencia || "-"}</div>
                  <div className="text-right font-medium">
                    S/ {Number(pp.monto || 0).toFixed(2)}
                  </div>
                </div>
              ))}
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Total envío</div>
                <div className="text-right">
                  S/ {Number(totalEnvio || 0).toFixed(2)}
                </div>
                <div>Pagado</div>
                <div className="text-right">
                  S/ {Number(pagadoTotal || 0).toFixed(2)}
                </div>
                <div className="font-semibold">Saldo pendiente</div>
                <div className="text-right font-semibold">
                  S/ {saldoPendiente.toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-muted-foreground text-center">
        Gracias por su preferencia
      </div>
    </div>
  );
}
