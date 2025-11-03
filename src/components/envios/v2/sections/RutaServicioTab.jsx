import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MapPin, Truck, Home, Info } from "lucide-react";

export default function RutaServicioTab({ form, sucursales = [] }) {
  const modalidad = form.watch("modalidad");
  const requiereDireccion =
    modalidad === "SUCURSAL_DOMICILIO" || modalidad === "DOMICILIO_DOMICILIO";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <MapPin className="h-5 w-5" />
        <h3 className="font-semibold text-lg">Ruta y Servicio</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="tipoServicio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de servicio</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="EXPRESS">Express</SelectItem>
                    <SelectItem value="OVERNIGHT">Overnight</SelectItem>
                    <SelectItem value="ECONOMICO">Económico</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="modalidad"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modalidad</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona modalidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUCURSAL_SUCURSAL">
                      Sucursal → Sucursal
                    </SelectItem>
                    <SelectItem value="SUCURSAL_DOMICILIO">
                      Sucursal → Domicilio
                    </SelectItem>
                    <SelectItem value="DOMICILIO_SUCURSAL">
                      Domicilio → Sucursal
                    </SelectItem>
                    <SelectItem value="DOMICILIO_DOMICILIO">
                      Domicilio → Domicilio
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="sucursalOrigenId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sucursal Origen</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sucursalDestinoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sucursal Destino</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Campos de dirección trasladados al paso Destinatario */}
      {/* Campo de instrucciones trasladado al paso Destinatario */}

      <FormField
        control={form.control}
        name="requiereConfirmacion"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                Requiere confirmación al entregar
              </FormLabel>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
