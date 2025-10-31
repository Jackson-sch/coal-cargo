"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Users,
  FileSpreadsheet,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ImportarClientesPage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState(null); // 'processing', 'completed', 'error'
  const [importResults, setImportResults] = useState(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);

  // Manejar drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Validar tipo de archivo
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (
      !allowedTypes.includes(selectedFile.type) &&
      !selectedFile.name.toLowerCase().endsWith(".csv") &&
      !selectedFile.name.toLowerCase().endsWith(".xlsx") &&
      !selectedFile.name.toLowerCase().endsWith(".xls")
    ) {
      toast.error(
        "Tipo de archivo no válido. Solo se permiten archivos CSV y Excel."
      );
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("El archivo es demasiado grande. Máximo 10MB.");
      return;
    }

    setFile(selectedFile);
    processFile(selectedFile);
  };

  const processFile = async (file) => {
    setLoading(true);
    setPreviewData([]);
    setValidationResults(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/clientes/importar/preview", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setPreviewData(result.data.preview);
        setValidationResults(result.data.validation);
        toast.success(
          `Archivo procesado: ${result.data.totalRows} filas encontradas`
        );
      } else {
        toast.error(result.error || "Error al procesar el archivo");
        setFile(null);
      }
    } catch (error) {
      toast.error("Error al procesar el archivo");
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !validationResults) return;

    setImportStatus("processing");
    setImportProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/clientes/importar", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImportStatus("completed");
        setImportResults(result.data);
        setShowResultsDialog(true);
        toast.success(
          `Importación completada: ${result.data.imported} clientes importados`
        );
      } else {
        setImportStatus("error");
        toast.error(result.error || "Error durante la importación");
      }
    } catch (error) {
      setImportStatus("error");
      toast.error("Error durante la importación");
    }
  };

  const downloadTemplate = () => {
    // Crear CSV template
    const headers = [
      "tipoDocumento",
      "numeroDocumento",
      "nombre",
      "apellidos",
      "razonSocial",
      "email",
      "telefono",
      "direccion",
      "departamento",
      "provincia",
      "distrito",
      "esEmpresa",
    ];

    const csvContent =
      headers.join(",") +
      "\n" +
      "DNI,12345678,Juan,Pérez,,juan@email.com,999123456,Av. Principal 123,Lima,Lima,Miraflores,false\n" +
      "RUC,20123456789,María,González,Empresa SAC,maria@empresa.com,987654321,Jr. Comercio 456,Arequipa,Arequipa,Arequipa,true";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_clientes.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetImport = () => {
    setFile(null);
    setPreviewData([]);
    setValidationResults(null);
    setImportStatus(null);
    setImportProgress(0);
    setImportResults(null);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Importar Clientes
            </h2>
            <p className="text-muted-foreground">
              Importa múltiples clientes desde archivos CSV o Excel
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Descargar Plantilla
          </Button>
          {file && (
            <Button variant="outline" onClick={resetImport}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
          )}
        </div>
      </div>

      {/* Instrucciones */}
      <Alert>
        <FileSpreadsheet className="h-4 w-4" />
        <AlertTitle>Instrucciones de Importación</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Formatos soportados: CSV, XLS, XLSX</li>
            <li>• Tamaño máximo: 10MB</li>
            <li>
              • Campos requeridos: tipoDocumento, numeroDocumento, nombre,
              telefono
            </li>
            <li>
              • Para empresas: incluir razonSocial y marcar esEmpresa como true
            </li>
            <li>• Descarga la plantilla para ver el formato correcto</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Área de carga de archivos */}
      {!file && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Cargar Archivo
            </CardTitle>
            <CardDescription>
              Arrastra y suelta tu archivo aquí o haz clic para seleccionar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {dragActive
                    ? "Suelta el archivo aquí"
                    : "Arrastra tu archivo aquí"}
                </p>
                <p className="text-sm text-muted-foreground">o</p>
                <Label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer">
                    Seleccionar Archivo
                  </Button>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información del archivo cargado */}
      {file && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Archivo Cargado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {loading && (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Procesando...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados de validación */}
      {validationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Resultados de Validación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">{validationResults.valid}</p>
                  <p className="text-sm text-muted-foreground">
                    Registros válidos
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium">{validationResults.invalid}</p>
                  <p className="text-sm text-muted-foreground">
                    Registros con errores
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">{validationResults.duplicates}</p>
                  <p className="text-sm text-muted-foreground">
                    Duplicados detectados
                  </p>
                </div>
              </div>
            </div>
            {validationResults.errors &&
              validationResults.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Errores encontrados:</h4>
                  <div className="space-y-1">
                    {validationResults.errors
                      .slice(0, 5)
                      .map((error, index) => (
                        <p key={index} className="text-sm text-red-600">
                          Fila {error.row}: {error.message}
                        </p>
                      ))}
                    {validationResults.errors.length > 5 && (
                      <p className="text-sm text-muted-foreground">
                        ... y {validationResults.errors.length - 5} errores más
                      </p>
                    )}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Vista previa de datos */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Vista Previa de Datos
            </CardTitle>
            <CardDescription>
              Mostrando los primeros {Math.min(previewData.length, 10)}{" "}
              registros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tipo Doc.</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Apellidos</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {row.valid ? (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Válido
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{row.tipoDocumento}</TableCell>
                      <TableCell>{row.numeroDocumento}</TableCell>
                      <TableCell>{row.nombre}</TableCell>
                      <TableCell>{row.apellidos}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.telefono}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {row.esEmpresa ? "Empresa" : "Persona"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón de importación */}
      {validationResults && validationResults.valid > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">¿Proceder con la importación?</p>
                <p className="text-sm text-muted-foreground">
                  Se importarán {validationResults.valid} registros válidos
                  {validationResults.invalid > 0 &&
                    ` (${validationResults.invalid} registros con errores serán omitidos)`}
                </p>
              </div>
              <Button
                onClick={handleImport}
                disabled={importStatus === "processing"}
                size="lg"
              >
                {importStatus === "processing" ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Clientes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progreso de importación */}
      {importStatus === "processing" && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Importando clientes...
                </span>
                <span className="text-sm text-muted-foreground">
                  {importProgress}%
                </span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de resultados */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Importación Completada
            </DialogTitle>
            <DialogDescription>
              Resumen de la importación de clientes
            </DialogDescription>
          </DialogHeader>
          {importResults && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between">
                  <span>Clientes importados:</span>
                  <span className="font-medium text-green-600">
                    {importResults.imported}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Registros omitidos:</span>
                  <span className="font-medium text-red-600">
                    {importResults.skipped}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total procesados:</span>
                  <span className="font-medium">{importResults.total}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    setShowResultsDialog(false);
                    router.push("/dashboard/clientes");
                  }}
                  className="flex-1"
                >
                  Ver Clientes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResultsDialog(false);
                    resetImport();
                  }}
                  className="flex-1"
                >
                  Nueva Importación
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
