"use client";
import { LoginForm } from "@/components/login-form";
import { useEmpresaConfig } from "@/hooks/use-empresa-config";

export default function LoginPage() {
  const { empresaConfig } = useEmpresaConfig();
  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            {empresaConfig.nombre}
          </h1>
          <p className="text-sm text-muted-foreground">
            Sistema de Gestión de Envíos
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
