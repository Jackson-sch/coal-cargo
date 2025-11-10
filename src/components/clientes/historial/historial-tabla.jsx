"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import HistorialRow from "./historial-row";
import HistorialEmptyState from "./historial-empty-state";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Paginator from "@/components/ui/paginator";

export default function HistorialTabla({
  data,
  totalItems,
  currentPage,
  totalPages,
  onView,
  onPageChange,
  isPending,
  filtros,
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Historial de Actividad</CardTitle>
            <CardDescription className="text-xs mt-1">
              Mostrando {data.length} de {totalItems} registros
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <HistorialEmptyState />
        ) : (
          <>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Tipo</TableHead>
                    <TableHead className="w-[150px]">Fecha</TableHead>
                    <TableHead className="w-[120px]">Identificador</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-[120px]">Estado</TableHead>
                    <TableHead className="w-[120px]">Monto</TableHead>
                    <TableHead className="w-[80px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <HistorialRow
                      key={`${item.tipo}-${item.id}`}
                      item={item}
                      onView={onView}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4">
                <Paginator
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => onPageChange({ ...filtros, page })}
                  limit={filtros.limit || 10}
                  total={totalItems}
                  entityLabel="registros"
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

