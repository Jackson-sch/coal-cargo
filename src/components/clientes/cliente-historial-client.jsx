"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, Calculator, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Modal from "@/components/ui/modal";
import HistorialHeader from "./historial/historial-header";
import HistorialEstadisticas from "./historial/historial-estadisticas";
import HistorialFiltros from "./historial/historial-filtros";
import HistorialTabla from "./historial/historial-tabla";
import HistorialDetalleContent from "./historial/historial-detalle-content";

export default function ClienteHistorialClient({
  initialData,
  cliente,
  initialFiltros,
  totalItems: propTotalItems,
  total,
  totalPages,
  currentPage,
  estadisticas: initialEstadisticas,
}) {
  // Usar totalItems de props o total, con fallback
  const totalItems = propTotalItems ?? total ?? (initialData?.length || 0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Estados para el modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filtros, setFiltros] = useState({
    tipo: initialFiltros?.tipo || "todos",
    estado: initialFiltros?.estado || "todos",
    fechaRango: {
      from: initialFiltros?.fechaDesde
        ? new Date(initialFiltros.fechaDesde)
        : null,
      to: initialFiltros?.fechaHasta
        ? new Date(initialFiltros.fechaHasta)
        : null,
    },
    busqueda: initialFiltros?.busqueda || "",
    page: currentPage || 1,
    limit: 10,
  });

  const data = initialData || [];

  // Función para abrir el modal con detalles
  const openModal = (item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  // Función para actualizar URL con filtros
  const updateURL = useCallback(
    (newParams) => {
      const params = new URLSearchParams(searchParams);

      // Preservar clienteId siempre
      const clienteId = searchParams.get("clienteId");
      if (clienteId) {
        params.set("clienteId", clienteId);
      }

      Object.entries(newParams).forEach(([key, value]) => {
        // Manejar fechaRango especialmente
        if (key === "fechaRango") {
          if (value?.from) {
            params.set("fechaDesde", value.from.toISOString().split("T")[0]);
          } else {
            params.delete("fechaDesde");
          }
          if (value?.to) {
            params.set("fechaHasta", value.to.toISOString().split("T")[0]);
          } else {
            params.delete("fechaHasta");
          }
        } else if (key === "page") {
          // Manejar página especialmente
          if (value && value !== 1) {
            params.set(key, value.toString());
          } else {
            params.delete(key);
          }
        } else if (key === "tipo" || key === "estado") {
          // Para tipo y estado, solo agregar si no es "todos"
          if (value && value !== "todos" && value !== "") {
            params.set(key, value);
          } else {
            params.delete(key);
          }
        } else if (key === "busqueda") {
          // Para búsqueda, eliminar si está vacío
          if (value && value.trim() !== "") {
            params.set(key, value);
          } else {
            params.delete(key);
          }
        } else if (key !== "clienteId" && key !== "limit") {
          // Para otros parámetros
          if (value && value !== "" && value !== null) {
            params.set(key, value);
          } else {
            params.delete(key);
          }
        }
      });

      router.push(`/dashboard/clientes/historial?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Manejar cambios de filtros
  const handleFiltroChange = useCallback(
    (key, value) => {
      let newFiltros;
      if (key === "fechaRango") {
        newFiltros = { ...filtros, fechaRango: value, page: 1 };
        // Actualizar URL con fechas separadas para compatibilidad
        const urlParams = {
          ...filtros,
          fechaRango: value,
          page: 1,
        };
        setFiltros(newFiltros);
        startTransition(() => {
          updateURL(urlParams);
        });
      } else if (key === "tipo") {
        // Cuando se cambia el tipo, validar si el estado actual es compatible
        const estadosEnvio = [
          "REGISTRADO",
          "EN_BODEGA",
          "EN_TRANSITO",
          "EN_AGENCIA_ORIGEN",
          "EN_AGENCIA_DESTINO",
          "EN_REPARTO",
          "ENTREGADO",
          "DEVUELTO",
          "ANULADO",
        ];
        const estadosCotizacion = [
          "PENDIENTE",
          "APROBADA",
          "RECHAZADA",
          "CONVERTIDA_ENVIO",
          "EXPIRADA",
        ];

        let estadoActual = filtros.estado || "";
        // Solo validar compatibilidad si el tipo no es "todos"
        const debeLimpiarEstado =
          value !== "todos" &&
          estadoActual &&
          estadoActual !== "todos" &&
          ((value === "envios" && !estadosEnvio.includes(estadoActual)) ||
            (value === "cotizaciones" &&
              !estadosCotizacion.includes(estadoActual)));

        newFiltros = {
          ...filtros,
          tipo: value,
          estado: debeLimpiarEstado ? "todos" : estadoActual,
          page: 1,
        };
        setFiltros(newFiltros);
        startTransition(() => {
          updateURL(newFiltros);
        });
      } else {
        newFiltros = {
          ...filtros,
          [key]: value,
          page: key === "page" ? value : 1,
        };
        setFiltros(newFiltros);
        startTransition(() => {
          updateURL(newFiltros);
        });
      }
    },
    [filtros, updateURL]
  );

  // Función para limpiar todos los filtros
  const handleClearFilters = useCallback(() => {
    const clearedFiltros = {
      tipo: "todos",
      estado: "todos",
      fechaRango: { from: null, to: null },
      busqueda: "",
      page: 1,
      limit: 10,
    };
    setFiltros(clearedFiltros);
    startTransition(() => {
      updateURL(clearedFiltros);
    });
  }, [updateURL]);

  // Manejar cambio de página
  const handlePageChange = useCallback(
    (newFiltros) => {
      setFiltros(newFiltros);
      updateURL(newFiltros);
    },
    [updateURL]
  );

  // Estadísticas del cliente - usar las del servidor si están disponibles, sino calcular desde data
  const estadisticas = initialEstadisticas || {
    totalEnvios: data.filter((item) => item.tipo === "envio").length,
    totalCotizaciones: data.filter((item) => item.tipo === "cotizacion").length,
    enviosEntregados: data.filter(
      (item) => item.tipo === "envio" && item.estado === "ENTREGADO"
    ).length,
    montoTotal: data.reduce(
      (sum, item) => sum + (item.total || item.precioFinal || 0),
      0
    ),
  };

  return (
    <div className="space-y-6">
      <HistorialHeader cliente={cliente} />
      <HistorialEstadisticas estadisticas={estadisticas} />
      <HistorialFiltros
        filtros={filtros}
        onFiltroChange={handleFiltroChange}
        onClearFilters={handleClearFilters}
        isPending={isPending}
      />
      <HistorialTabla
        data={data}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onView={openModal}
        onPageChange={handlePageChange}
        isPending={isPending}
        filtros={filtros}
      />
      <Modal
        open={modalOpen}
        onOpenChange={closeModal}
        size="xl"
        title={
          selectedItem
            ? selectedItem.tipo === "envio"
              ? `Envío ${selectedItem.guia || selectedItem.id?.slice(0, 8)}`
              : selectedItem.tipo === "cotizacion"
              ? `Cotización ${selectedItem.id?.slice(0, 8)}`
              : selectedItem.tipo === "pago"
              ? `Pago ${selectedItem.id?.slice(0, 8)}`
              : "Detalles"
            : "Detalles"
        }
        description={
          selectedItem
            ? `Registrado el ${format(
                new Date(selectedItem.fechaRegistro || selectedItem.fechaPrincipal || selectedItem.createdAt),
                "dd 'de' MMMM 'de' yyyy 'a las' HH:mm",
                { locale: es }
              )}`
            : ""
        }
        icon={
          selectedItem?.tipo === "envio" ? (
            <Package className="h-5 w-5" />
          ) : selectedItem?.tipo === "cotizacion" ? (
            <Calculator className="h-5 w-5" />
          ) : selectedItem?.tipo === "pago" ? (
            <CreditCard className="h-5 w-5" />
          ) : null
        }
      >
        <HistorialDetalleContent item={selectedItem} />
      </Modal>
    </div>
  );
}
