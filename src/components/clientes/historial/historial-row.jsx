"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Calculator, CreditCard, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function HistorialRow({ item, onView }) {
  const formatearFecha = (fecha) => {
    return format(new Date(fecha), "dd/MM/yyyy HH:mm", { locale: es });
  };

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(precio);
  };

  const getEstadoBadge = (tipo, estado) => {
    const variants = {
      REGISTRADO: "default",
      EN_BODEGA: "secondary",
      EN_TRANSITO: "default",
      EN_REPARTO: "default",
      ENTREGADO: "success",
      DEVUELTO: "destructive",
      ANULADO: "destructive",
      PENDIENTE: "secondary",
      APROBADA: "success",
      RECHAZADA: "destructive",
      CONVERTIDA_ENVIO: "success",
      EXPIRADA: "destructive",
    };

    return (
      <Badge variant={variants[estado] || "default"} className="text-xs">
        {estado}
      </Badge>
    );
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case "envio":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "cotizacion":
        return <Calculator className="h-4 w-4 text-green-500" />;
      case "pago":
        return <CreditCard className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell>
        <div className="flex items-center gap-2">
          {getTipoIcon(item.tipo)}
          <span className="capitalize font-medium text-sm">{item.tipo}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatearFecha(item.fechaRegistro || item.fechaPrincipal || item.createdAt)}
      </TableCell>
      <TableCell>
        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
          {item.guia || item.id?.slice(0, 8) || "N/A"}
        </code>
      </TableCell>
      <TableCell className="max-w-xs">
        <p className="text-sm truncate" title={item.descripcion || item.contenido || "Sin descripción"}>
          {item.descripcion || item.contenido || "Sin descripción"}
        </p>
      </TableCell>
      <TableCell>{getEstadoBadge(item.tipo, item.estado)}</TableCell>
      <TableCell className="font-medium">
        {item.total || item.precioFinal
          ? formatearPrecio(item.total || item.precioFinal)
          : "-"}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(item)}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

