"use client";

import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({ items }) {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState(new Set());

  // Función para determinar si un item está activo
  const isItemActive = (item) => {
    // Si la ruta actual coincide exactamente con la URL del item
    if (pathname === item.url) return true;

    // Para dashboard, solo activo si estamos exactamente en /dashboard o sus subrutas directas
    if (item.title === "Dashboard") {
      return (
        pathname === "/dashboard" ||
        (item.items && item.items.some((subItem) => pathname === subItem.url))
      );
    }

    // Si la ruta actual está dentro de la sección del item
    if (item.url !== "/dashboard" && pathname.startsWith(item.url)) return true;

    // Lógica especial para detectar si algún subitem está activo
    if (item.items) {
      return item.items.some(
        (subItem) =>
          pathname === subItem.url || pathname.startsWith(subItem.url + "/")
      );
    }

    return false;
  };

  // Función para determinar si un subitem está activo
  const isSubItemActive = (subItem) => {
    return pathname === subItem.url;
  };

  // Efecto para actualizar qué elementos deben estar abiertos basándose en la ruta actual
  useEffect(() => {
    const newOpenItems = new Set();
    items.forEach((item) => {
      if (isItemActive(item)) {
        newOpenItems.add(item.title);
      }
    });
    setOpenItems(newOpenItems);
  }, [pathname, items]);

  // Función para manejar el toggle manual de elementos
  const handleToggle = (itemTitle, isOpen) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (isOpen) {
        newSet.add(itemTitle);
      } else {
        newSet.delete(itemTitle);
      }
      return newSet;
    });
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const itemActive = isItemActive(item);
          return (
            <SidebarMenuItem key={item.title}>
              <Collapsible
                open={openItems.has(item.title)}
                onOpenChange={(isOpen) => handleToggle(item.title, isOpen)}
                className="group/collapsible"
              >
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} isActive={itemActive}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const subItemActive = isSubItemActive(subItem);
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={subItemActive}
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
