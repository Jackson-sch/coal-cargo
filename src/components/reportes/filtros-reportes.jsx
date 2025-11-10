import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ESTADOS_ENVIO_VALIDOS } from "@/lib/constants/estados";
import { estadosEnvioObject } from "@/lib/constants/estados";

export default function FiltrosReportes({
  searchQuery,
  handleSearch,
  estado,
  handleEstado,
  fechaFiltro,
  handleFechaFiltro,
  formatEstadoLabel,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
        <CardDescription>Busca y filtra para generar reportes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por número de guía..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => {
                  // Prevenir Enter de hacer submit si está dentro de un form
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                className="pl-8"
              />
            </div>
          </div>
          <div className="w-full sm:w-60">
            <Select value={estado} onValueChange={handleEstado}>
              <SelectTrigger className="w-full sm:w-60">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {ESTADOS_ENVIO_VALIDOS.map((estadoKey) => {
                  const estado = estadosEnvioObject[estadoKey];
                  return estado ? (
                    <SelectItem key={estadoKey} value={estadoKey}>
                      {formatEstadoLabel ? formatEstadoLabel(estadoKey) : estado.label}
                    </SelectItem>
                  ) : null;
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Select value={fechaFiltro} onValueChange={handleFechaFiltro}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="semana">Última semana</SelectItem>
                <SelectItem value="mes">Último mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
