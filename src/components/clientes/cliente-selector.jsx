"use client";

import { useState } from "react";
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
import { Search, User, Building2 } from "lucide-react";

export default function ClienteSelector({ clientes, title, description }) {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const filteredClientes = clientes.filter((cliente) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cliente.nombre?.toLowerCase().includes(searchLower) ||
      cliente.apellidos?.toLowerCase().includes(searchLower) ||
      cliente.numeroDocumento?.toLowerCase().includes(searchLower) ||
      cliente.email?.toLowerCase().includes(searchLower) ||
      cliente.razonSocial?.toLowerCase().includes(searchLower)
    );
  });

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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Cliente</CardTitle>
          <CardDescription>
            Busca y selecciona un cliente para ver su historial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, documento, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredClientes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm
                  ? "No se encontraron clientes"
                  : "No hay clientes disponibles"}
              </div>
            ) : (
              filteredClientes.map((cliente) => (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleSelectCliente(cliente.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {cliente.esEmpresa ? (
                        <Building2 className="h-8 w-8 text-blue-500" />
                      ) : (
                        <User className="h-8 w-8 text-green-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {getClienteDisplayName(cliente)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {cliente.tipoDocumento}: {cliente.numeroDocumento}
                      </div>
                      {cliente.email && (
                        <div className="text-sm text-muted-foreground">
                          {cliente.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={cliente.esEmpresa ? "default" : "secondary"}
                    >
                      {cliente.esEmpresa ? "Empresa" : "Persona"}
                    </Badge>
                    <Button size="sm" variant="outline">
                      Ver Historial
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
