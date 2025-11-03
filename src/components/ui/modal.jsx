import { memo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const Modal = memo(function Modal({
  children,
  title,
  description,
  open,
  onOpenChange,
  className,
  contentClassName,
  headerClassName,
  icon,
  titleClassName,
  descriptionClassName,
  footer,
  size = "default",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  loading = false,
}) {
  // Tamaños predefinidos
  const sizeClasses = {
    sm: "max-w-sm",
    default: "max-w-[95%] md:max-w-2xl",
    lg: "max-w-[95%] md:max-w-4xl",
    xl: "max-w-[95%] md:max-w-6xl",
    full: "max-w-[95%] h-[90vh]",
  };

  // Manejar cambio de estado con validación
  const handleOpenChange = useCallback(
    (newOpen) => {
      // Si está cargando, prevenir cierre
      if (loading && !newOpen) {
        return;
      }
      onOpenChange?.(newOpen);
    },
    [loading, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          sizeClasses[size],
          "max-h-[90vh] flex flex-col",
          loading && "pointer-events-none opacity-70",
          contentClassName,
          className
        )}
        onPointerDownOutside={(e) => {
          if (!closeOnOverlayClick) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!closeOnEscape) {
            e.preventDefault();
          }
        }}
      >
        {/* Header con scroll independiente */}
        {(title || description || icon) && (
          <DialogHeader
            className={cn("flex-shrink-0 p-0 text-left", headerClassName)}
          >
            {title && (
              <DialogTitle
                className={cn(
                  "flex items-center gap-2 text-lg font-semibold",
                  titleClassName
                )}
              >
                {icon && (
                  <span className="flex-shrink-0" aria-hidden="true">
                    {icon}
                  </span>
                )}
                <span className="flex-1 min-w-0 truncate">{title}</span>
              </DialogTitle>
            )}
            {description && (
              <DialogDescription
                className={cn(
                  "text-muted-foreground text-sm  ml-7",
                  descriptionClassName
                )}
              >
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-4">
          {children}
        </div>

        {/* Footer opcional */}
        {footer && (
          <DialogFooter className="flex-shrink-0 mt-4">{footer}</DialogFooter>
        )}

        {/* Indicador de carga */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Cargando...</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

Modal.propTypes = {
  children: PropTypes.node,
  title: PropTypes.node,
  description: PropTypes.node,
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  headerClassName: PropTypes.string,
  icon: PropTypes.node,
  titleClassName: PropTypes.string,
  descriptionClassName: PropTypes.string,
  footer: PropTypes.node,
  size: PropTypes.oneOf(["sm", "default", "lg", "xl", "full"]),
  closeOnOverlayClick: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  loading: PropTypes.bool,
};

export default Modal;
