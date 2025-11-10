import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export default function ClientesFiltros({
  searchQuery,
  setSearchQuery,
  tipoDocumentoFilter,
  setTipoDocumentoFilter,
  estadoFilter,
  setEstadoFilter,
}) {
  return (
    <Card className="no-print">
      <CardHeader className="-mb-4">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nombre, documento, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo Documento</label>
            <Select
              value={tipoDocumentoFilter}
              onValueChange={(value) => setTipoDocumentoFilter(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="DNI">DNI</SelectItem>
                <SelectItem value="RUC">RUC</SelectItem>
                <SelectItem value="CARNET_EXTRANJERIA">
                  Carnet de Extranjería
                </SelectItem>
                <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <Select
              value={estadoFilter}
              onValueChange={(value) => setEstadoFilter(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Solo activos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE_ONLY">Solo activos</SelectItem>
                <SelectItem value="ALL">Todos (activos e inactivos)</SelectItem>
                <SelectItem value="false">Solo inactivos</SelectItem>
                <SelectItem value="deleted">Solo eliminados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
