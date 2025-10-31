"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react"; // ✅ Importación correct a
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function LoginForm({ className, ...props }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(""); // ✅ Validación de campos vacío s
    if (!email.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      }); // Para debuggin g

      if (result?.error) {
        // ✅ Manejo más específico de errore s
        switch (result.error) {
          case "CredentialsSignin":
            setError("Credenciales inválidas. Verifica tu email y contraseña.");
            break;
          case "CallbackRouteError":
            setError("Error en el servidor. Intenta nuevamente.");
            break;
          default:
            setError("Error al iniciar sesión. Intenta nuevamente.");
        }
      } else if (result?.ok) {
        // ✅ Éxito - redirigir al dashboar d
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Error inesperado. Intenta nuevamente.");
      }
    } catch (error) {
      setError("Error de conexión. Verifica tu internet e intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Bienvenido</CardTitle>
          <CardDescription> Inicia sesión en tu cuenta </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Contraseña</Label>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-md border border-red-200">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        Al continuar, aceptas nuestros
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Términos de Servicio
        </a>
        y
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Política de Privacidad
        </a>
        .
      </div>
    </div>
  );
}
