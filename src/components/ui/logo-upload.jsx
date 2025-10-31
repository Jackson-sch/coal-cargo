"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";

export function LogoUpload({ currentLogo, onLogoChange }) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState(currentLogo);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validaciones del lado del cliente
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Tipo de archivo no permitido. Solo se permiten: JPG, PNG, WEBP"
      );
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("El archivo es demasiado grande. Máximo 5MB");
      return;
    }

    // Mostrar preview inmediatamente
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result);
    };
    reader.readAsDataURL(file);

    // Subir archivo
    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Logo subido correctamente");
        setPreview(result.logoUrl);
        onLogoChange?.(result.logoUrl);
      } else {
        toast.error(result.error || "Error al subir el logo");
        setPreview(currentLogo); // Revertir preview
      }
    } catch (error) {
      toast.error("Error al subir el logo");
      setPreview(currentLogo); // Revertir preview
    } finally {
      setUploading(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!preview) return;

    try {
      setDeleting(true);

      // Extract filename from preview URL if it's a server URL
      let filename = null;
      if (preview && preview.startsWith("/uploads/logos/")) {
        filename = preview.split("/").pop();
      }

      const url = filename
        ? `/api/upload/logo?filename=${filename}`
        : "/api/upload/logo";

      const response = await fetch(url, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Logo eliminado correctamente");
        setPreview(null);
        onLogoChange?.(null);
      } else {
        toast.error(result.error || "Error al eliminar el logo");
      }
    } catch (error) {
      toast.error("Error al eliminar el logo");
    } finally {
      setDeleting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <Label>Logo de la Empresa</Label>
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="flex flex-col items-center space-y-4">
            {/* Preview del logo */}
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
              {preview ? (
                <div className="relative w-full h-full">
                  <Image
                    src={preview}
                    alt="Logo de la empresa"
                    fill
                    className="object-contain"
                    sizes="128px"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Sin logo</p>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerFileInput}
                disabled={uploading || deleting}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {preview ? "Cambiar Logo" : "Subir Logo"}
                  </>
                )}
              </Button>

              {preview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={uploading || deleting}
                  className="text-red-600 hover:text-red-700"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Eliminar
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Input oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Información */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Formatos permitidos: JPG, PNG, WEBP
              </p>
              <p className="text-xs text-gray-500">Tamaño máximo: 5MB</p>
              <p className="text-xs text-gray-500">
                Recomendado: 200x200px o mayor
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
