import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import InformacionGeneral from "./detalle/informacion-general";
import Remitente from "./detalle/remitente";
import Destinatario from "./detalle/destinatario";
import Origen from "./detalle/origen";
import Destino from "./detalle/destino";
import ClienteFacturacion from "./detalle/cliente-facturacion";
import ResponsableRecojo from "./detalle/responsable-recojo";
import DetallePaquete from "./detalle/detalle-paquete";
import Costos from "./detalle/costos";
import Seguimiento from "./detalle/seguimiento";
import Observaciones from "./detalle/observaciones";

export default function ModalDetalle({
  open,
  onOpenChange,
  envio,
  getEstadoBadge,
  modalidades,
}) {
  return (
    <Modal
      title="Detalle del Envío"
      description={`Información completa del envío ${envio?.numeroGuia}`}
      open={open}
      onOpenChange={onOpenChange}
      icon={<Package className="h-5 w-5" />}
      titleClassName="text-xl sm:text-2xl font-bold"
      descriptionClassName="text-xs sm:text-sm text-muted-foreground"
      size="lg"
    >
      {envio && (
        <div className="space-y-4 pb-2">
          {/* Grid responsive: 1 columna en móvil, 2 en tablet/desktop */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Información General */}
            <InformacionGeneral
              envio={envio}
              modalidades={modalidades}
              getEstadoBadge={getEstadoBadge}
            />

            {/* Remitente */}
            <Remitente envio={envio} />

            {/* Destinatario */}
            <Destinatario envio={envio} />

            {/* Origen */}
            <Origen envio={envio} />

            {/* Destino */}
            <Destino envio={envio} />

            {/* Cliente de Facturación */}
            {(envio?.clienteFacturacion ||
              envio?.clienteFacturacionNombre ||
              envio?.clienteFacturacionRazonSocial) && (
              <ClienteFacturacion envio={envio} />
            )}

            {/* Responsable de Recojo */}
            {(envio?.responsableRecojoNombre ||
              envio?.responsableRecojoTelefono ||
              envio?.responsableRecojoEmail ||
              envio?.responsableRecojoDireccion ||
              envio?.responsableRecojoEmpresa) && (
              <ResponsableRecojo envio={envio} />
            )}

            {/* Detalles del Paquete */}
            <DetallePaquete envio={envio} />

            {/* Costos */}
            <Costos envio={envio} />
          </div>

          {/* Seguimiento - ocupa todo el ancho */}
          {envio.eventos && envio.eventos.length > 0 && (
            <div className="w-full">
              <Seguimiento envio={envio} getEstadoBadge={getEstadoBadge} />
            </div>
          )}

          {/* Observaciones - ocupa todo el ancho */}
          {envio.observaciones && (
            <div className="w-full">
              <Observaciones envio={envio} />
            </div>
          )}
        </div>
      )}

      {/* Footer sticky con mejor responsive */}
      <div className="sticky bottom-0 bg-background py-3 sm:py-4 border-t mt-2 flex justify-end items-center gap-2 sm:gap-3">
        <Button 
          variant="outline" 
          onClick={() => onOpenChange(false)}
          className="w-full sm:w-auto text-sm sm:text-base"
        >
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}