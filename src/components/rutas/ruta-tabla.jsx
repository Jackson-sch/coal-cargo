"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Route,
  MapPin,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

const TIPOS_RUTA = [
  { value: "URBANA", label: "Urbana" },
  { value: "INTERURBANA", label: "Interurbana" },
  { value: "INTERPROVINCIAL", label: "Interprovincial" },
  { value: "INTERDEPARTAMENTAL", label: "Interdepartamental" },
];

const TIPO_COLORS = {
  URBANA: "bg-blue-100 text-blue-800 border-blue-200",
  INTERURBANA: "bg-green-100 text-green-800 border-green-200",
  INTERPROVINCIAL: "bg-purple-100 text-purple-800 border-purple-200",
  INTERDEPARTAMENTAL: "bg-orange-100 text-orange-800 border-orange-200",
};

export default function RutaTabla({
  rutas,
  isPending,
  onEdit,
  onDelete,
}) {
  const { canEdit, canDelete } = usePermissions();

  const getTipoLabel = (tipo) => {
    const tipoObj = TIPOS_RUTA.find((t) => t.value === tipo);
    return tipoObj ? tipoObj.label : tipo;
  };

  const getTipoColor = (tipo) => {
    return TIPO_COLORS[tipo?.toUpperCase()] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Cargando rutas...</span>
      </div>
    );
  }

  if (!rutas || rutas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No se encontraron rutas</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Origen → Destino</TableHead>
            <TableHead>Distancia</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rutas.map((ruta) => (
            <TableRow key={ruta.id}>
              <TableCell className="font-medium">
                {ruta.codigo}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-muted-foreground" />
                  {ruta.nombre}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getTipoColor(ruta.tipo)}>
                  {getTipoLabel(ruta.tipo)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3 text-green-600" />
                    {ruta.sucursalOrigen?.nombre || "N/A"}
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3 text-red-600" />
                    {ruta.sucursalDestino?.nombre || "N/A"}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {ruta.distancia ? `${ruta.distancia} km` : "N/A"}
              </TableCell>
              <TableCell>
                <Badge variant={ruta.activo ? "default" : "secondary"}>
                  {ruta.activo ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {onEdit && canEdit("rutas", ruta) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(ruta)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && canDelete("rutas") && canEdit("rutas", ruta) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(ruta)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

