"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RouteProtection from "@/components/auth/route-protection";

export default function BackupPage() {
  return (
    <RouteProtection
      allowedRoles="SUPER_ADMIN"
      customMessage="Solo los Super Administradores pueden gestionar respaldos del sistema."
    >
      <BackupPageContent />
    </RouteProtection>
  );
}

function BackupPageContent() {
  const router = useRouter();
  useEffect(() => {
    // Redirigir inmediatamente a la página de respaldos
    router.replace("/dashboard/respaldo");
  }, [router]);
  
  return (
    <div className="flex-1 space-y-4">
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
