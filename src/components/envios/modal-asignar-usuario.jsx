import Modal from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserRound, Loader2 } from "lucide-react";

export default function ModalAsignarUsuario({
  open,
  onOpenChange,
  envio,
  usuarios,
  usuarioAsignado,
  setUsuarioAsignado,
  handleAssignUser,
  saving,
  setShowAssignModal,
}) {
  return (
    <Modal
      title="Asignar Usuario"
      description={`Asigna un usuario al envío guía #${
        envio?.numeroGuia || envio?.guia || ""
      }`}
      open={open}
      onOpenChange={onOpenChange}
      icon={<UserRound className="h-5 w-5" />}
      size="sm"
    >
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="usuarioAsignado">Usuario/Conductor *</Label>
            <Select value={usuarioAsignado} onValueChange={setUsuarioAsignado}>
              <SelectTrigger className="w-full sm:w-60">
                <SelectValue placeholder="Seleccionar usuario" />
              </SelectTrigger>
              <SelectContent>
                {usuarios
                  .filter((usuario) => usuario.role === "CONDUCTOR")
                  .map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      <p className="capitalize">{usuario.name}</p>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {usuario.role}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowAssignModal(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssignUser}
            disabled={saving || !usuarioAsignado}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Asignando...
              </>
            ) : (
              "Asignar Envío"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
