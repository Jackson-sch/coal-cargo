"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { getClientesSimple } from "@/lib/actions/clientes";
import {
  User,
  Building2,
  ChevronsUpDown,
  Check,
  Loader2,
  Search,
} from "lucide-react";

function getClienteDisplayName(cliente) {
  if (!cliente) return "";
  if (cliente.esEmpresa && cliente.razonSocial) {
    return cliente.razonSocial;
  }
  const nombre = `${cliente.nombre || ""}`.trim();
  const apellidos = `${cliente.apellidos || ""}`.trim();
  return `${nombre} ${apellidos}`.trim();
}

export default function ClienteAutocomplete({
  onSelect,
  value = null,
  placeholder = "Buscar cliente",
  className,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getClientesSimple();
        if (mounted) {
          if (result?.success) {
            setClientes(result.data || []);
          } else {
            setError(result?.error || "No se pudo cargar clientes");
          }
        }
      } catch (err) {
        if (mounted) setError(err?.message || "Error al cargar clientes");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query) return clientes;
    const q = query.toLowerCase();
    return clientes.filter((c) => {
      const nombre = `${c.nombre || ""} ${c.apellidos || ""}`.toLowerCase();
      const razon = `${c.razonSocial || ""}`.toLowerCase();
      const doc = `${c.numeroDocumento || ""}`.toLowerCase();
      return nombre.includes(q) || razon.includes(q) || doc.includes(q);
    });
  }, [clientes, query]);

  const selectedLabel = value ? getClienteDisplayName(value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={className}
          disabled={disabled}
        >
          {selectedLabel || "Seleccionar cliente"}
          <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[340px]" align="start">
        <Command>
          <div className="px-2 py-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            Buscar por nombre, razón social o documento
          </div>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandGroup>
            {loading && (
              <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No hay resultados
              </div>
            )}
            {!loading &&
              filtered.map((cliente) => (
                <CommandItem
                  key={cliente.id}
                  onSelect={() => {
                    setOpen(false);
                    onSelect?.(cliente);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {cliente.esEmpresa ? (
                      <Building2 className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {getClienteDisplayName(cliente)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {cliente.tipoDocumento}: {cliente.numeroDocumento}
                      </span>
                    </div>
                  </div>
                  {value?.id === cliente.id && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            {error && (
              <div className="px-3 py-2 text-sm text-red-600">{error}</div>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
