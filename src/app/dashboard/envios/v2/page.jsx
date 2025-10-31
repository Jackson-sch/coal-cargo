"use client";
import FormularioEnvioV2 from "@/components/envios/v2/FormularioEnvio";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
export default function EnviosV2Page() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Formulario de Envíos v2 (Vista previa)</CardTitle>
        </CardHeader>
        <CardContent>
          <FormularioEnvioV2 />
        </CardContent>
      </Card>
    </div>
  );
}
