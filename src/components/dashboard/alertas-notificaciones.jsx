import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AlertasNotificaciones({kpis}) {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-5 w-5" /> Atención Requerida
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-yellow-800">
          Tienes <strong>{kpis.enviosRetrasados}</strong> envíos retrasados que
          requieren atención.
          <Link
            href="/dashboard/envios?alert=retrasados"
            className="ml-2 underline hover:no-underline"
          >
            Ver envíos retrasados
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
