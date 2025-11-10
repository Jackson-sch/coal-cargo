import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Package,
  MapPin,
  Clock,
  Check,
  Copy,
  Eye,
  Edit,
  User,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Paginator from "@/components/ui/paginator";

export default function TablaEnviosTransito({
  loading,
  envios,
  totalEnvios,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setSelectedEnvio,
  setShowDetailModal,
  setShowStatusModal,
  setShowAssignModal,
  setNuevoEstado,
  copiedGuia,
  getEstadoBadge,
  setUsuarioAsignado,
  copiarNumeroGuia,
  totalPages,
}) {
  const calcularTiempoTransito = (fechaRegistro) => {
    if (!fechaRegistro) return "N/A";
    const fecha = new Date(fechaRegistro);
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    return dias > 0 ? `${dias} días` : "Menos de 1 día";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Envíos en Tránsito ({totalEnvios})</CardTitle>
        <CardDescription>
          Lista de todos los envíos que están en proceso de entrega
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : envios.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
              No hay envíos en tránsito
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery
                ? "No se encontraron envíos con ese criterio"
                : "Todos los envíos han sido entregados"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guía</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Sucursal Origen</TableHead>
                  <TableHead>Remitente / Destinatario</TableHead>
                  <TableHead>Origen → Destino</TableHead>
                  <TableHead>Tiempo en Tránsito</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {envios.map((envio) => (
                  <TableRow key={envio.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{envio.guia}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-gray-100"
                                onClick={() => copiarNumeroGuia(envio.guia)}
                              >
                                {copiedGuia === envio.guia ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3 text-gray-500" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copiar número de guía al portapapeles</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell>{getEstadoBadge(envio.estado)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {envio.sucursal_origen?.nombre || "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {envio.sucursal_origen?.provincia || ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Remitente:
                        </div>
                        <div className="font-medium text-sm">
                          {envio.remitenteNombre || "No especificado"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Destinatario:
                        </div>
                        <div className="font-medium text-sm">
                          {envio.destinatarioNombre || "No especificado"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {envio.sucursal_origen?.nombre || "N/A"}
                        </div>
                        <div className="text-muted-foreground">↓</div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {envio.sucursal_destino?.nombre || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {calcularTiempoTransito(
                          envio.fechaRegistro || envio.createdAt
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        S/ {envio.total?.toFixed(2) || "0.00"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEnvio(envio);
                            setShowDetailModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEnvio(envio);
                            setNuevoEstado(envio.estado);
                            setShowStatusModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {(envio.estado === "REGISTRADO" ||
                          envio.estado === "EN_BODEGA") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEnvio(envio);
                              setUsuarioAsignado(envio.asignadoA || "");
                              setShowAssignModal(true);
                            }}
                          >
                            <User className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {/* Paginación */}
        <div className="py-4">
          <Paginator
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            limit={itemsPerPage}
            total={totalEnvios}
            entityLabel="envíos"
          />
        </div>
      </CardContent>
    </Card>
  );
}
