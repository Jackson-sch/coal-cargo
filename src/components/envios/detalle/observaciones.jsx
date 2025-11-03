import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function Observaciones({ envio }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" /> Observaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{envio.observaciones}</p>
      </CardContent>
    </Card>
  );
}
