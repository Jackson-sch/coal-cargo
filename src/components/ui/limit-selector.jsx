"use client"; import React from "react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"; export default function LimitSelector({ value = 10, onChange, options = [10, 20, 50], label = "Por página", className,
}) { const handleChange = (v) => { const next = parseInt(v, 10); if (typeof onChange === "function") onChange(Number.isNaN(next) ? value : next); }; return ( <div className={cn("flex items-center gap-2", className)}> <span className="text-sm text-muted-foreground">{label}</span> <Select value={String(value)} onValueChange={handleChange}> <SelectTrigger className="w-[100px]"> <SelectValue /> </SelectTrigger> <SelectContent> {options.map((opt) => ( <SelectItem key={opt} value={String(opt)}> {opt} </SelectItem> ))} </SelectContent> </Select> </div> );
}
