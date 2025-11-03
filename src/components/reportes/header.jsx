import { Button } from "@/components/ui/button";
import { Download, FileDown, Printer, RefreshCw } from "lucide-react";

export default function HeaderReportes({
  exportToExcel,
  exportAllToExcel,
  exportToCSV,
  exportToPDF,
  fetchEnvios,
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground">
          Genera reportes de envíos con filtros y exportación
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button onClick={exportToExcel} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" /> Excel (página)
        </Button>
        <Button onClick={exportAllToExcel} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" /> Excel (todo)
        </Button>
        <Button onClick={exportToCSV} variant="outline" size="sm">
          <FileDown className="h-4 w-4 mr-2" /> CSV
        </Button>
        <Button onClick={exportToPDF} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" /> PDF
        </Button>
        <Button onClick={fetchEnvios} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </div>
    </div>
  );
}
