import { Badge } from "@/components/ui/badge";
import { estadosEnvioArray } from "@/lib/constants/estados";

/**
 * Genera un Badge con el estado del envío
 * @param {string} estado - El estado del envío
 * @returns {JSX.Element|null} Componente Badge o null si no se encuentra el estado
 */
export function getEstadoBadge(estado) {
  const estadoInfo = estadosEnvioArray.find((e) => e.value === estado);
  if (!estadoInfo) return null;
  
  const Icon = estadoInfo.icon;
  return (
    <Badge className={`${estadoInfo.color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" /> {estadoInfo.label}
    </Badge>
  );
}
