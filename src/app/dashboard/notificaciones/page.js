"use client";
import { useState, useEffect } from "react";
import DashboardNotificaciones from "@/components/notificaciones/dashboard-notificaciones";
import { getEstadisticasSeguimientoMejoradas } from "@/lib/actions/seguimiento-mejorado";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchNotificaciones();
  }, []);
  const fetchNotificaciones = async () => {
    try {
      setLoading(true); // En una implementación real, tendrías una función específica para obtener notificacione s
      // Por ahora, simulamos algunas notificaciones de ejempl o
      const notificacionesEjemplo = [
        {
          id: "1",
          envioId: "env1",
          tipo: "REGISTRO_ENVIO",
          canal: "EMAIL",
          destinatario: "cliente@ejemplo.com",
          asunto: "Envío registrado",
          mensaje: "Su envío CG2025000001 ha sido registrado exitosamente",
          estado: "ENVIADA",
          intentos: 1,
          maxIntentos: 3,
          createdAt: new Date().toISOString(),
          enviadaEn: new Date().toISOString(),
          envio: { guia: "CG2025000001" },
        },
        {
          id: "2",
          envioId: "env2",
          tipo: "CAMBIO_ESTADO",
          canal: "SMS",
          destinatario: "+51987654321",
          asunto: null,
          mensaje: "Su envío CG2025000002 está en tránsito",
          estado: "PENDIENTE",
          intentos: 0,
          maxIntentos: 3,
          createdAt: new Date().toISOString(),
          enviadaEn: null,
          envio: { guia: "CG2025000002" },
        },
        {
          id: "3",
          envioId: "env3",
          tipo: "ENTREGA_EXITOSA",
          canal: "EMAIL",
          destinatario: "destinatario@ejemplo.com",
          asunto: "Envío entregado",
          mensaje: "Su envío CG2025000003 ha sido entregado exitosamente",
          estado: "ENTREGADA",
          intentos: 1,
          maxIntentos: 3,
          createdAt: new Date(Date.now() - 86400000).toISOString(), // Aye r
          enviadaEn: new Date(Date.now() - 86400000).toISOString(),
          envio: { guia: "CG2025000003" },
        },
        {
          id: "4",
          envioId: "env4",
          tipo: "PROBLEMA",
          canal: "WHATSAPP",
          destinatario: "+51987654321",
          asunto: null,
          mensaje: "Problema con la entrega del envío CG2025000004",
          estado: "FALLIDA",
          intentos: 3,
          maxIntentos: 3,
          createdAt: new Date(Date.now() - 172800000).toISOString(), // Hace 2 día s
          enviadaEn: null,
          envio: { guia: "CG2025000004" },
        },
        {
          id: "5",
          envioId: "env5",
          tipo: "CONFIRMACION_RECOLECCION",
          canal: "EMAIL",
          destinatario: "remitente@ejemplo.com",
          asunto: "Paquete recolectado",
          mensaje: "Su paquete CG2025000005 ha sido recolectado",
          estado: "ENVIADA",
          intentos: 1,
          maxIntentos: 3,
          createdAt: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hor a
          enviadaEn: new Date(Date.now() - 3600000).toISOString(),
          envio: { guia: "CG2025000005" },
        },
      ];
      setNotificaciones(notificacionesEjemplo);
    } catch (error) {
      toast.error("Error al cargar las notificaciones");
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardNotificaciones notificaciones={notificaciones} />
    </div>
  );
}
