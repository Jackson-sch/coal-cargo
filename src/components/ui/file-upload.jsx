"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

export function FileUpload({
  currentFile,
  onFileChange,
  label = "Archivo",
  tipo = "archivo",
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentFile);
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
      formData.append("file", file);
      formData.append("tipo", tipo);

      const response = await fetch("/api/upload/eventos", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${label} subido correctamente`);
        setPreview(result.url);
        onFileChange?.(result.url);
      } else {
        toast.error(result.error || `Error al subir el ${label.toLowerCase()}`);
        setPreview(currentFile); // Revertir preview
      }
    } catch (error) {
      toast.error(`Error al subir el ${label.toLowerCase()}`);
      setPreview(currentFile); // Revertir preview
    } finally {
      setUploading(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = () => {
    setPreview(null);
    onFileChange?.(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="space-y-2">
          <div className="relative border border-gray-200 rounded-lg overflow-hidden">
            <Image
              src={preview}
              alt="Preview"
              width={300}
              height={200}
              className="w-full h-32 object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleDelete}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <div className="flex flex-col items-center justify-center w-full rounded-lg p-6 bg-muted/50 hover:bg-muted/10 transition-colors">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">Subiendo...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Click para subir o arrastra aquí
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, WEBP (máx. 5MB)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={triggerFileInput}
                >
                  Seleccionar {label}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
