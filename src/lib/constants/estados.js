// lib/constants/estados.j s
const ESTADOS_ENVIO = {
  REGISTRADO: {
    label: "Registrado",
    description: "Envío registrado en sistema",
    color: "blue",
    icon: "FileText",
  },
  RECOLECTADO: {
    label: "Recolectado",
    description: "Paquete recolectado",
    color: "orange",
    icon: "Package",
  },
  EN_AGENCIA_ORIGEN: {
    label: "En Agencia",
    description: "En agencia de origen",
    color: "purple",
    icon: "Building",
  },
  EN_TRANSITO: {
    label: "En Tránsito",
    description: "En camino al destino",
    color: "yellow",
    icon: "Truck",
  },
  EN_AGENCIA_DESTINO: {
    label: "En Destino",
    description: "Llegó a agencia destino",
    color: "indigo",
    icon: "MapPin",
  },
  EN_REPARTO: {
    label: "En Reparto",
    description: "En proceso de entrega",
    color: "cyan",
    icon: "Navigation",
  },
  ENTREGADO: {
    label: "Entregado",
    description: "Entregado exitosamente",
    color: "green",
    icon: "CheckCircle",
  },
  DEVUELTO: {
    label: "Devuelto",
    description: "Devuelto al remitente",
    color: "red",
    icon: "RotateCcw",
  },
  EXTRAVIADO: {
    label: "Extraviado",
    description: "Reportado como extraviado",
    color: "red",
    icon: "AlertTriangle",
  },
  ANULADO: {
    label: "Anulado",
    description: "Envío anulado",
    color: "gray",
    icon: "X",
  },
};
const TIPOS_SERVICIO = {
  NORMAL: {
    label: "Normal",
    description: "Entrega en 3-5 días",
    factor: 1.0,
    icon: "Clock",
  },
  EXPRESS: {
    label: "Express",
    description: "Entrega en 1-2 días",
    factor: 1.5,
    icon: "Zap",
  },
  OVERNIGHT: {
    label: "Overnight",
    description: "Entrega en 24 horas",
    factor: 2.0,
    icon: "Moon",
  },
  ECONOMICO: {
    label: "Económico",
    description: "Entrega en 5-7 días",
    factor: 0.8,
    icon: "DollarSign",
  },
};
const MODALIDADES = {
  SUCURSAL_SUCURSAL: {
    label: "Sucursal a Sucursal",
    description: "Entrega y recojo en sucursal",
    icon: "Building2",
  },
  DOMICILIO_SUCURSAL: {
    label: "Domicilio a Sucursal",
    description: "Recojo a domicilio, entrega en sucursal",
    icon: "Home",
  },
  SUCURSAL_DOMICILIO: {
    label: "Sucursal a Domicilio",
    description: "Entrega en sucursal, entrega a domicilio",
    icon: "Building",
  },
  DOMICILIO_DOMICILIO: {
    label: "Domicilio a Domicilio",
    description: "Recojo y entrega a domicilio",
    icon: "Truck",
  },
};
export default { ESTADOS_ENVIO, TIPOS_SERVICIO, MODALIDADES };
