import React from "react";
import { Spinner } from "@/components/ui/spinner";

export default function SpinnerGeneral({ text = "Cargando..." }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="relative">
        {/* Halo mágico con blur animado */}
        <div className="absolute inset-0 -m-12 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 opacity-20 blur-3xl animate-pulse"></div>

        {/* Anillos orbitales decorativos */}
        <div className="absolute inset-0 -m-8">
          <div
            className="absolute inset-0 rounded-full border-2 border-blue-500/30 dark:border-blue-400/30 animate-ping"
            style={{ animationDuration: "2s" }}
          ></div>
          <div
            className="absolute inset-0 rounded-full border-2 border-purple-500/20 dark:border-purple-400/20 animate-ping"
            style={{ animationDuration: "3s", animationDelay: "0.5s" }}
          ></div>
        </div>

        {/* Contenedor del Spinner con efecto de resplandor */}
        <div className="relative p-4 rounded-full bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-pink-400/10 backdrop-blur-sm">
          {/* Spinner de shadcn personalizado */}
          <Spinner className="w-12 h-12 text-blue-600 dark:text-blue-400" />

          {/* Destello central */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-2 h-2 bg-white dark:bg-blue-200 rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Texto con gradiente animado */}
        <div className="mt-8 text-center space-y-3">
          <p className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent font-medium text-lg animate-pulse">
            {text}
          </p>

          {/* Puntos animados */}
          <div className="flex justify-center gap-1.5">
            <div
              className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-pink-500 dark:bg-pink-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>

        {/* Partículas flotantes opcionales */}
        <div
          className="absolute -top-4 -left-4 w-3 h-3 bg-blue-400 rounded-full opacity-60 animate-ping"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute -bottom-4 -right-4 w-3 h-3 bg-pink-400 rounded-full opacity-60 animate-ping"
          style={{ animationDuration: "5s", animationDelay: "1s" }}
        ></div>
      </div>
    </div>
  );
}
