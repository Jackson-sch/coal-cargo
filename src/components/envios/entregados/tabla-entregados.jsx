import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Copy,
  Check,
  Eye,
  Edit,
  User,
  MapPin,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";
import Paginator from "@/components/ui/paginator";
import { formatDate, formatTime } from "@/lib/utils/formatters";

export default function TablaEntregados({
  envios,
  loading,
  searchQuery,
  setSelectedEnvio,
  setShowDetailModal,
  setShowStatusModal,
  setNuevoEstado,
  copiedGuia,
  setUsuarioAsignado,
  setShowAssignModal,
  totalPages,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  copiarNumeroGuia,
}) {
  // Calcular tiempo de entrega
  const calcularTiempoEntrega = (fechaRegistro, fechaEntrega) => {
    if (!fechaEntrega) return "N/A";

    const registro = new Date(fechaRegistro);
    const entrega = new Date(fechaEntrega);
    const diferencia = entrega - registro;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor(
      (diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (dias > 0) {
      return `${dias}d ${horas}h`;
    }
    return `${horas}h`;
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Envíos Entregados ({envios.length})</CardTitle>
        <CardDescription>
          Lista de todos los envíos entregados exitosamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : envios.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
              No hay envíos entregados
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery
                ? "No se encontraron envíos con ese criterio"
                : "Aún no se han entregado envíos"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guía</TableHead>
                  <TableHead>Sucursal Origen</TableHead>
                  <TableHead>Remitente / Destinatario</TableHead>
                  <TableHead>Origen → Destino</TableHead>
                  <TableHead>Fecha Entrega</TableHead>
                  <TableHead>Tiempo Entrega</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {envios.map((envio) => (
                  <TableRow key={envio.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
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
                        <div className="font-medium text-sm capitalize">
                          {envio?.cliente?.tipoDocumento === "RUC"
                            ? envio?.cliente?.razonSocial ||
                              envio?.remitenteNombre ||
                              "No especificado"
                            : envio?.remitenteNombre || "No especificado"}
                        </div>
                        {envio?.cliente?.tipoDocumento &&
                          (envio?.cliente?.numeroDocumento ||
                            envio?.cliente?.ruc) && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>
                                {envio.cliente.tipoDocumento}:
                                {envio.cliente.tipoDocumento === "RUC"
                                  ? envio.cliente.ruc ||
                                    envio.cliente.numeroDocumento
                                  : envio.cliente.numeroDocumento}
                              </span>
                            </div>
                          )}
                        <div className="text-xs text-muted-foreground">
                          Destinatario:
                        </div>
                        <div className="font-medium text-sm capitalize">
                          {envio.destinatarioNombre || "No especificado"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {envio.sucursalOrigen?.nombre}
                        </div>
                        <div className="text-muted-foreground">↓</div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {envio.sucursalDestino?.nombre}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <div>
                          {envio.fechaEntrega
                            ? formatDate(new Date(envio.fechaEntrega))
                            : "No especificada"}
                          {envio.fechaEntrega && (
                            <div className="text-xs text-muted-foreground">
                              {formatTime(new Date(envio.fechaEntrega))}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {calcularTiempoEntrega(
                          envio.fechaRegistro,
                          envio.fechaEntrega
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        S/ {envio.total?.toFixed(2)}
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
            total={envios.length}
            entityLabel="envíos"
          />
        </div>
      </CardContent>
    </Card>
  );
}
