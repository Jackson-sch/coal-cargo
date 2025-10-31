"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false); // Manejar el montaje del component e
  useEffect(() => {
    setMounted(true);
  }, []);
  const themes = [
    { name: "system", icon: Monitor, label: "System" },
    { name: "light", icon: Sun, label: "Light" },
    { name: "dark", icon: Moon, label: "Dark" },
  ];

  // Evitar el renderizado hasta que el componente esté montad o
  if (!mounted) {
    return (
      <div className="flex items-center justify-between p-2 space-x-2">
        <div className="flex gap-1 rounded-full border">
          {themes.map(({ name }) => (
            <div key={name} className="w-7 h-7" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between p-2 space-x-2">
        <div className="flex gap-1 rounded-full border">
          {themes.map(({ name, icon: Icon, label }) => (
            <Tooltip key={name}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-7 h-7 rounded-full ${
                    theme === name ? "bg-secondary" : "hover:bg-secondary/50"
                  }`}
                  onClick={() => setTheme(name)}
                >
                  <Icon className="h-3 w-3" />
                  <span className="sr-only">{label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="capitalize">{label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
