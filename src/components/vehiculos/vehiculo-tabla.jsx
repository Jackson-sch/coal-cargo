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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Car,
  User,
  Building2,
  AlertCircle,
  CheckCircle,
  Wrench,
  XCircle,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

const ESTADO_COLORS = {
  DISPONIBLE: "bg-green-100 text-green-800 border-green-200",
  EN_RUTA: "bg-blue-100 text-blue-800 border-blue-200",
  MANTENIMIENTO: "bg-yellow-100 text-yellow-800 border-yellow-200",
  INACTIVO: "bg-gray-100 text-gray-800 border-gray-200",
};

const ESTADO_ICONS = {
  DISPONIBLE: CheckCircle,
  EN_RUTA: Car,
  MANTENIMIENTO: Wrench,
  INACTIVO: XCircle,
};

const ESTADO_LABELS = {
  DISPONIBLE: "Disponible",
  EN_RUTA: "En Ruta",
  MANTENIMIENTO: "Mantenimiento",
  INACTIVO: "Inactivo",
};

const TIPO_VEHICULO_LABELS = {
  CAMION_PEQUENO: "Camión Pequeño",
  CAMION_MEDIANO: "Camión Mediano",
  CAMION_GRANDE: "Camión Grande",
  TRAILER: "Trailer",
  FURGONETA: "Furgoneta",
  MOTOCICLETA: "Motocicleta",
};

export default function VehiculoTabla({
  vehiculos,
  isPending,
  onView,
  onEdit,
  onDelete,
  onUpdateEstado,
}) {
  const { canEdit, canDelete } = usePermissions();

  const getEstadoBadge = (estado) => {
    const Icon = ESTADO_ICONS[estado] || AlertCircle;
    const color = ESTADO_COLORS[estado] || ESTADO_COLORS.INACTIVO;
    const label = ESTADO_LABELS[estado] || estado;

    return (
      <Badge className={`${color} flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const formatearPeso = (peso) => {
    if (!peso) return "N/A";
    return `${new Intl.NumberFormat("es-PE").format(peso)} kg`;
  };

  const formatearVolumen = (volumen) => {
    if (!volumen) return "N/A";
    return `${volumen} m³`;
  };

  if (!vehiculos || vehiculos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No se encontraron vehículos</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-md">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="text-sm text-muted-foreground">
              Cargando vehículos...
            </p>
          </div>
        </div>
      )}

      <div className="rounded-md border" role="region" aria-label="Tabla de vehículos">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead>Capacidades</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Conductor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right no-print">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehiculos.map((vehiculo, index) => (
              <TableRow
                key={vehiculo.id}
                className="animate-in fade-in slide-in-from-bottom-2 hover:bg-muted/50 transition-colors duration-200"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <TableCell>
                  <div className="font-mono font-semibold text-lg">
                    {vehiculo.placa}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">
                      {vehiculo.marca && vehiculo.modelo
                        ? `${vehiculo.marca} ${vehiculo.modelo}`
                        : vehiculo.marca || vehiculo.modelo || "Sin especificar"}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      {vehiculo.año && (
                        <span>Año {vehiculo.año}</span>
                      )}
                      {vehiculo.tipoVehiculo && (
                        <>
                          {vehiculo.año && <span>•</span>}
                          <span>
                            {TIPO_VEHICULO_LABELS[vehiculo.tipoVehiculo] ||
                              vehiculo.tipoVehiculo}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Peso: </span>
                      <span className="font-medium">
                        {formatearPeso(vehiculo.pesoMaximo || vehiculo.capacidad)}
                      </span>
                    </div>
                    {vehiculo.volumenMaximo && (
                      <div>
                        <span className="text-muted-foreground">Volumen: </span>
                        <span className="font-medium">
                          {formatearVolumen(vehiculo.volumenMaximo)}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {vehiculo.sucursal ? (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{vehiculo.sucursal.nombre}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Sin asignar</span>
                  )}
                </TableCell>
                <TableCell>
                  {vehiculo.usuarios ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{vehiculo.usuarios.name}</div>
                        {vehiculo.usuarios.email && (
                          <div className="text-xs text-muted-foreground">
                            {vehiculo.usuarios.email}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Sin asignar</span>
                  )}
                </TableCell>
                <TableCell>{getEstadoBadge(vehiculo.estado)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(vehiculo)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                      )}
                      {onEdit && canEdit("vehiculos", vehiculo) && (
                        <DropdownMenuItem onClick={() => onEdit(vehiculo)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {onUpdateEstado && canEdit("vehiculos", vehiculo) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                          {Object.keys(ESTADO_COLORS).map((estado) => {
                            if (estado === vehiculo.estado) return null;
                            const Icon = ESTADO_ICONS[estado];
                            return (
                              <DropdownMenuItem
                                key={estado}
                                onClick={() => onUpdateEstado(vehiculo.id, estado)}
                              >
                                <Icon className="mr-2 h-4 w-4" />
                                {ESTADO_LABELS[estado]}
                              </DropdownMenuItem>
                            );
                          })}
                        </>
                      )}
                      {onDelete && canDelete("vehiculos") && canEdit("vehiculos", vehiculo) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(vehiculo)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

