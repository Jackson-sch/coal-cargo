"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, Search, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PagosFiltros({
  busqueda,
  setBusqueda,
  setPage,
  estado,
  setEstado,
  estadosPago,
  metodo,
  setMetodo,
  metodosPago,
  conSaldo,
  setConSaldo,
}) {
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (busqueda) count++;
    if (estado) count++;
    if (metodo) count++;
    if (conSaldo) count++;
    return count;
  }, [busqueda, estado, metodo, conSaldo]);

  const handleClearAll = () => {
    setEstado(null);
    setMetodo(null);
    setBusqueda(null);
    setConSaldo(null);
    setPage(1);
  };

  return (
    <>
    {/* Estado select - Ocupa 1 columna */}
    <div className="col-span-1 space-y-2">
      <Label htmlFor="estado" className="text-sm font-medium">
        Estado
      </Label>
      <Select
        value={estado || "ALL"}
        onValueChange={(value) => {
          setEstado(value === "ALL" ? null : value);
          setPage(1);
        }}
      >
        <SelectTrigger id="estado" className="w-full">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          {estadosPago?.map((estadoItem) => (
            <SelectItem key={estadoItem.value} value={estadoItem.value}>
              {estadoItem.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Método select - Ocupa 1 columna */}
    <div className="col-span-1 space-y-2">
      <Label htmlFor="metodo" className="text-sm font-medium">
        Método
      </Label>
      <Select
        value={metodo || "ALL"}
        onValueChange={(value) => {
          setMetodo(value === "ALL" ? null : value);
          setPage(1);
        }}
      >
        <SelectTrigger id="metodo" className="w-full">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          {metodosPago?.map((metodoItem) => (
            <SelectItem key={metodoItem.value} value={metodoItem.value}>
              {metodoItem.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Buttons - Ocupa 1 columna */}
    <div className="col-span-1 flex gap-2 items-end">
      <Button
        variant={activeFiltersCount > 0 ? "destructive" : "outline"}
        onClick={handleClearAll}
        disabled={activeFiltersCount === 0}
        className="flex-1"
      >
        <X className="h-4 w-4 mr-1" />
        Limpiar
      </Button>
    </div>
  </>
  );
}
