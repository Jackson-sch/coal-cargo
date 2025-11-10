import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { formatSoles } from "@/lib/utils/formatters";
import { formatDate } from "@/lib/utils/formatters";
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
  Phone,
  Mail,
  Building2,
  ArrowRight,
  Weight,
  FileText,
} from "lucide-react";
import Paginator from "@/components/ui/paginator";

export default function TablaEnvios({
  loading,
  envios,
  pagination,
  filtros,
  setFiltros,
  setSelectedEnvio,
  setShowDetailModal,
  setShowStatusModal,
  setShowAssignModal,
  setNuevoEstado,
  copiedGuia,
  getEstadoBadge,
  setUsuarioAsignado,
  copiarNumeroGuia,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" /> Lista de Envíos
          {pagination && (
            <span className="text-sm font-normal text-muted-foreground">
              ({pagination.total} envíos)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando envíos...</span>
          </div>
        ) : envios.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay envíos
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron envíos con los filtros aplicados.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guía</TableHead>
                    <TableHead>Remitente</TableHead>
                    <TableHead>Destinatario</TableHead>
                    <TableHead>Ruta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {envios.map((envio) => (
                    <TableRow key={envio.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{envio.numeroGuia}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-gray-100"
                                  onClick={() =>
                                    copiarNumeroGuia(envio.numeroGuia)
                                  }
                                >
                                  {copiedGuia === envio.numeroGuia ? (
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
                      {/* ✅ Columna del Remitente */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {envio?.cliente?.tipoDocumento === "RUC"
                              ? envio?.cliente?.razonSocial ||
                                envio.remitenteNombre ||
                                "No especificado"
                              : envio.remitenteNombre ||
                                envio?.cliente?.nombre ||
                                "No especificado"}
                          </div>
                          {/* Mostrar documento del remitente directo o del cliente */}
                          {envio.remitenteTipoDocumento &&
                          envio.remitenteNumeroDocumento ? (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {envio.remitenteTipoDocumento === "RUC"
                                ? `RUC: ${envio.remitenteNumeroDocumento}`
                                : `${envio.remitenteTipoDocumento}: ${envio.remitenteNumeroDocumento}`}
                            </div>
                          ) : (
                            envio?.cliente?.tipoDocumento &&
                            (envio?.cliente?.numeroDocumento ||
                              envio?.cliente?.ruc) && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {envio?.cliente?.tipoDocumento === "RUC"
                                  ? `RUC: ${
                                      envio?.cliente?.ruc ||
                                      envio?.cliente?.numeroDocumento
                                    }`
                                  : `${envio?.cliente?.tipoDocumento}: ${envio?.cliente?.numeroDocumento}`}
                              </div>
                            )
                          )}
                          {(envio.remitenteTelefono ||
                            envio?.cliente?.telefono) && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {envio.remitenteTelefono ||
                                envio?.cliente?.telefono}
                            </div>
                          )}
                          {(envio.remitenteEmail || envio?.cliente?.email) && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {envio.remitenteEmail || envio?.cliente?.email}
                            </div>
                          )}
                          {(envio.modalidad === "DOMICILIO_SUCURSAL" ||
                            envio.modalidad === "DOMICILIO_DOMICILIO") &&
                            (envio.remitenteDireccion ||
                              envio?.cliente?.direccion) && (
                              <div className="text-xs text-muted-foreground">
                                {envio.remitenteDireccion ||
                                  envio?.cliente?.direccion}
                              </div>
                            )}
                        </div>
                      </TableCell>
                      {/* ✅ Columna del Destinatario */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {envio.destinatarioNombre || "No especificado"}
                          </div>
                          {envio?.destinatarioTipoDocumento &&
                            envio?.destinatarioNumeroDocumento && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {envio?.destinatarioTipoDocumento === "RUC"
                                  ? `RUC: ${envio?.destinatarioNumeroDocumento}`
                                  : `${envio?.destinatarioTipoDocumento}: ${envio?.destinatarioNumeroDocumento}`}
                              </div>
                            )}
                          {envio.destinatarioTelefono && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {envio.destinatarioTelefono}
                            </div>
                          )}
                          {envio.destinatarioEmail && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {envio.destinatarioEmail}
                            </div>
                          )}
                          {(envio.modalidad === "SUCURSAL_DOMICILIO" ||
                            envio.modalidad === "DOMICILIO_DOMICILIO") &&
                            envio.destinatarioDireccion && (
                              <div className="text-xs text-muted-foreground">
                                {envio.destinatarioDireccion}
                              </div>
                            )}
                        </div>
                      </TableCell>
                      {/* Ruta */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <div className="text-center">
                            <Building2 className="h-3 w-3 mx-auto mb-1" />
                            <div className="truncate max-w-20">
                              {envio.sucursal_origen?.nombre || "N/A"}
                            </div>
                          </div>
                          <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />
                          <div className="text-center">
                            <Building2 className="h-3 w-3 mx-auto mb-1" />
                            <div className="truncate max-w-20">
                              {envio.sucursal_destino?.nombre || "N/A"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getEstadoBadge(envio.estado)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Weight className="h-4 w-4 text-muted-foreground" />
                          {envio.peso} kg
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatSoles(envio.precio)}
                      </TableCell>
                      <TableCell>
                        {envio.fechaRegistro 
                          ? formatDate(envio.fechaRegistro) 
                          : envio.createdAt 
                            ? formatDate(envio.createdAt) 
                            : "N/A"}
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
                                setUsuarioAsignado(envio.usuarioId || "");
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
            {/* Paginación */}
            {pagination && (
              <div className="mt-4">
                <Paginator
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(p) => setFiltros({ ...filtros, page: p })}
                  limit={pagination.limit}
                  total={pagination.total}
                  entityLabel="envíos"
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
