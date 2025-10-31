"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import envioSchema from "@/lib/schemas/envio.schema";

/**
 * Hook para inicializar y manejar el formulario de Envíos (v2)
 * - Usa zod para validaciones
 * - Carga sucursales desde server action
 * - Sincroniza switches de inclusión con el estado local
 */
export function useEnvioForm(cotizacion = null) {
  const [incluirRemitente, setIncluirRemitente] = useState(false);
  const [incluirResponsableRecojo, setIncluirResponsableRecojo] =
    useState(false);
  const [incluirClienteFacturacion, setIncluirClienteFacturacion] =
    useState(false);
  const [sucursales, setSucursales] = useState([]);

  const form = useForm({
    // resolver: zodResolver(envioSchema), // Temporalmente deshabilitado para debug
    defaultValues: {
      destinatario: {
        nombre: cotizacion?.nombreCliente || "",
        telefono: cotizacion?.telefonoCliente || "",
        email: cotizacion?.emailCliente || "",
        direccion: cotizacion?.direccionEntrega || "",
        tipoDocumento: "DNI",
        numeroDocumento: "",
      },
      paquete: {
        peso: cotizacion?.peso || 1,
        alto: cotizacion?.alto || undefined,
        ancho: cotizacion?.ancho || undefined,
        profundo: cotizacion?.profundo || undefined,
        descripcion: cotizacion?.contenido || "",
        valorDeclarado: cotizacion?.valorDeclarado || undefined,
        requiereSeguro: false,
      },
      remitente: {
        nombre: "",
        telefono: "",
        email: "",
        direccion: "",
        tipoDocumento: "DNI",
        numeroDocumento: "",
      },
      responsableRecojo: {
        personaContactoId: undefined,
        nombre: "",
        apellidos: "",
        tipoDocumento: "DNI",
        numeroDocumento: "",
        telefono: "",
        email: "",
        direccion: "",
        empresa: "",
        cargo: "",
      },
      clienteFacturacion: {
        clienteId: undefined,
        esEmpresa: false,
        nombre: "",
        apellidos: "",
        razonSocial: "",
        tipoDocumento: "DNI",
        numeroDocumento: "",
        ruc: "",
        direccion: "",
        email: "",
        telefono: "",
      },
      quienPaga: "REMITENTE",
      facturarA: "DESTINATARIO",
      tipoServicio: cotizacion?.tipoServicio || "NORMAL",
      modalidad: cotizacion?.modalidad || "SUCURSAL_SUCURSAL",
      sucursalOrigenId: cotizacion?.sucursalOrigenId || "",
      sucursalDestinoId: cotizacion?.sucursalDestinoId || "",
      direccionEntrega: cotizacion?.direccionEntrega || "",
      distritoEntregaId: cotizacion?.distritoEntregaId || "",
      instruccionesEspeciales: "",
      requiereConfirmacion: false,
      incluirRemitente: false,
      incluirResponsableRecojo: false,
      incluirClienteFacturacion: false,
    },
  });

  // Cargar sucursales desde server action (import dinámico para evitar bundling)
  useEffect(() => {
    const loadSucursales = async () => {
      try {
        const { getSucursales } = await import("@/lib/actions/sucursales");
        const result = await getSucursales();
        if (result.success) {
          setSucursales(result.data);
        }
      } catch (error) {}
    };
    loadSucursales();
  }, []);

  // Sincronizar switches con el form
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "incluirRemitente") {
        setIncluirRemitente(!!value.incluirRemitente);
      }
      if (name === "incluirResponsableRecojo") {
        setIncluirResponsableRecojo(!!value.incluirResponsableRecojo);
      }
      if (name === "incluirClienteFacturacion") {
        setIncluirClienteFacturacion(!!value.incluirClienteFacturacion);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return {
    form,
    sucursales,
    incluirRemitente,
    incluirResponsableRecojo,
    incluirClienteFacturacion,
    setIncluirRemitente,
    setIncluirResponsableRecojo,
    setIncluirClienteFacturacion,
  };
}

export default useEnvioForm;
