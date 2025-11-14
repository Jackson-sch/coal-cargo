import Modal from "@/components/ui/modal"
import { Eye, Calendar, User, Package, CreditCard, FileText, MessageSquare } from "lucide-react"
import { Label } from "@/components/ui/label"
import { formatDate, formatSoles } from "@/lib/utils/formatters"
import { Badge } from "@/components/ui/badge"

export default function ModalDetalle({ detalleOpen, detallePago, setDetalleOpen, detalleLoading, metodosPago }) {
  const cliente = detallePago?.envios?.cliente || detallePago?.cliente
  const nombreCliente = cliente
    ? cliente.esEmpresa
      ? cliente.razonSocial || cliente.nombre || "Cliente no especificado"
      : `${cliente.nombre || ""} ${cliente.apellidos || ""}`.trim() || "Cliente no especificado"
    : "Cliente no especificado"

  const metodoPago = metodosPago.find((m) => m.value === detallePago?.metodo)?.label

  const diasDesde = detallePago?.fecha
    ? Math.floor((new Date() - new Date(detallePago.fecha)) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Modal
      title="Detalle del Pago"
      open={detalleOpen}
      onOpenChange={setDetalleOpen}
      icon={<Eye className="h-5 w-5" />}
      size="default"
      loading={detalleLoading}
    >
      {detallePago ? (
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-primary/10 to-primary/5 rounded-lg p-4 border border-muted">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Monto</Label>
                <p className="text-3xl font-bold text-primary mt-1">{formatSoles(detallePago.monto)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="outline" className="bg-primary/5">
                  {metodoPago || "N/A"}
                </Badge>
                {diasDesde !== null && <p className="text-xs text-muted-foreground">hace {diasDesde} días</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ID del Pago */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">ID Pago</Label>
              </div>
              <p className="font-mono text-sm bg-muted/50 p-2 rounded text-muted-foreground truncate">
                {detallePago.id}
              </p>
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Fecha</Label>
              </div>
              <p className="text-sm font-medium">{formatDate(detallePago.fecha || detallePago.createdAt)}</p>
            </div>

            {/* Cliente */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Cliente</Label>
              </div>
              <p className="text-sm font-medium line-clamp-1">{nombreCliente}</p>
            </div>

            {/* Envío */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Envío</Label>
              </div>
              <p className="font-mono text-sm bg-muted/50 p-2 rounded text-muted-foreground truncate">
                {detallePago.envio ||
                  detallePago.envioId ||
                  detallePago.envios?.guia ||
                  detallePago.envios?.numeroGuia ||
                  "N/A"}
              </p>
            </div>
          </div>

          {detallePago.referencia && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Referencia</Label>
              </div>
              <p className="text-sm bg-muted/50 p-2 rounded font-mono">{detallePago.referencia}</p>
            </div>
          )}

          {detallePago.observaciones && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Observaciones</Label>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{detallePago.observaciones}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Eye className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No se pudo cargar el detalle del pago</p>
        </div>
      )}
    </Modal>
  )
}
