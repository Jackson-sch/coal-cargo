import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

export default function BuscadorSeguimiento({
  guia,
  setGuia,
  buscarEnvio,
  limpiarBusqueda,
  loading,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" /> Buscar Envío
        </CardTitle>
        <CardDescription>
          Ingresa el número de guía para rastrear tu envío
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="guia">Número de Guía</Label>
            <Input
              id="guia"
              placeholder="Ej: CG2025000001"
              value={guia}
              onChange={(e) => setGuia(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === "Enter" && buscarEnvio()}
              className="mt-1"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={buscarEnvio} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Buscar
            </Button>
            <Button variant="outline" onClick={limpiarBusqueda}>
              Limpiar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
