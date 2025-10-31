"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Calculator,
  CreditCard,
  MapPin,
  User,
  Calendar,
  DollarSign,
  FileText,
  Truck,
  Clock,
} from "lucide-react";

const formatearFecha = (fecha) => {
  if (!fecha) return "N/A";
  return new Date(fecha).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatearPrecio = (precio) => {
  if (!precio) return "N/A";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "COP",
  }).format(precio);
};

const getEstadoBadge = (tipo, estado) => {
  const colores = {
    envio: {
      pendiente: "bg-yellow-100 text-yellow-800",
      en_transito: "bg-blue-100 text-blue-800",
      entregado: "bg-green-100 text-green-800",
      cancelado: "bg-red-100 text-red-800",
    },
    cotizacion: {
      pendiente: "bg-yellow-100 text-yellow-800",
      aprobada: "bg-green-100 text-green-800",
      rechazada: "bg-red-100 text-red-800",
      vencida: "bg-gray-100 text-gray-800",
    },
    pago: {
      pendiente: "bg-yellow-100 text-yellow-800",
      completado: "bg-green-100 text-green-800",
      fallido: "bg-red-100 text-red-800",
      reembolsado: "bg-purple-100 text-purple-800",
    },
  };

  const color = colores[tipo]?.[estado] || "bg-gray-100 text-gray-800";
  return (
    <Badge className={`${color} border-0`}>
      {estado?.replace("_", " ").toUpperCase()}
    </Badge>
  );
};

const DetalleEnvio = ({ item }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Información del Envío
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Guía:</span>
            <code className="text-sm bg-muted px-2 py-1 rounded">
              {item.guia}
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Estado:</span>
            {getEstadoBadge("envio", item.estado)}
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Peso:</span>
            <span className="text-sm">{item.peso || "N/A"} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              Valor Declarado:
            </span>
            <span className="text-sm">
              {formatearPrecio(item.valorDeclarado)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Direcciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm font-medium">Origen:</span>
            <p className="text-sm text-muted-foreground">
              {item.direccionOrigen || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium">Destino:</span>
            <p className="text-sm text-muted-foreground">
              {item.direccionDestino || "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Descripción
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{item.descripcion || "Sin descripción"}</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <DollarSign className="h-4 w-4 mr-2" />
          Información Financiera
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Total:</span>
          <span className="text-sm font-medium">
            {formatearPrecio(item.total)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Estado de Pago:</span>
          <span className="text-sm">{item.estadoPago || "N/A"}</span>
        </div>
      </CardContent>
    </Card>

    {(item?.responsableRecojoNombre ||
      item?.responsableRecojoNumeroDocumento ||
      item?.responsableRecojoEmpresa ||
      item?.responsableRecojoTelefono ||
      item?.responsableRecojoEmail ||
      item?.responsableRecojoDireccion) && (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <User className="h-4 w-4 mr-2" />
            Responsable de Recojo
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Nombre:</span>
            <span className="text-sm">
              {[item?.responsableRecojoNombre, item?.responsableRecojoApellidos]
                .filter(Boolean)
                .join(" ") || "No especificado"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Documento:</span>
            <span className="text-sm">
              {(item?.responsableRecojoTipoDocumento || "-") +
                (item?.responsableRecojoNumeroDocumento
                  ? ` • ${item.responsableRecojoNumeroDocumento}`
                  : "")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Teléfono:</span>
            <span className="text-sm">
              {item?.responsableRecojoTelefono || "No especificado"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Email:</span>
            <span className="text-sm">
              {item?.responsableRecojoEmail || "No especificado"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Empresa:</span>
            <span className="text-sm">
              {item?.responsableRecojoEmpresa || "No especificado"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Cargo:</span>
            <span className="text-sm">
              {item?.responsableRecojoCargo || "No especificado"}
            </span>
          </div>
          <div className="md:col-span-2">
            <span className="text-sm font-medium">Dirección:</span>
            <p className="text-sm text-muted-foreground">
              {item?.responsableRecojoDireccion || "No especificado"}
            </p>
          </div>
        </CardContent>
      </Card>
    )}
  </div>
);
const DetalleCotizacion = ({ item }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Calculator className="h-4 w-4 mr-2" />
            Información de la Cotización
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">ID:</span>
            <code className="text-sm bg-muted px-2 py-1 rounded">
              {item.id}
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Estado:</span>
            {getEstadoBadge("cotizacion", item.estado)}
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Válida hasta:</span>
            <span className="text-sm">
              {formatearFecha(item.fechaVencimiento)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Ruta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm font-medium">Origen:</span>
            <p className="text-sm text-muted-foreground">
              {item.ciudadOrigen || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium">Destino:</span>
            <p className="text-sm text-muted-foreground">
              {item.ciudadDestino || "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Contenido
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{item.contenido || "Sin descripción"}</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <DollarSign className="h-4 w-4 mr-2" />
          Precio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Precio Final:</span>
          <span className="text-sm font-medium">
            {formatearPrecio(item.precioFinal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Peso Estimado:</span>
          <span className="text-sm">{item.pesoEstimado || "N/A"} kg</span>
        </div>
      </CardContent>
    </Card>
  </div>
);

const DetallePago = ({ item }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Información del Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">ID:</span>
            <code className="text-sm bg-muted px-2 py-1 rounded">
              {item.id}
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Estado:</span>
            {getEstadoBadge("pago", item.estado)}
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Método:</span>
            <span className="text-sm">{item.metodoPago || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Referencia:</span>
            <span className="text-sm">{item.referencia || "N/A"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Monto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total:</span>
            <span className="text-sm font-medium">
              {formatearPrecio(item.total)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              Fecha de Pago:
            </span>
            <span className="text-sm">{formatearFecha(item.fechaPago)}</span>
          </div>
        </CardContent>
      </Card>
    </div>

    {item.descripcion && (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Descripción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{item.descripcion}</p>
        </CardContent>
      </Card>
    )}
  </div>
);

export default function DetalleModal({ isOpen, onClose, item }) {
  if (!item) return null;

  const getIcon = () => {
    switch (item.tipo) {
      case "envio":
        return <Package className="h-5 w-5" />;
      case "cotizacion":
        return <Calculator className="h-5 w-5" />;
      case "pago":
        return <CreditCard className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    switch (item.tipo) {
      case "envio":
        return `Envío ${item.guia || item.id}`;
      case "cotizacion":
        return `Cotización ${item.id}`;
      case "pago":
        return `Pago ${item.id}`;
      default:
        return "Detalles";
    }
  };

  const renderContent = () => {
    switch (item.tipo) {
      case "envio":
        return <DetalleEnvio item={item} />;
      case "cotizacion":
        return <DetalleCotizacion item={item} />;
      case "pago":
        return <DetallePago item={item} />;
      default:
        return <div>Tipo de registro no reconocido</div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getIcon()}
            <span>{getTitle()}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>
              Creado el {formatearFecha(item.createdAt || item.fechaRegistro)}
            </span>
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="mt-4">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
