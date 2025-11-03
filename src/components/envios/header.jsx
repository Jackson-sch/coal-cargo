import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeaderEnvios({
    setShowCreateModal
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Envíos</h1>
        <p className="text-muted-foreground">
          Administra todos los envíos y su seguimiento
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Envío
        </Button>
      </div>
    </div>
  );
}
