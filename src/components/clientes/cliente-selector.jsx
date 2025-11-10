"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Building2,
  ChevronRight,
  X,
  Users,
  Loader2,
} from "lucide-react";
import { getClientesSimple } from "@/lib/actions/clientes";

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

export default function ClienteSelector({ title, description }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Debounce de la búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Buscar clientes cuando cambia el término de búsqueda
  useEffect(() => {
    let mounted = true;

    const fetchClientes = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getClientesSimple(debouncedSearchTerm || "", 100);

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

    fetchClientes();

    return () => {
      mounted = false;
    };
  }, [debouncedSearchTerm]);

  const handleSelectCliente = (clienteId) => {
    router.push(`/dashboard/clientes/historial?clienteId=${clienteId}`);
  };

  const getClienteDisplayName = (cliente) => {
    if (cliente.esEmpresa && cliente.razonSocial) {
      return cliente.razonSocial;
    }
    return `${cliente.nombre} ${cliente.apellidos}`.trim();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-balance text-3xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      {/* Main Card */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Seleccionar Cliente</CardTitle>
              <CardDescription className="mt-1">
                Busca y selecciona un cliente para ver su historial de envíos
              </CardDescription>
            </div>
            {loading && (
              <Badge variant="outline" className="ml-2 whitespace-nowrap">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Buscando...
              </Badge>
            )}
            {!loading && searchTerm && clientes.length > 0 && (
              <Badge variant="outline" className="ml-2 whitespace-nowrap">
                {clientes.length} resultado
                {clientes.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Buscar por nombre, empresa, documento o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-10 h-11 text-base border-2 border-transparent hover:border-border focus:border-primary transition-all"
                aria-label="Buscar clientes"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-12 w-12 text-muted-foreground/30 mb-3 animate-spin" />
                <p className="font-medium text-muted-foreground">
                  Buscando clientes...
                </p>
              </div>
            )}

            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <X className="h-12 w-12 text-red-500/30 mb-3" />
                <p className="font-medium text-red-600">{error}</p>
              </div>
            )}

            {!loading && !error && clientes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                {searchTerm ? (
                  <>
                    <Search className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="font-medium text-muted-foreground">
                      No se encontraron clientes
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Intenta con otro término de búsqueda
                    </p>
                  </>
                ) : (
                  <>
                    <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="font-medium text-muted-foreground">
                      Escribe para buscar clientes
                    </p>
                  </>
                )}
              </div>
            )}

            {!loading &&
              !error &&
              clientes.length > 0 &&
              clientes.map((cliente, index) => (
                <div
                  key={cliente.id}
                  className="group p-4 border rounded-lg hover:border-primary hover:bg-muted/50 cursor-pointer transition-all duration-200 active:scale-[0.98]"
                  onClick={() => handleSelectCliente(cliente.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleSelectCliente(cliente.id);
                    }
                  }}
                  aria-label={`Seleccionar cliente ${getClienteDisplayName(
                    cliente
                  )}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side - Icon and info */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="shrink-0 mt-1">
                        {cliente.esEmpresa ? (
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <User className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">
                            {getClienteDisplayName(cliente)}
                          </h3>
                          <Badge
                            variant={
                              cliente.esEmpresa ? "default" : "secondary"
                            }
                            className="shrink-0 text-xs"
                          >
                            {cliente.esEmpresa ? "Empresa" : "Persona"}
                          </Badge>
                        </div>

                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">
                              {cliente.tipoDocumento}:
                            </span>{" "}
                            {cliente.numeroDocumento}
                          </p>
                          {cliente.email && (
                            <p className="text-sm text-muted-foreground truncate">
                              {cliente.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side - Action button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCliente(cliente.id);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>

          {!loading && !error && clientes.length > 0 && (
            <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
              {searchTerm
                ? `Mostrando ${clientes.length} resultado${
                    clientes.length !== 1 ? "s" : ""
                  }`
                : `Mostrando ${clientes.length} cliente${
                    clientes.length !== 1 ? "s" : ""
                  }`}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
