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
import { User, Loader2, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getClienteByDocumento } from "@/lib/actions/clientes";
export default function RecojoTab({ form }) {
  const tipoDocumento = form.watch("responsableRecojo.tipoDocumento");
  const numeroDocumento = form.watch("responsableRecojo.numeroDocumento");
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [autoRelleno, setAutoRelleno] = useState(false);
  const clearRecojoFields = () => {
    form.setValue("responsableRecojo.nombre", "");
    form.setValue("responsableRecojo.apellidos", "");
    form.setValue("responsableRecojo.telefono", "");
    form.setValue("responsableRecojo.email", "");
    form.setValue("responsableRecojo.direccion", "");
    form.setValue("responsableRecojo.empresa", "");
  };
  useEffect(() => {
    if (!numeroDocumento) {
      if (clienteEncontrado || autoRelleno) {
        clearRecojoFields();
      }
      setClienteEncontrado(null);
      setAutoRelleno(false);
      return;
    }

    const clean = String(numeroDocumento).replace(/\D/g, "");
    const expectedLength = tipoDocumento === "RUC" ? 11 : 8;
    if (clean.length < expectedLength) {
      if (clienteEncontrado || autoRelleno) {
        clearRecojoFields();
      }
      setClienteEncontrado(null);
      setAutoRelleno(false);
      return;
    }

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
              : [res.data.nombre, res.data.apellidos].filter(Boolean).join(" "); // Para RUC, suele ser empresa; colocamos en empresa y nombr e
          form.setValue("responsableRecojo.nombre", nombreAutocompletar);
          if (!res.data.esEmpresa && res.data.apellidos) {
            form.setValue("responsableRecojo.apellidos", res.data.apellidos);
          }
          if (res.data.telefono)
            form.setValue("responsableRecojo.telefono", res.data.telefono);
          if (res.data.email)
            form.setValue("responsableRecojo.email", res.data.email);
          if (res.data.direccion)
            form.setValue("responsableRecojo.direccion", res.data.direccion);
          if (res.data.razonSocial)
            form.setValue("responsableRecojo.empresa", res.data.razonSocial);
          setAutoRelleno(true);
        } else {
          setClienteEncontrado(null);
          clearRecojoFields();
          setAutoRelleno(false);
          toast.info(
            "Documento no encontrado. Complete datos para el responsable de recojo."
          );
        }
      } catch (e) {
        setClienteEncontrado(null);
        clearRecojoFields();
        setAutoRelleno(false);
      } finally {
        setBuscandoCliente(false);
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [numeroDocumento, tipoDocumento]);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <User className="h-5 w-5" />
        <h3 className="font-semibold text-lg">Responsable de Recojo</h3>
      </div>
      {/* Documento arriba */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="responsableRecojo.tipoDocumento"
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
          name="responsableRecojo.numeroDocumento"
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
      {/* Nombre y Apellidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="responsableRecojo.nombre"
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
          name="responsableRecojo.apellidos"
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
      {/* Contacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="responsableRecojo.telefono"
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
        <FormField
          control={form.control}
          name="responsableRecojo.email"
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
      </div>
      {/* Dirección */}
      <FormField
        control={form.control}
        name="responsableRecojo.direccion"
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
      {/* Empresa y cargo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="responsableRecojo.empresa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empresa</FormLabel>
              <FormControl>
                <Input placeholder="Empresa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="responsableRecojo.cargo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <FormControl>
                <Input placeholder="Cargo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
