"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Calculator,
  CreditCard,
  MapPin,
  User,
  DollarSign,
  FileText,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils/formatters";
import { getEstadoBadge } from "@/lib/utils/estado-badge";


const DetalleEnvio = ({ item }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" />
            Información del Envío
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Guía:</span>
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
              {item.guia || item.id?.slice(0, 8)}
            </code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Estado:</span>
            {getEstadoBadge(item.estado)}
          </div>
          {item.peso && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Peso:</span>
              <span className="text-xs font-medium">{item.peso} kg</span>
            </div>
          )}
          {item.valorDeclarado && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Valor Declarado:
              </span>
              <span className="text-xs font-medium">
                {formatCurrency(item.valorDeclarado)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            Direcciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {item.sucursalOrigen && (
            <div>
              <span className="text-xs font-medium">Origen:</span>
              <p className="text-xs text-muted-foreground mt-1">
                {item.sucursalOrigen.nombre}
                {item.sucursalOrigen.provincia &&
                  ` - ${item.sucursalOrigen.provincia}`}
                {item.sucursalOrigen.direccion && (
                  <span className="block text-xs text-muted-foreground/80 mt-1">
                    {item.sucursalOrigen.direccion}
                  </span>
                )}
              </p>
            </div>
          )}
          {item.sucursalDestino && (
            <div>
              <span className="text-xs font-medium">Destino:</span>
              <p className="text-xs text-muted-foreground mt-1">
                {item.sucursalDestino.nombre}
                {item.sucursalDestino.provincia &&
                  ` - ${item.sucursalDestino.provincia}`}
                {item.sucursalDestino.direccion && (
                  <span className="block text-xs text-muted-foreground/80 mt-1">
                    {item.sucursalDestino.direccion}
                  </span>
                )}
              </p>
            </div>
          )}
          {!item.sucursalOrigen && !item.sucursalDestino && (
            <p className="text-xs text-muted-foreground">
              No hay información de direcciones disponible
            </p>
          )}
        </CardContent>
      </Card>
    </div>

    {item.descripcion && (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Descripción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{item.descripcion}</p>
        </CardContent>
      </Card>
    )}

    {item.total && (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            Información Financiera
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Total:</span>
            <span className="text-sm font-semibold">
              {formatCurrency(item.total)}
            </span>
          </div>
          {item.estadoPago && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Estado de Pago:
              </span>
              <span className="text-xs">{item.estadoPago}</span>
            </div>
          )}
        </CardContent>
      </Card>
    )}

    {(item?.responsableRecojoNombre ||
      item?.responsableRecojoNumeroDocumento ||
      item?.responsableRecojoEmpresa ||
      item?.responsableRecojoTelefono ||
      item?.responsableRecojoEmail ||
      item?.responsableRecojoDireccion) && (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-purple-500" />
            Responsable de Recojo
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {item?.responsableRecojoNombre && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Nombre:</span>
              <span className="text-xs">
                {[
                  item?.responsableRecojoNombre,
                  item?.responsableRecojoApellidos,
                ]
                  .filter(Boolean)
                  .join(" ") || "No especificado"}
              </span>
            </div>
          )}
          {item?.responsableRecojoNumeroDocumento && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Documento:</span>
              <span className="text-xs">
                {(item?.responsableRecojoTipoDocumento || "") +
                  (item?.responsableRecojoNumeroDocumento
                    ? ` ${item.responsableRecojoNumeroDocumento}`
                    : "")}
              </span>
            </div>
          )}
          {item?.responsableRecojoTelefono && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Teléfono:</span>
              <span className="text-xs">{item?.responsableRecojoTelefono}</span>
            </div>
          )}
          {item?.responsableRecojoEmail && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Email:</span>
              <span className="text-xs">{item?.responsableRecojoEmail}</span>
            </div>
          )}
          {item?.responsableRecojoEmpresa && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Empresa:</span>
              <span className="text-xs">{item?.responsableRecojoEmpresa}</span>
            </div>
          )}
          {item?.responsableRecojoCargo && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Cargo:</span>
              <span className="text-xs">{item?.responsableRecojoCargo}</span>
            </div>
          )}
          {item?.responsableRecojoDireccion && (
            <div className="md:col-span-2">
              <span className="text-xs font-medium">Dirección:</span>
              <p className="text-xs text-muted-foreground mt-1">
                {item?.responsableRecojoDireccion}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )}
  </div>
);

const DetalleCotizacion = ({ item }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calculator className="h-4 w-4 text-green-500" />
            Información de la Cotización
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">ID:</span>
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
              {item.id?.slice(0, 8)}
            </code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Estado:</span>
            {getEstadoBadge(item.estado)}
          </div>
          {item.fechaVencimiento && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Válida hasta:
              </span>
              <span className="text-xs">
                {formatDate(item.fechaVencimiento)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {(item.ciudadOrigen || item.ciudadDestino) && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" />
              Ruta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {item.ciudadOrigen && (
              <div>
                <span className="text-xs font-medium">Origen:</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.ciudadOrigen}
                </p>
              </div>
            )}
            {item.ciudadDestino && (
              <div>
                <span className="text-xs font-medium">Destino:</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.ciudadDestino}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>

    {item.contenido && (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Contenido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{item.contenido}</p>
        </CardContent>
      </Card>
    )}

    {item.precioFinal && (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            Precio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Precio Final:</span>
            <span className="text-sm font-semibold">
              {formatCurrency(item.precioFinal)}
            </span>
          </div>
          {item.pesoEstimado && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Peso Estimado:
              </span>
              <span className="text-xs">{item.pesoEstimado} kg</span>
            </div>
          )}
        </CardContent>
      </Card>
    )}
  </div>
);

const DetallePago = ({ item }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-purple-500" />
            Información del Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">ID:</span>
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
              {item.id?.slice(0, 8)}
            </code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Estado:</span>
            {getEstadoBadge(item.estado)}
          </div>
          {item.metodoPago && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Método:</span>
              <span className="text-xs">{item.metodoPago}</span>
            </div>
          )}
          {item.referencia && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Referencia:</span>
              <span className="text-xs">{item.referencia}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {(item.total || item.fechaPago) && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Monto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {item.total && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total:</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(item.total)}
                </span>
              </div>
            )}
            {item.fechaPago && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Fecha de Pago:
                </span>
                <span className="text-xs">{formatDate(item.fechaPago)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>

    {item.descripcion && (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Descripción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{item.descripcion}</p>
        </CardContent>
      </Card>
    )}
  </div>
);

export default function HistorialDetalleContent({ item }) {
  if (!item) return null;

  const renderContent = () => {
    switch (item.tipo) {
      case "envio":
        return <DetalleEnvio item={item} />;
      case "cotizacion":
        return <DetalleCotizacion item={item} />;
      case "pago":
        return <DetallePago item={item} />;
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Tipo de registro no reconocido
          </div>
        );
    }
  };

  return <div>{renderContent()}</div>;
}
