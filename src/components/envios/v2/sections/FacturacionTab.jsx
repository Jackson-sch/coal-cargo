import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Building, Loader2, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getClienteByDocumento } from "@/lib/actions/clientes";
import { validarDocumentoPeruano } from "@/lib/utils/documentos";
export default function FacturacionTab({ form }) {
  const esEmpresa = form.watch("clienteFacturacion.esEmpresa");
  const tipoDocumento = form.watch("clienteFacturacion.tipoDocumento");
  const numeroDocumento = form.watch("clienteFacturacion.numeroDocumento");
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [autoRelleno, setAutoRelleno] = useState(false);
  const clearFactFields = () => {
    form.setValue("clienteFacturacion.nombre", "");
    form.setValue("clienteFacturacion.apellidos", "");
    form.setValue("clienteFacturacion.razonSocial", "");
    form.setValue("clienteFacturacion.ruc", "");
    form.setValue("clienteFacturacion.email", "");
    form.setValue("clienteFacturacion.telefono", "");
    form.setValue("clienteFacturacion.direccion", "");
  };
  useEffect(() => {
    // Sincroniza esEmpresa con el tipo de document o
    const isEmpresaDoc = tipoDocumento === "RUC";
    if (isEmpresaDoc !== !!esEmpresa) {
      form.setValue("clienteFacturacion.esEmpresa", isEmpresaDoc);
    }
  }, [tipoDocumento]);
  const rucValue = form.watch("clienteFacturacion.ruc");
  useEffect(() => {
    if (!numeroDocumento) {
      if (clienteEncontrado || autoRelleno) {
        clearFactFields();
      }
      setClienteEncontrado(null);
      setAutoRelleno(false);
      form.clearErrors?.("clienteFacturacion.numeroDocumento");
      return;
    }

    const clean = String(numeroDocumento).replace(/\D/g, "");
    const expectedLength = tipoDocumento === "RUC" || esEmpresa ? 11 : 8;
    if (clean.length < expectedLength) {
      if (clienteEncontrado || autoRelleno) {
        clearFactFields();
      }
      setClienteEncontrado(null);
      setAutoRelleno(false);
      form.clearErrors?.("clienteFacturacion.numeroDocumento");
      return;
    }

    const tipo = tipoDocumento === "RUC" || esEmpresa ? "RUC" : "DNI";
    if (!validarDocumentoPeruano(tipo, clean)) {
      setClienteEncontrado(null);
      clearFactFields();
      setAutoRelleno(false);
      const msg =
        tipo === "RUC"
          ? "RUC inválido: debe ser un RUC válido de 11 dígitos"
          : "DNI inválido: debe ser un DNI válido de 8 dígitos";
      form.setError?.("clienteFacturacion.numeroDocumento", {
        type: "manual",
        message: msg,
      });
      toast.error(msg);
      return;
    } else {
      form.clearErrors?.("clienteFacturacion.numeroDocumento");
    }

    const handler = setTimeout(async () => {
      try {
        setBuscandoCliente(true);
        const res = await getClienteByDocumento(clean);
        if (res?.success && res.data) {
          setClienteEncontrado(res.data);
          if (
            tipoDocumento === "RUC" ||
            esEmpresa ||
            res.data.esEmpresa ||
            res.data.razonSocial
          ) {
            const razon = res.data.razonSocial || res.data.nombre || "";
            form.setValue("clienteFacturacion.esEmpresa", true);
            form.setValue("clienteFacturacion.razonSocial", razon);
            form.setValue("clienteFacturacion.ruc", clean);
          } else {
            form.setValue("clienteFacturacion.nombre", res.data.nombre || "");
            form.setValue(
              "clienteFacturacion.apellidos",
              res.data.apellidos || ""
            );
          }

          if (res.data.email)
            form.setValue("clienteFacturacion.email", res.data.email);
          if (res.data.telefono)
            form.setValue("clienteFacturacion.telefono", res.data.telefono);
          if (res.data.direccion)
            form.setValue("clienteFacturacion.direccion", res.data.direccion);
          setAutoRelleno(true);
        } else {
          setClienteEncontrado(null);
          clearFactFields();
          setAutoRelleno(false);
          toast.info(
            "Documento no encontrado. Complete datos del cliente de facturación."
          );
        }
      } catch (e) {
        setClienteEncontrado(null);
        clearFactFields();
        setAutoRelleno(false);
      } finally {
        setBuscandoCliente(false);
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [numeroDocumento, tipoDocumento, esEmpresa]);
  useEffect(() => {
    if (!esEmpresa) {
      form.clearErrors?.("clienteFacturacion.ruc");
      return;
    }
    const cleanRuc = String(rucValue || "").replace(/\D/g, "");
    if (!cleanRuc) {
      form.clearErrors?.("clienteFacturacion.ruc");
      return;
    }
    if (cleanRuc.length < 11) {
      // no mostrar error mientras escrib e
      return;
    }
    if (!validarDocumentoPeruano("RUC", cleanRuc)) {
      const msg = "RUC inválido: debe ser un RUC válido de 11 dígitos";
      form.setError?.("clienteFacturacion.ruc", {
        type: "manual",
        message: msg,
      });
      toast.error(msg);
    } else {
      form.clearErrors?.("clienteFacturacion.ruc");
    }
  }, [rucValue, esEmpresa]);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Building className="h-5 w-5" />
        <h3 className="font-semibold text-lg">Cliente de Facturación</h3>
      </div>
      {/* Documento arriba */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="clienteFacturacion.tipoDocumento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de documento</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">DNI</SelectItem>
                    <SelectItem value="RUC">RUC</SelectItem>
                    <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                    <SelectItem value="CARNET_EXTRANJERIA">
                      Carnet de Extranjería
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="clienteFacturacion.numeroDocumento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Número de documento
                {buscandoCliente && (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1 ml-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Buscando...
                  </span>
                )}
                {clienteEncontrado && !buscandoCliente && (
                  <span className="text-xs text-green-600 inline-flex items-center gap-1 ml-2">
                    <CheckCircle className="h-3 w-3" /> Cliente encontrado
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    tipoDocumento === "RUC" ? "20123456789" : "12345678"
                  }
                  className={
                    clienteEncontrado ? "border-green-500 bg-green-50" : ""
                  }
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={tipoDocumento === "RUC" || esEmpresa ? 11 : 8}
                  {...field}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    const limit = tipoDocumento === "RUC" || esEmpresa ? 11 : 8;
                    field.onChange(digits.slice(0, limit));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {/* Toggle empresa */}
      <FormField
        control={form.control}
        name="clienteFacturacion.esEmpresa"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3">
            <FormControl>
              <Switch
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel className="text-sm font-normal">Es empresa</FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />
      {esEmpresa ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="clienteFacturacion.razonSocial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razón Social</FormLabel>
                <FormControl>
                  <Input placeholder="Razón Social" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clienteFacturacion.ruc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RUC</FormLabel>
                <FormControl>
                  <Input
                    placeholder="11 dígitos"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={11}
                    {...field}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      field.onChange(digits.slice(0, 11));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="clienteFacturacion.nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clienteFacturacion.apellidos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellidos</FormLabel>
                <FormControl>
                  <Input placeholder="Apellidos" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="clienteFacturacion.email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="correo@dominio.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="clienteFacturacion.telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="9XXXXXXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="clienteFacturacion.direccion"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dirección</FormLabel>
            <FormControl>
              <Input placeholder="Calle y número" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
