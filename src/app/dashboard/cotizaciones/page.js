"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, History, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import CalculadoraSucursales from "@/components/cotizaciones/calculadora-sucursales";
import HistorialCotizaciones from "@/components/cotizaciones/historial-cotizaciones";
import EstadisticasCotizaciones from "@/components/cotizaciones/estadisticas-cotizaciones";

export default function CotizacionesPage() {
  const [cotizacionesRecientes, setCotizacionesRecientes] = useState([]);
  const [refreshHistorial, setRefreshHistorial] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const validTabs = new Set(["calculadora", "historial", "estadisticas"]);
  const initialTabParam = searchParams.get("tab");
  const [tab, setTab] = useState(
    validTabs.has(initialTabParam) ? initialTabParam : "calculadora"
  );

  const handleTabChange = (value) => {
    setTab(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "calculadora") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  // Cargar cotizaciones recientes al iniciar
  const cargarCotizacionesRecientes = async () => {
    try {
      const { getCotizaciones } = await import("@/lib/actions/cotizaciones");
      const result = await getCotizaciones({
        page: 1,
        limit: 50, // Cargar más para estadísticas
      });
      if (result.success) {
        setCotizacionesRecientes(result.data.cotizaciones);
      }
    } catch (error) {
      // Error silencioso para no interrumpir la carga de la página
    }
  };

  useEffect(() => {
    cargarCotizacionesRecientes();
  }, [refreshHistorial]);

  // Mantener sincronizado el estado con ?tab= de la URL (navegación, back/forward)
  useEffect(() => {
    const q = searchParams.get("tab");
    if (q && validTabs.has(q) && q !== tab) {
      setTab(q);
    }
    if (!q && tab !== "calculadora") {
      // Si no hay query y estamos en otra pestaña, reflejar en URL
      handleTabChange(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleCotizacionCreada = async (datosFormulario, resultado) => {
    try {
      const { createCotizacion } = await import("@/lib/actions/cotizaciones");

      // Asegurar que todos los datos del cliente se incluyan correctamente
      const cotizacionData = {
        ...datosFormulario,
        validoHastaDias: 7, // Válida por 7 días
        // Asegurar que los datos del cliente estén presentes
        nombreCliente: datosFormulario.nombreCliente || null,
        telefonoCliente: datosFormulario.telefonoCliente || null,
        emailCliente: datosFormulario.emailCliente || null,
        direccionEntrega: datosFormulario.direccionEntrega || null,
      };

      const result = await createCotizacion(cotizacionData);
      if (result.success) {
        toast.success("Cotización formal creada exitosamente");
        // Refrescar el historial
        setRefreshHistorial((prev) => prev + 1);
        // Cambiar a la pestaña de historial y sincronizar en la URL
        handleTabChange("historial");
      } else {
        toast.error(result.error || "Error al crear la cotización");
      }
    } catch (error) {
      toast.error("Error al crear la cotización formal");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-3">Cotizaciones</h1>
        <p className="text-sm text-muted-foreground">
          Calcula precios de envío entre sucursales y gestiona cotizaciones
          formales
        </p>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculadora" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculadora
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="estadisticas" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculadora">
          <CalculadoraSucursales onCotizacionCreada={handleCotizacionCreada} />
        </TabsContent>

        <TabsContent value="historial">
          <HistorialCotizaciones key={refreshHistorial} />
        </TabsContent>

        <TabsContent value="estadisticas">
          <EstadisticasCotizaciones
            cotizacionesRecientes={cotizacionesRecientes}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
