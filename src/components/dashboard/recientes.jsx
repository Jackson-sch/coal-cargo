import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";

export default function Recientes({ recientes }) {
  return (
    <Card className="overflow-y-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" /> Envíos Recientes
        </CardTitle>
        <CardDescription>Últimos 10 envíos registrados</CardDescription>
      </CardHeader>
      <CardContent>
        {recientes.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No hay envíos recientes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="text-left text-muted-foreground">
                  <TableHead># Guía</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="py-2 pr-0 text-right">Total</TableHead>
                  <TableHead className="py-2 pl-2">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recientes.map((e) => (
                  <TableRow key={e.id} className="border-t">
                    <TableCell className="py-2 pr-2 font-medium">
                      {e.numeroGuia || e.id}
                    </TableCell>
                    <TableCell className="capitalize whitespace-nowrap">
                      {e.cliente}
                    </TableCell>
                    <TableCell>{e.origen}</TableCell>
                    <TableCell>{e.destino}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {String(e.estado).replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 pr-0 text-right">
                      {formatCurrency(e.total || 0)}
                    </TableCell>
                    <TableCell className="py-2 pl-2 whitespace-nowrap">
                      {formatDate(e.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
