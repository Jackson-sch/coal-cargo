"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState } from "react";

export default function Paginator({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className,
  showAlways = true,
  maxSimple = 7,
  // Counter props
  limit,
  total,
  count,
  entityLabel = "registros",
  // Layout & opciones
  variant = "minimal", // minimal | compact | detailed
  showNumbers = true,
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
  showItemsPerPage = true,
  showQuickJump = true,
  showFirstLast = true,
}) {
  const [jumpValue, setJumpValue] = useState("");
  const totalPagesNum = Math.max(totalPages || 1, 1);

  const handleKeyDown = (e) => {
    // Navegación por teclado: izquierda/derecha, inicio/fin
    if (e.key === "ArrowLeft") {
      if (currentPage > 1) handleChange(currentPage - 1);
    } else if (e.key === "ArrowRight") {
      if (currentPage < totalPagesNum) handleChange(currentPage + 1);
    } else if (e.key === "Home") {
      handleChange(1);
    } else if (e.key === "End") {
      handleChange(totalPagesNum);
    }
  };

  const handleChange = (p) => {
    if (typeof onPageChange === "function") {
      onPageChange(p);
    }
  };

  const handleItemsPerPageChange = (value) => {
    if (typeof onItemsPerPageChange === "function") {
      onItemsPerPageChange(Number(value));
    }
  };

  const handleQuickJump = () => {
    const pageNum = Number.parseInt(jumpValue);
    if (pageNum >= 1 && pageNum <= totalPagesNum) {
      handleChange(pageNum);
      setJumpValue("");
    }
  };

  const getResultsRange = () => {
    if (!limit || !total) return null;
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);
    return { start, end };
  };

  const range = getResultsRange();
  const numbersVisible = variant === "minimal" ? true : showNumbers;

  const renderItems = () => {
    const items = [];

    const addPage = (p) =>
      items.push(
        <PaginationItem
          key={`p-${p}`}
          className={cn(
            numbersVisible
              ? variant === "minimal"
                ? ""
                : "hidden sm:block"
              : "hidden"
          )}
        >
          <PaginationLink
            href="#"
            isActive={p === currentPage}
            onClick={(e) => {
              e.preventDefault();
              handleChange(p);
            }}
            aria-label={`Ir a la página ${p}`}
            title={`Ir a la página ${p}`}
          >
            {p}
          </PaginationLink>
        </PaginationItem>
      );

    const addEllipsis = (key) =>
      items.push(
        <PaginationItem
          key={key}
          className={cn(
            numbersVisible
              ? variant === "minimal"
                ? ""
                : "hidden sm:block"
              : "hidden"
          )}
        >
          <PaginationEllipsis />
        </PaginationItem>
      );

    if (totalPagesNum <= maxSimple) {
      for (let p = 1; p <= totalPagesNum; p++) addPage(p);
    } else {
      addPage(1);
      if (currentPage > 3) addEllipsis("el-1");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPagesNum - 1, currentPage + 1);
      for (let p = start; p <= end; p++) addPage(p);
      if (currentPage < totalPagesNum - 2) addEllipsis("el-2");
      addPage(totalPagesNum);
    }

    return items;
  };

  // Variante MINIMAL: solo Previous, números, ellipsis y Next
  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Pagination
          onKeyDown={handleKeyDown}
          aria-label="Controles de paginación"
        >
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                className={cn(
                  currentPage <= 1 && "pointer-events-none opacity-50"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) handleChange(currentPage - 1);
                }}
                aria-disabled={currentPage <= 1}
                title="Página anterior"
              />
            </PaginationItem>

            {renderItems()}

            <PaginationItem>
              <PaginationNext
                href="#"
                className={cn(
                  currentPage >= totalPagesNum &&
                    "pointer-events-none opacity-50"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPagesNum)
                    handleChange(currentPage + 1);
                }}
                aria-disabled={currentPage >= totalPagesNum}
                title="Página siguiente"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  }

  // Variantes compact/detailed: barra unificada
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className={cn(
          "flex flex-col lg:flex-row items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3",
          variant === "detailed" && "bg-card"
        )}
      >
        <div className="flex items-center gap-3">
          {range && (
            <div className="text-sm text-muted-foreground" aria-live="polite">
              Mostrando{" "}
              <span className="font-medium text-foreground">{range.start}</span>{" "}
              a <span className="font-medium text-foreground">{range.end}</span>{" "}
              de <span className="font-medium text-foreground">{total}</span>{" "}
              {entityLabel}
            </div>
          )}

          {showItemsPerPage && itemsPerPage && onItemsPerPageChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Mostrar
              </span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-[80px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {itemsPerPageOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">por página</span>
            </div>
          )}
        </div>

        <nav
          onKeyDown={handleKeyDown}
          tabIndex={0}
          aria-label="Controles de paginación"
          className="flex items-center gap-2"
        >
          {showFirstLast && (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 w-9 p-0",
                currentPage <= 1 && "pointer-events-none opacity-50"
              )}
              onClick={() => handleChange(1)}
              disabled={currentPage <= 1}
              title="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-1",
              currentPage <= 1 && "pointer-events-none opacity-50"
            )}
            onClick={() => currentPage > 1 && handleChange(currentPage - 1)}
            disabled={currentPage <= 1}
            title="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>

          {/* Selector de página */}
          {totalPagesNum > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Página
              </span>
              <Select
                value={String(currentPage)}
                onValueChange={(v) => handleChange(Number(v))}
              >
                <SelectTrigger className="w-[80px] h-9">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalPagesNum }, (_, i) => (
                    <SelectItem
                      key={i + 1}
                      value={String(i + 1)}
                      aria-label={`Página ${i + 1}`}
                    >
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                de {totalPagesNum}
              </span>
            </div>
          )}

          {/* Números de página (opcionales y ocultos en móvil) */}
          {showNumbers && renderItems()}

          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-1",
              currentPage >= totalPagesNum && "pointer-events-none opacity-50"
            )}
            onClick={() =>
              currentPage < totalPagesNum && handleChange(currentPage + 1)
            }
            disabled={currentPage >= totalPagesNum}
            title="Página siguiente"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {showFirstLast && (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 w-9 p-0",
                currentPage >= totalPagesNum && "pointer-events-none opacity-50"
              )}
              onClick={() => handleChange(totalPagesNum)}
              disabled={currentPage >= totalPagesNum}
              title="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}

          {/* Ir a página rápida */}
          {showQuickJump && totalPagesNum > 1 && (
            <div className="hidden sm:flex items-center gap-2 ml-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Ir a
              </span>
              <Input
                type="number"
                min="1"
                max={totalPagesNum}
                value={jumpValue}
                onChange={(e) => setJumpValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleQuickJump();
                }}
                placeholder="Pág."
                className="w-[80px] h-9"
              />
              <Button
                onClick={handleQuickJump}
                variant="outline"
                size="sm"
                className="h-9"
              >
                Ir
              </Button>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}
