import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Componente reutilizable para cada tarjeta de estadística
export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${iconColor}`}>{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
