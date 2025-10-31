"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Hook para manejar formato del voucher, URL completa para QR
 * y flags de modo impresión/auto-cierre.
 */
export function useVoucher(pagoId) {
  const searchParams = useSearchParams();
  const printParam = searchParams?.get("print");
  const closeParam = searchParams?.get("close");
  const formatParam = searchParams?.get("format");

  const isPrintMode = printParam === "1" || printParam === "true";
  const shouldClose = closeParam === "1" || closeParam === "true";

  const [formato, setFormato] = useState("80"); // Inicializar con 80mm

  useEffect(() => {
    try {
      const qsFormat =
        formatParam === "58" ? "58" : formatParam === "80" ? "80" : null;
      const saved =
        typeof window !== "undefined"
          ? window.localStorage.getItem("voucherFormat")
          : null;
      const initial = qsFormat || saved || "80";

      setFormato(initial);

      if (typeof window !== "undefined") {
        window.localStorage.setItem("voucherFormat", initial);
      }
    } catch {}
  }, [formatParam]);

  const fullUrl = useMemo(() => {
    try {
      const baseHref =
        typeof window !== "undefined"
          ? window.location.href
          : `https://example.com/dashboard/pagos/voucher/${pagoId || ""}`;
      const u = new URL(baseHref);

      if (formato) u.searchParams.set("format", formato);
      u.searchParams.delete("print");
      u.searchParams.delete("close");

      return u.toString();
    } catch {
      return pagoId ? String(pagoId) : "";
    }
  }, [pagoId, formato]);

  return {
    formato,
    setFormato,
    fullUrl,
    isPrintMode,
    shouldClose,
  };
}
