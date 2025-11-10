"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function HistorialHeader({ cliente }) {
  const router = useRouter();

  if (!cliente) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            {cliente.esEmpresa ? (
              <Building2 className="h-5 w-5 text-primary" />
            ) : (
              <User className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">
              Historial del Cliente
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">
                {cliente.esEmpresa
                  ? cliente.razonSocial
                  : `${cliente.nombre} ${cliente.apellidos || ""}`.trim()}
              </p>
              <Badge variant="outline" className="text-xs">
                {cliente.numeroDocumento}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

