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
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  RotateCcw,
} from "lucide-react";

export default function ClienteTabla({
  clientes,
  isPending,
  handleReactivate,
  formatearDireccion,
  getBadgeVariant,
  getEstadoText,
  setSelectedCliente,
  setShowDetailModal,
  setShowEditModal,
  setShowDeleteDialog,
  isDeletedView = false,
}) {
  return (
    <div className="relative">
      {/* Loading overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-md">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="text-sm text-muted-foreground">
              Cargando clientes...
            </p>
          </div>
        </div>
      )}
      <div
        className="rounded-md border"
        role="region"
        aria-label="Tabla de clientes"
        tabIndex={0}
      >
        <Table aria-label="Lista de clientes registrados">
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right no-print">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((cliente, index) => (
              <TableRow
                key={cliente.id}
                className="animate-in fade-in slide-in-from-bottom-2 hover:bg-muted/50 transition-colors duration-200"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium capitalize">
                      {cliente.tipoDocumento === "DNI"
                        ? `${cliente.nombre} ${cliente.apellidos}`
                        : cliente.razonSocial}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {cliente.tipoDocumento === "DNI"
                        ? "PERSONA NATURAL"
                        : "PERSONA JURIDICA"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{cliente.numeroDocumento}</div>
                    <div className="text-sm text-muted-foreground">
                      {cliente.tipoDocumento}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {cliente.email && (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        {cliente.email}
                      </div>
                    )}
                    {cliente.telefono && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {cliente.telefono}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate max-w-[200px]">
                      {formatearDireccion(cliente)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(cliente)}>
                    {getEstadoText(cliente)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right no-print">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCliente(cliente);
                          setShowDetailModal(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCliente(cliente);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {/* Mostrar opciones según el estado del cliente */}
                      {cliente.deletedAt ? (
                        // Cliente eliminado - Opción para restaurar
                        <DropdownMenuItem
                          onClick={() => handleReactivate(cliente)}
                          className="text-green-600"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restaurar
                        </DropdownMenuItem>
                      ) : !cliente.estado ? (
                        // Cliente inactivo - Opción para reactivar
                        <DropdownMenuItem
                          onClick={() => handleReactivate(cliente)}
                          className="text-green-600"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reactivar
                        </DropdownMenuItem>
                      ) : (
                        // Cliente activo - Opción para desactivar (soft delete)
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCliente(cliente);
                            setShowDeleteDialog(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Desactivar
                        </DropdownMenuItem>
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
