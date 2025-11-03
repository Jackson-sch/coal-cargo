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
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { getClienteByDocumento } from "@/lib/actions/clientes";

export default function DestinatarioTab({ form }) {
  const modalidad = form.watch("modalidad");
  const requiereDireccionEntrega =
    modalidad === "SUCURSAL_DOMICILIO" || modalidad === "DOMICILIO_DOMICILIO";

  const tipoDocumento = form.watch("destinatario.tipoDocumento");
  const numeroDocumento = form.watch("destinatario.numeroDocumento");

  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [autoRelleno, setAutoRelleno] = useState(false);

  const clearDestinatarioFields = () => {
    form.setValue("destinatario.nombre", "");
    form.setValue("destinatario.telefono", "");
    form.setValue("destinatario.email", "");
    form.setValue("destinatario.direccion", "");
  };

  // Ubigeo: Departamento/Provincia/Distrito
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [selectedDepartamento, setSelectedDepartamento] = useState(undefined);
  const [selectedProvincia, setSelectedProvincia] = useState(undefined);

  const fetchDepartamentos = useCallback(async () => {
    try {
      const { getDepartamentos } = await import("@/lib/actions/ubicaciones");
      const result = await getDepartamentos();
      if (result.success) {
        setDepartamentos(result.data);
      }
    } catch (error) {}
  }, []);

  const fetchProvincias = useCallback(async (departamentoId) => {
    try {
      const { getProvincias } = await import("@/lib/actions/ubicaciones");
      const result = await getProvincias(departamentoId);
      if (result.success) {
        setProvincias(result.data);
        return result.data;
      }
    } catch (error) {}
    return [];
  }, []);

  const fetchDistritos = useCallback(async (provinciaId) => {
    try {
      const { getDistritos } = await import("@/lib/actions/ubicaciones");
      const result = await getDistritos(provinciaId);
      if (result.success) {
        setDistritos(result.data);
        return result.data;
      }
    } catch (error) {}
    return [];
  }, []);

  useEffect(() => {
    fetchDepartamentos();
  }, [fetchDepartamentos]);

  const handleDepartamentoChange = async (value) => {
    setSelectedDepartamento(value);
    setSelectedProvincia(undefined);
    setProvincias([]);
    setDistritos([]);
    form.setValue("distritoEntregaId", "");
    if (value) {
      await fetchProvincias(value);
    }
  };

  const handleProvinciaChange = async (value) => {
    setSelectedProvincia(value);
    setDistritos([]);
    form.setValue("distritoEntregaId", "");
    if (value) {
      await fetchDistritos(value);
    }
  };

  useEffect(() => {
    const isEmpresa = tipoDocumento === "RUC";
    form.setValue("incluirResponsableRecojo", isEmpresa);
    if (isEmpresa) {
      const nombreEmpresa = form.getValues("destinatario.nombre");
      if (nombreEmpresa) {
        form.setValue("responsableRecojo.empresa", nombreEmpresa);
      }
    }
  }, [tipoDocumento, form]);

  useEffect(() => {
    if (!numeroDocumento) {
      if (clienteEncontrado || autoRelleno) {
        clearDestinatarioFields();
      }
      setClienteEncontrado(null);
      setAutoRelleno(false);
      return;
    }

    const clean = String(numeroDocumento).replace(/\D/g, "");
    const expectedLength = tipoDocumento === "RUC" ? 11 : 8;

    if (clean.length < expectedLength) {
      if (clienteEncontrado || autoRelleno) {
        clearDestinatarioFields();
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
              : [res.data.nombre, res.data.apellidos].filter(Boolean).join(" ");

          form.setValue("destinatario.nombre", nombreAutocompletar);
          if (res.data.telefono)
            form.setValue("destinatario.telefono", res.data.telefono);
          if (res.data.email)
            form.setValue("destinatario.email", res.data.email);
          if (res.data.direccion)
            form.setValue("destinatario.direccion", res.data.direccion);

          if (
            tipoDocumento === "RUC" ||
            res.data.esEmpresa ||
            !!res.data.razonSocial
          ) {
            form.setValue("incluirResponsableRecojo", true);
            form.setValue(
              "responsableRecojo.empresa",
              res.data.razonSocial || nombreAutocompletar
            );
          }

          setAutoRelleno(true);
        } else {
          setClienteEncontrado(null);
          clearDestinatarioFields();
          setAutoRelleno(false);
          toast.info(
            "Documento no encontrado. Complete datos para registrar nuevo cliente."
          );
        }
      } catch (e) {
        setClienteEncontrado(null);
        clearDestinatarioFields();
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
        <h3 className="font-semibold text-lg">Datos del Destinatario</h3>
      </div>

      {/* Documento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="destinatario.tipoDocumento"
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
          name="destinatario.numeroDocumento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Número de documento
                {buscandoCliente && (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1 ml-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Buscando...
                  </span>
                )}
                {clienteEncontrado && !buscandoCliente && (
                  <span className="text-xs text-green-600 inline-flex items-center gap-1 ml-2">
                    <CheckCircle className="h-3 w-3" />
                    Cliente encontrado
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

      {/* Nombre y Teléfono */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="destinatario.nombre"
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
          name="destinatario.telefono"
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
          name="destinatario.email"
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
          name="destinatario.direccion"
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

      {/* Instrucciones especiales */}
      <FormField
        control={form.control}
        name="instruccionesEspeciales"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Instrucciones especiales</FormLabel>
            <FormControl>
              <Input
                placeholder="Indicaciones para entrega, referencia, etc"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Dirección de entrega (si aplica) */}
      {requiereDireccionEntrega && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="direccionEntrega"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección de entrega</FormLabel>
                <FormControl>
                  <Input placeholder="Calle, número, referencia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Departamento */}
          <FormItem>
            <FormLabel>Departamento</FormLabel>
            <Select
              value={selectedDepartamento}
              onValueChange={handleDepartamentoChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona departamento" />
              </SelectTrigger>
              <SelectContent>
                {departamentos.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>

          {/* Provincia */}
          <FormItem>
            <FormLabel>Provincia</FormLabel>
            <Select
              value={selectedProvincia}
              onValueChange={handleProvinciaChange}
              disabled={!selectedDepartamento}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona provincia" />
              </SelectTrigger>
              <SelectContent>
                {provincias.map((prov) => (
                  <SelectItem key={prov.id} value={prov.id}>
                    {prov.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>

          {/* Distrito */}
          <FormField
            control={form.control}
            name="distritoEntregaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distrito de entrega</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedProvincia}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona distrito" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {distritos.map((dist) => (
                      <SelectItem key={dist.id} value={dist.id}>
                        {dist.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}
