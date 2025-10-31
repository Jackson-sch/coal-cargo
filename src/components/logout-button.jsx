"use client";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/login", redirect: true });
    } catch (error) {}
  };

  return (
    <Button variant="outline" onClick={handleLogout} className="gap-2">
      <LogOut className="h-4 w-4" /> Cerrar Sesión
    </Button>
  );
}
