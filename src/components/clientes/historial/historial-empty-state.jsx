"use client";

import { Activity } from "lucide-react";

export default function HistorialEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Activity className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No hay actividad registrada</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Este cliente aún no tiene envíos, cotizaciones o pagos registrados en el sistema.
      </p>
    </div>
  );
}

