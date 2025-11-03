"use client";
import * as React from "react";
import { ClockIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function TimePicker({
  className,
  time,
  setTime,
  placeholder = "Seleccionar hora",
  format24h = true,
  ...props
}) {
  const [hours, setHours] = React.useState(time ? time.getHours() : 12);
  const [minutes, setMinutes] = React.useState(time ? time.getMinutes() : 0);
  const [ampm, setAmpm] = React.useState(
    time ? (time.getHours() >= 12 ? "PM" : "AM") : "AM"
  );
  const [isOpen, setIsOpen] = React.useState(false); // Generar opciones de hora s
  const hourOptions = format24h
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i + 1); // Generar opciones de minutos (cada 5 minuto s) const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5) // Actualizar el tiempo cuando cambian los valores

  const minuteOptions = format24h
    ? Array.from({ length: 60 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i * 5);

  React.useEffect(() => {
    if (setTime) {
      const newTime = new Date();
      let finalHours = hours;
      if (!format24h) {
        if (ampm === "PM" && hours !== 12) {
          finalHours = hours + 12;
        } else if (ampm === "AM" && hours === 12) {
          finalHours = 0;
        }
      }
      newTime.setHours(finalHours, minutes, 0, 0);
      setTime(newTime);
    } else {
      setTime(new Date());
    }
  }, [hours, minutes, ampm, format24h, setTime]);
  const formatDisplayTime = () => {
    if (!time) return placeholder;
    if (format24h) {
      return format(time, "HH:mm", { locale: es });
    } else {
      return format(time, "hh:mm a", { locale: es });
    }
  };
  const handleHourChange = (newHour) => {
    setHours(newHour);
  };

  const handleMinuteChange = (newMinute) => {
    setMinutes(newMinute);
  };

  const handleAmPmChange = (newAmPm) => {
    setAmpm(newAmPm);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !time && "text-muted-foreground"
            )}
          >
            <ClockIcon className="mr-2 h-4 w-4" /> {formatDisplayTime()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="flex items-center space-x-2">
            {/* Selector de horas */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">
                {format24h ? "Hora" : "Hora"}
              </label>
              <div className="grid grid-cols-4 gap-1 max-h-32 overflow-y-auto">
                {hourOptions.map((hour) => (
                  <Button
                    key={hour}
                    variant={hours === hour ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-12"
                    onClick={() => handleHourChange(hour)}
                  >
                    {format24h ? hour.toString().padStart(2, "0") : hour}
                  </Button>
                ))}
              </div>
            </div>
            {/* Separador */} <div className="text-2xl font-bold">:</div>
            {/* Selector de minutos */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Min</label>
              <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto">
                {minuteOptions.map((minute) => (
                  <Button
                    key={minute}
                    variant={minutes === minute ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-12"
                    onClick={() => handleMinuteChange(minute)}
                  >
                    {minute.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
            </div>
            {/* Selector AM/PM (solo si no es formato 24h) */}
            {!format24h && (
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Período</label>
                <div className="flex flex-col space-y-1">
                  <Button
                    variant={ampm === "AM" ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-12"
                    onClick={() => handleAmPmChange("AM")}
                  >
                    AM
                  </Button>
                  <Button
                    variant={ampm === "PM" ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-12"
                    onClick={() => handleAmPmChange("PM")}
                  >
                    PM
                  </Button>
                </div>
              </div>
            )}
          </div>
          {/* Input manual para tiempo */}
          <div className="mt-4 pt-4 border-t">
            <label className="text-sm font-medium mb-2 block">
              O ingresa manualmente:
            </label>
            <Input
              type="time"
              value={time ? format(time, "HH:mm") : ""}
              onChange={(e) => {
                if (e.target.value && setTime) {
                  const [h, m] = e.target.value.split(":").map(Number);
                  const newTime = new Date();
                  newTime.setHours(h, m, 0, 0);
                  setTime(newTime);
                  setHours(format24h ? h : h > 12 ? h - 12 : h === 0 ? 12 : h);
                  setMinutes(m);
                  setAmpm(h >= 12 ? "PM" : "AM");
                }
              }}
              className="w-full"
            />
          </div>
          {/* Botones de acción */}
          <div className="flex justify-between mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                setTime(now);
                setHours(
                  format24h
                    ? now.getHours()
                    : now.getHours() > 12
                    ? now.getHours() - 12
                    : now.getHours() === 0
                    ? 12
                    : now.getHours()
                );
                setMinutes(now.getMinutes());
                setAmpm(now.getHours() >= 12 ? "PM" : "AM");
              }}
            >
              Ahora
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} // Componente adicional para entrada de tiempo simpl e
export function TimeInput({
  className,
  time,
  setTime,
  placeholder = "HH:MM",
  ...props
}) {
  return (
    <div className={cn("relative", className)}>
      <Input
        type="time"
        value={time ? format(time, "HH:mm") : ""}
        onChange={(e) => {
          if (e.target.value && setTime) {
            const [hours, minutes] = e.target.value.split(":").map(Number);
            const newTime = new Date();
            newTime.setHours(hours, minutes, 0, 0);
            setTime(newTime);
          }
        }}
        placeholder={placeholder}
        className={cn("pl-10", className)}
        {...props}
      />
      <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  );
}
