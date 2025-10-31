import {
  Shield,
  FileText,
  Activity,
  AlertTriangle,
  Download,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AuditoriaClient from "@/components/auditoria/auditoria-client";
import {
  getEstadisticasAuditoria,
  getLogsAuditoria,
} from "@/lib/actions/auditoria";
export default async function AuditoriaPage() {
  // Obtener datos del servido r
  const [estadisticasResult, logsResult] = await Promise.all([
    getEstadisticasAuditoria(),
    getLogsAuditoria({ limit: 50 }),
  ]);
  const estadisticas = estadisticasResult.success
    ? estadisticasResult.data
    : {
        totalLogs: 0,
        logsHoy: 0,
        loginsFallidos: 0,
        actividadSospechosa: 0,
        erroresSistema: 0,
        respaldos: 0,
      };
  const logs = logsResult.success ? logsResult.data.logs || [] : [];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" /> Auditoría y Logs
          </h1>
          <p className="text-muted-foreground">
            Monitoreo de actividades y seguridad del sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>
      <AuditoriaClient initialEstadisticas={estadisticas} initialLogs={logs} />
    </div>
  );
}
