"use client";

import * as React from "react";
import { ChevronsUpDown, Building2 } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function SucursalSwitcher({ teams: sucursales }) {
  const { data: session } = useSession();
  const { isMobile } = useSidebar();

  // Encontrar la sucursal activa (la primera con isActive: true o la primera)
  const activeSucursal = React.useMemo(() => {
    return sucursales.find((s) => s.isActive) || sucursales[0];
  }, [sucursales]);

  const [selectedSucursal, setSelectedSucursal] =
    React.useState(activeSucursal);

  // Actualizar cuando cambie la sucursal activa
  React.useEffect(() => {
    if (activeSucursal) {
      setSelectedSucursal(activeSucursal);
    }
  }, [activeSucursal]);

  if (!selectedSucursal) {
    return null;
  }

  const handleSucursalChange = (sucursal) => {
    setSelectedSucursal(sucursal);
    // TODO: Implementar cambio de contexto de sucursal
    // Esto se implementará en la siguiente fase
    if (sucursal.sucursalId && session?.user?.role === "SUPER_ADMIN") {
      // Aquí se implementará la lógica para cambiar el contexto
    }
  };

  // Solo mostrar dropdown si es SUPER_ADMIN y hay múltiples sucursales
  const showDropdown =
    session?.user?.role === "SUPER_ADMIN" && sucursales.length > 1;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {showDropdown ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <selectedSucursal.logo className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {selectedSucursal.name}
                  </span>
                  <span className="truncate text-xs">
                    {selectedSucursal.plan}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Sucursales
              </DropdownMenuLabel>
              {sucursales.map((sucursal, index) => (
                <DropdownMenuItem
                  key={sucursal.name}
                  onClick={() => handleSucursalChange(sucursal)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <sucursal.logo className="size-3.5 shrink-0" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm">{sucursal.name}</span>
                    {sucursal.isActive && (
                      <span className="text-xs text-muted-foreground">
                        Actual
                      </span>
                    )}
                  </div>
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 p-2" disabled>
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Building2 className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium text-xs">
                  Cambio de contexto próximamente
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Para usuarios no SUPER_ADMIN o cuando solo hay una sucursal
          <SidebarMenuButton size="lg" className="cursor-default">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <selectedSucursal.logo className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {selectedSucursal.name}
              </span>
              <span className="truncate text-xs">{selectedSucursal.plan}</span>
            </div>
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
