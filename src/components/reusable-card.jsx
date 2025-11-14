import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Componente Card reutilizable
 * @param {string} title - Título de la tarjeta
 * @param {string} description - Descripción de la tarjeta
 * @param {React.ReactNode} action - Elemento de acción (botón, icono, etc.)
 * @param {React.ReactNode} children - Contenido principal de la tarjeta
 * @param {React.ReactNode} footer - Contenido del pie de la tarjeta
 * @param {string} className - Clases CSS adicionales
 */
export default function ReusableCard({
  title,
  description,
  action,
  children,
  footer,
  className = "",
}) {
  return (
    <Card className={className}>
      {(title || description || action) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}

      {children && <CardContent>{children}</CardContent>}

      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
