import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Clock, 
  CreditCard, 
  Eye, 
  Loader2, 
  Mail, 
  Printer,
  MoreVertical,
  Download,
  Copy,
  CheckCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatSoles } from "@/lib/utils/formatters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

export default function PagosTabla({
  pagosFiltrados,
  estadosPago,
  metodosPago,
  imprimirVoucherPago,
  verDetalle,
  imprimiendoId,
  reenviarEmailPago,
}) {
  const [ordenamiento, setOrdenamiento] = useState({ campo: null, direccion: 'asc' });
  const [copiandoId, setCopiandoId] = useState(null);

  // Función para ordenar
  const manejarOrdenamiento = (campo) => {
    setOrdenamiento(prev => ({
      campo,
      direccion: prev.campo === campo && prev.direccion === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Aplicar ordenamiento a los pagos
  const pagosOrdenados = useMemo(() => {
    if (!ordenamiento.campo) return pagosFiltrados;

    return [...pagosFiltrados].sort((a, b) => {
      let valorA, valorB;

      switch (ordenamiento.campo) {
        case 'fecha':
          valorA = new Date(a.fecha).getTime();
          valorB = new Date(b.fecha).getTime();
          break;
        case 'cliente':
          valorA = a.cliente.toLowerCase();
          valorB = b.cliente.toLowerCase();
          break;
        case 'monto':
          valorA = parseFloat(a.monto);
          valorB = parseFloat(b.monto);
          break;
        default:
          return 0;
      }

      if (ordenamiento.direccion === 'asc') {
        return valorA > valorB ? 1 : valorA < valorB ? -1 : 0;
      } else {
        return valorA < valorB ? 1 : valorA > valorB ? -1 : 0;
      }
    });
  }, [pagosFiltrados, ordenamiento]);

  // Función para copiar guía
  const copiarGuia = async (guia, id) => {
    try {
      await navigator.clipboard.writeText(guia);
      setCopiandoId(id);
      toast.success("Guía copiada al portapapeles");
      setTimeout(() => setCopiandoId(null), 2000);
    } catch (error) {
      toast.error("Error al copiar");
    }
  };

  // Función para descargar voucher
  const descargarVoucher = (pago) => {
    // Implementar lógica de descarga
    toast.info("Descargando voucher...");
  };

  // Renderizar icono de ordenamiento
  const IconoOrdenamiento = ({ campo }) => {
    if (ordenamiento.campo !== campo) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground" />;
    }
    return ordenamiento.direccion === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-transparent"
                onClick={() => manejarOrdenamiento('fecha')}
              >
                Fecha
                <IconoOrdenamiento campo="fecha" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-transparent"
                onClick={() => manejarOrdenamiento('cliente')}
              >
                Cliente
                <IconoOrdenamiento campo="cliente" />
              </Button>
            </TableHead>
            <TableHead>Envío</TableHead>
            <TableHead>Método</TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-transparent"
                onClick={() => manejarOrdenamiento('monto')}
              >
                Monto
                <IconoOrdenamiento campo="monto" />
              </Button>
            </TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagosOrdenados.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <div className="flex flex-col items-center justify-center">
                  <CreditCard className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay pagos registrados</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    No se encontraron pagos que coincidan con los filtros aplicados.
                    Intenta ajustar los criterios de búsqueda.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            pagosOrdenados.map((pago) => {
              const estadoConfig = estadosPago.find(
                (e) => e.value === pago.estado
              );
              const IconoEstado = estadoConfig?.icon || Clock;

              return (
                <TableRow 
                  key={pago.id} 
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{formatDate(pago.fecha)}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(pago.fecha).toLocaleTimeString('es-PE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{pago.cliente}</span>
                      {pago.documentoCliente && (
                        <span className="text-xs text-muted-foreground">
                          {pago.documentoCliente}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {pago.envio}
                      </code>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copiarGuia(pago.envio, pago.id)}
                            >
                              {copiandoId === pago.id ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copiar guía</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {metodosPago.find((m) => m.value === pago.metodo)?.label ||
                        pago.metodo}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-base">
                        {formatSoles(pago.monto)}
                      </span>
                      {pago.referencia && (
                        <span className="text-xs text-muted-foreground">
                          Ref: {pago.referencia}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      className={`${estadoConfig?.color} flex items-center gap-1 w-fit`}
                    >
                      <IconoEstado className="h-3 w-3" />
                      {estadoConfig?.label || pago.estado}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => verDetalle(pago.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver detalle</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            onClick={() => imprimirVoucherPago(pago)}
                            disabled={imprimiendoId === pago.id}
                          >
                            {imprimiendoId === pago.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Printer className="h-4 w-4 mr-2" />
                            )}
                            Imprimir voucher
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            onClick={() => descargarVoucher(pago)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar PDF
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            onClick={() => reenviarEmailPago(pago.id)}
                            disabled={imprimiendoId === pago.id}
                          >
                            {imprimiendoId === pago.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4 mr-2" />
                            )}
                            Reenviar email
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            onClick={() => copiarGuia(pago.envio, pago.id)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar N° de guía
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}