"use client"; import React from "react";
import { cn } from "@/lib/utils"; export default function ResultsCounter({ page, limit, count, total, totalPages, entityLabel = "registros", className,
}) { let text = ""; const hasTotal = typeof total === "number"; const hasLimit = typeof limit === "number" && typeof page === "number"; if (hasLimit) { const start = hasTotal && total <= 0 ? 0 : ((page - 1) * limit) + 1; const effectiveCount = typeof count === "number" ? count : hasTotal ? Math.min(limit, Math.max(0, total - ((page - 1) * limit))) : limit; const end = hasTotal && total > 0 ? ((page - 1) * limit) + effectiveCount : 0; const totalText = hasTotal ? total : effectiveCount; text = `Mostrando ${start}-${end} de ${totalText} ${entityLabel}`; } else if (typeof page === "number" && typeof totalPages === "number") { const extra = hasTotal ? ` (${total} ${entityLabel})` : ""; text = `Página ${page} de ${totalPages}${extra}`; } else if (hasTotal) { const shown = typeof count === "number" ? count : total; text = `Mostrando ${shown} de ${total} ${entityLabel}`; }

  if (!text) return null; return <div className={cn("text-sm text-muted-foreground", className)}>{text}</div>;
}
