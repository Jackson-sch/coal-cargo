import {
  Clock,
  Package,
  Truck,
  Building,
  MapPin,
  CheckCircle,
  AlertCircle,
  FileText,
  Navigation,
  ArrowRight,
  XCircle,
} from "lucide-react";

// Configuración base de estados para envíos
const ESTADOS_ENVIO_BASE = {
  REGISTRADO: {
    label: "Registrado",
    icon: FileText,
    color: "bg-yellow-100 text-yellow-800",
    description: "El envío ha sido registrado en el sistema",
  },
  EN_BODEGA: {
    label: "En Bodega",
    icon: Package,
    color: "bg-blue-100 text-blue-800",
    description: "El paquete está en bodega",
  },
  RECOLECTADO: {
    label: "Recolectado",
    icon: Package,
    color: "bg-orange-100 text-orange-800",
    description: "El paquete ha sido recolectado",
  },
  EN_AGENCIA_ORIGEN: {
    label: "En Agencia Origen",
    icon: Building,
    color: "bg-blue-100 text-blue-800",
    description: "El paquete está en la agencia de origen",
  },
  EN_TRANSITO: {
    label: "En Tránsito",
    icon: Truck,
    color: "bg-purple-100 text-purple-800",
    description: "El paquete está en camino al destino",
  },
  EN_AGENCIA_DESTINO: {
    label: "En Agencia Destino",
    icon: Building,
    color: "bg-purple-100 text-purple-800",
    description: "El paquete ha llegado a la agencia de destino",
  },
  EN_REPARTO: {
    label: "En Reparto",
    icon: MapPin,
    color: "bg-indigo-100 text-indigo-800",
    description: "El paquete está siendo entregado",
  },
  ENTREGADO: {
    label: "Entregado",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
    description: "El paquete ha sido entregado exitosamente",
  },
  DEVUELTO: {
    label: "Devuelto",
    icon: ArrowRight,
    color: "bg-orange-100 text-orange-800",
    description: "El paquete ha sido devuelto",
  },
  ANULADO: {
    label: "Anulado",
    icon: XCircle,
    color: "bg-red-100 text-red-800",
    description: "El envío ha sido anulado",
  },
  CANCELADO: {
    label: "Cancelado",
    icon: AlertCircle,
    color: "bg-gray-100 text-gray-800",
    description: "El envío ha sido cancelado",
  },
};

// Configuración base de modalidades
const MODALIDADES_BASE = {
  SUCURSAL_SUCURSAL: "Sucursal a Sucursal",
  SUCURSAL_DOMICILIO: "Sucursal a Domicilio",
  DOMICILIO_SUCURSAL: "Domicilio a Sucursal",
  DOMICILIO_DOMICILIO: "Domicilio a Domicilio",
};

// Configuración base de tipos de servicio
const TIPOS_SERVICIO_BASE = {
  NORMAL: "Normal",
  EXPRESS: "Express",
  OVERNIGHT: "Overnight",
  ECONOMICO: "Económico",
};

// Formato para arrays (usado en Select, Filtros, etc.)
export const estadosEnvioArray = Object.keys(ESTADOS_ENVIO_BASE).map(
  (key) => ({
    value: key,
    label: ESTADOS_ENVIO_BASE[key].label,
    color: ESTADOS_ENVIO_BASE[key].color,
    icon: ESTADOS_ENVIO_BASE[key].icon,
  })
);

// Formato para objetos (usado en seguimiento, configuración, etc.)
export const estadosEnvioObject = ESTADOS_ENVIO_BASE;

// Formato simple para modalidades
export const modalidadesArray = Object.keys(MODALIDADES_BASE).map((key) => ({
  value: key,
  label: MODALIDADES_BASE[key],
}));

export const modalidadesObject = MODALIDADES_BASE;

// Formato simple para tipos de servicio
export const tiposServicioObject = TIPOS_SERVICIO_BASE;

// Exportar todo junto para compatibilidad
export default {
  estadosEnvioArray,
  estadosEnvioObject,
  modalidadesArray,
  modalidadesObject,
  tiposServicioObject,
  ESTADOS_ENVIO: estadosEnvioObject,
  MODALIDADES: modalidadesObject,
  TIPOS_SERVICIO: tiposServicioObject,
};