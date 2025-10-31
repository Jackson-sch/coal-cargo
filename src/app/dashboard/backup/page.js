"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BackupPage() {
  const router = useRouter();
  useEffect(() => {
    // Redirigir inmediatamente a la página de respald o
    router.replace("/dashboard/respaldo");
  }, [router]); // Mostrar un mensaje de carga mientras se redirig e
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Redirigiendo al módulo de Respaldo y Recuperación...
          </p>
        </div>
      </div>
    </div>
  );
}
