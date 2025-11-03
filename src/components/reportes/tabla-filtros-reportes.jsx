import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, MapPin } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatSoles } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import Paginator from "@/components/ui/paginator";

export default function TablaFiltrosReportes({
  loading,
  envios,
  total,
  totalPages,
  currentPage,
  setCurrentPage,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados ({total})</CardTitle>
        <CardDescription>Lista según filtros aplicados</CardDescription>
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
              No hay resultados
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajusta los filtros para encontrar datos
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guía</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Remitente / Destinatario</TableHead>
                  <TableHead>Origen → Destino</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {envios.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.guia}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{e.estado}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Remitente
                        </div>
                        <div className="font-medium text-sm capitalize">
                          {e.remitenteNombre || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Destinatario
                        </div>
                        <div className="font-medium text-sm capitalize">
                          {e.destinatarioNombre || "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {e.sucursalOrigen?.nombre}
                        </div>
                        <div className="text-muted-foreground">↓</div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {e.sucursalDestino?.nombre}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {e.fechaRegistro
                        ? format(
                            new Date(e.fechaRegistro),
                            "dd/MM/yyyy HH:mm",
                            { locale: es }
                          )
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {e.fechaEntrega
                        ? format(new Date(e.fechaEntrega), "dd/MM/yyyy HH:mm", {
                            locale: es,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatSoles(e.total || 0)}
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
            total={total}
            entityLabel="resultados"
          />
        </div>
      </CardContent>
    </Card>
  );
}
