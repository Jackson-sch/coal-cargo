import { useState, useEffect } from "react";
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { getClienteByDocumento } from "@/lib/actions/clientes";

export default function RemitenteTab({ form }) {
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [autoRelleno, setAutoRelleno] = useState(false);

  const tipoDocumento = form.watch("remitente.tipoDocumento");
  const numeroDocumento = form.watch("remitente.numeroDocumento");

  const clearRemitenteFields = () => {
    form.setValue("remitente.nombre", "");
    form.setValue("remitente.telefono", "");
    form.setValue("remitente.email", "");
    form.setValue("remitente.direccion", "");
  };

  // Efecto para buscar cliente por documento
  useEffect(() => {
    if (!numeroDocumento || numeroDocumento.length < 8) {
      setClienteEncontrado(null);
      return;
    }

    const clean = numeroDocumento.replace(/\D/g, "");
    if (clean.length < 8) return;

    const handler = setTimeout(async () => {
      try {
        setBuscandoCliente(true);
        const res = await getClienteByDocumento(clean);

        if (res?.success && res.data) {
          setClienteEncontrado(res.data);

          const nombreAutocompletar =
            tipoDocumento === "RUC" ||
            res.data.esEmpresa ||
            !!res.data.razonSocial
              ? res.data.razonSocial || res.data.nombre || ""
              : [res.data.nombre, res.data.apellidos].filter(Boolean).join(" ");

          form.setValue("remitente.nombre", nombreAutocompletar);
          if (res.data.telefono)
            form.setValue("remitente.telefono", res.data.telefono);
          if (res.data.email) form.setValue("remitente.email", res.data.email);
          if (res.data.direccion)
            form.setValue("remitente.direccion", res.data.direccion);

          setAutoRelleno(true);
        } else {
          setClienteEncontrado(null);
          clearRemitenteFields();
          setAutoRelleno(false);
          toast.info(
            "Cliente no encontrado. Complete los datos para registrar automáticamente un nuevo cliente."
          );
        }
      } catch (e) {
        setClienteEncontrado(null);
        clearRemitenteFields();
        setAutoRelleno(false);
      } finally {
        setBuscandoCliente(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [numeroDocumento, tipoDocumento]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <h3 className="font-semibold text-lg">Datos del Remitente</h3>
        </div>
        {numeroDocumento &&
          numeroDocumento.length >= 8 &&
          !clienteEncontrado &&
          !buscandoCliente && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              <User className="h-4 w-4" />
              <span>Se registrará como nuevo cliente</span>
            </div>
          )}
      </div>

      {/* Documento arriba */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="remitente.tipoDocumento"
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
          name="remitente.numeroDocumento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <div className="flex items-center gap-2">
                  <span>Número de documento</span>
                  {buscandoCliente && (
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Buscando...
                    </span>
                  )}
                  {clienteEncontrado && !buscandoCliente && (
                    <span className="text-xs text-green-600 inline-flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Cliente encontrado
                    </span>
                  )}
                </div>
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
                  maxLength={
                    tipoDocumento === "RUC"
                      ? 11
                      : tipoDocumento === "DNI"
                      ? 8
                      : undefined
                  }
                  {...field}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    const limit =
                      tipoDocumento === "RUC"
                        ? 11
                        : tipoDocumento === "DNI"
                        ? 8
                        : digits.length;
                    field.onChange(digits.slice(0, limit));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Nombre y Teléfono */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="remitente.nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="remitente.telefono"
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

      {/* Email y Dirección */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="remitente.email"
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
          name="remitente.direccion"
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
    </div>
  );
}
