import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Package, Info } from "lucide-react";
import { useState } from "react";

export default function PaqueteTab({ form }) {
  const calcularVolumen = () => {
    const alto = form.watch("paquete.alto");
    const ancho = form.watch("paquete.ancho");
    const profundo = form.watch("paquete.profundo");

    if (alto && ancho && profundo) {
      const volumen = (alto * ancho * profundo) / 1000000; // cm³ a m³
      return volumen.toFixed(4);
    }
    return null;
  };

  const [esSobre, setEsSobre] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Package className="h-5 w-5" />
        <h3 className="font-semibold text-lg">Información del Paquete</h3>
      </div>

      {/* Toggle: Es sobre de documentos */}
      <div className="flex items-center gap-3">
        <Switch
          checked={esSobre}
          onCheckedChange={(checked) => {
            setEsSobre(checked);
            if (checked) {
              try {
                form.setValue("paquete.peso", 0.1, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                form.setValue("paquete.alto", undefined);
                form.setValue("paquete.ancho", undefined);
                form.setValue("paquete.profundo", undefined);
              } catch (_) {}
            }
          }}
        />
        <span className="text-sm">Es sobre de documentos</span>
      </div>

      {esSobre && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-amber-600" />
            <span className="text-amber-800">
              Se factura mínimo 1 kg; para sobres no se requieren dimensiones.
            </span>
          </div>
        </div>
      )}

      {/* Peso (obligatorio) */}
      <FormField
        control={form.control}
        name="paquete.peso"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Peso (kg) *</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder="5.5"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Dimensiones */}
      {!esSobre && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="paquete.alto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alto (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="30"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paquete.ancho"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ancho (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="20"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paquete.profundo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profundo (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="15"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {/* Volumen calculado */}
      {calcularVolumen() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-blue-800">
              Volumen calculado: <strong>{calcularVolumen()} m³</strong>
            </span>
          </div>
        </div>
      )}

      {/* Descripción del contenido */}
      <FormField
        control={form.control}
        name="paquete.descripcion"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción del contenido</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Ej: Documentos, ropa, electrónicos (no frágiles)"
                rows={3}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Valor declarado y seguro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="paquete.valorDeclarado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor declarado (S/)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paquete.requiereSeguro"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 mt-8">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="text-sm font-normal">
                Requiere seguro adicional
              </FormLabel>
            </FormItem>
          )}
        />
      </div>

      {/* Advertencia sobre artículos prohibidos */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-2">
          <Info className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Artículos prohibidos:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Sustancias peligrosas o inflamables</li>
              <li>Armas o explosivos</li>
              <li>Drogas ilegales</li>
              <li>Dinero en efectivo (solo transferencias)</li>
              <li>Animales vivos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
