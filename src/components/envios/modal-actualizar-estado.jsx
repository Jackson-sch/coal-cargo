import { Edit } from "lucide-react";
import Modal from "../ui/modal";
import { Label } from "../ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { FileUpload } from "../ui/file-upload";

export default function ModalActualizarEstado({
  open,
  onOpenChange,
  envio,
  estadosEnvio,
  setShowStatusModal,
  handleUpdateStatus,
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
}) {
  return (
    <Modal
      title="Actualizar Estado del Envío"
      description={`Actualiza el estado del envío guia #${
        envio?.numeroGuia || envio?.guia || ""
      }`}
      open={open}
      onOpenChange={onOpenChange}
      icon={<Edit className="h-5 w-5" />}
      size="sm"
    >
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nuevoEstado">Nuevo Estado *</Label>
            <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                {estadosEnvio.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    <div className="flex items-center gap-2">
                      <estado.icon className="h-4 w-4" /> {estado.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcionEvento">Descripción</Label>
            <Textarea
              id="descripcionEvento"
              placeholder="Descripción del evento (opcional)"
              value={descripcionEvento}
              onChange={(e) => setDescripcionEvento(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ubicacionEvento">Ubicación</Label>
            <Input
              id="ubicacionEvento"
              placeholder="Ubicación actual (opcional)"
              value={ubicacionEvento}
              onChange={(e) => setUbicacionEvento(e.target.value)}
            />
          </div>
          <FileUpload
            currentFile={fotoUrl}
            onFileChange={setFotoUrl}
            label="Foto del evento"
            tipo="foto"
          />
          <FileUpload
            currentFile={firmaUrl}
            onFileChange={setFirmaUrl}
            label="Firma de entrega"
            tipo="firma"
          />
        </div>
        <div className="flex justify-end item-center gap-2">
          <Button variant="outline" onClick={() => setShowStatusModal(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpdateStatus}
            disabled={saving || !nuevoEstado}
          >
            {saving ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Edit className="mr-1 h-4 w-4" /> Actualizar Estado
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
