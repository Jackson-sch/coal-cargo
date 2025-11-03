import { Package } from "lucide-react";
import FormularioEnvioV2 from "@/components/envios/v2/FormularioEnvio";
import Modal from "../ui/modal";

export default function ModalCrearEnvio({
  showCreateModal,
  setShowCreateModal,
  cotizacionPrevia,
  handleCreateEnvio,
}) {
  return (
    <Modal
      title="Crear Envío"
      description="Completa los pasos para registrar el envío."
      open={showCreateModal}
      onOpenChange={setShowCreateModal}
      icon={<Package className="h-5 w-5" />}
      titleClassName="text-2xl font-bold"
      descriptionClassName="text-sm text-muted-foreground"
    >
      <FormularioEnvioV2
        cotizacion={cotizacionPrevia}
        onSubmit={handleCreateEnvio}
      />
    </Modal>
  );
}
