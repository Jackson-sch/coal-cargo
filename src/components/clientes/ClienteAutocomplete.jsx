"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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

// Hook para debounce
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
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

  // Debounce de la búsqueda
  const debouncedQuery = useDebounce(query, 300);

  // Buscar clientes cuando cambia el query o se abre el popover
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Si no hay query, mostrar algunos clientes recientes (opcional)
        // Si hay query, buscar con filtro
        const result = await getClientesSimple(debouncedQuery || "", 50);

        if (mounted) {
          if (result?.success) {
            setClientes(result.data || []);
          } else {
            setError(result?.error || "No se pudo cargar clientes");
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err?.message || "Error al cargar clientes");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Solo buscar cuando el popover está abierto
    if (open) {
      fetchData();
    }

    return () => {
      mounted = false;
    };
  }, [debouncedQuery, open]);

  // Cargar cliente seleccionado cuando se proporciona un value
  useEffect(() => {
    if (value && !clientes.find((c) => c.id === value.id)) {
      // Si el cliente seleccionado no está en la lista, agregarlo
      setClientes((prev) => [value, ...prev]);
    }
  }, [value, clientes]);

  const selectedLabel = value ? getClienteDisplayName(value) : null;

  // Limpiar query cuando se cierra el popover
  const handleOpenChange = useCallback((newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      setQuery("");
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={className}
          disabled={disabled}
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[340px]" align="start">
        <Command shouldFilter={false}>
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
                Buscando clientes...
              </div>
            )}
            {!loading && clientes.length === 0 && !error && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {query
                  ? "No se encontraron clientes"
                  : "Escribe para buscar clientes"}
              </div>
            )}
            {!loading &&
              clientes.map((cliente) => (
                <CommandItem
                  key={cliente.id}
                  value={`${cliente.id}-${getClienteDisplayName(cliente)}`}
                  onSelect={() => {
                    setOpen(false);
                    onSelect?.(cliente);
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {cliente.esEmpresa ? (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="flex flex-col flex-1">
                      <span className="font-medium">
                        {getClienteDisplayName(cliente)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {cliente.tipoDocumento}: {cliente.numeroDocumento}
                      </span>
                    </div>
                  </div>
                  {value?.id === cliente.id && (
                    <Check className="ml-2 h-4 w-4" />
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
