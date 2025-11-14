"use client";

import { ArrowUpDown, Copy, Eye, Mail, MoreVertical, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatSoles } from "@/lib/utils/formatters";
import { toast } from "sonner";

export const pagosColumns = (actions) => [
  {
    accessorKey: "fecha",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Fecha
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const fecha = row.getValue("fecha");
      return (
        <div className="flex flex-col">
          <span className="font-medium">{formatDate(fecha)}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(fecha).toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "cliente",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Cliente
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue("cliente")}</span>
          {row.original.documentoCliente && (
            <span className="text-xs text-muted-foreground">
              {row.original.documentoCliente}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "envio",
    header: "Envío",
    cell: ({ row }) => {
      const guia = row.getValue("envio");
      return (
        <div className="flex items-center gap-2">
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
            {guia}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={async () => {
              await navigator.clipboard.writeText(guia);
              toast.success("Guía copiada");
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: "metodo",
    header: "Método",
    cell: ({ row }) => {
      const metodos = {
        EFECTIVO: "Efectivo",
        TARJETA_CREDITO: "T. Crédito",
        YAPE: "Yape",
        PLIN: "Plin",
      };
      return (
        <Badge variant="outline" className="text-xs">
          {metodos[row.getValue("metodo")] || row.getValue("metodo")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "monto",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Monto
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="flex flex-col items-end">
          <span className="font-semibold">{formatSoles(row.getValue("monto"))}</span>
          {row.original.referencia && (
            <span className="text-xs text-muted-foreground">
              Ref: {row.original.referencia}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      return (
        <Badge variant="outline" >
          {row.getValue("estado")}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const pago = row.original;

      return (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => actions.verDetalle(pago.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => actions.imprimir(pago)}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir voucher
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.reenviarEmail(pago.id)}>
                <Mail className="h-4 w-4 mr-2" />
                Reenviar email
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];