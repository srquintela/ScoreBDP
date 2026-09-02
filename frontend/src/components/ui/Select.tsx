"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectProps {
  /** Valor controlado */
  value: string;
  /** Cambio de valor */
  onChange: (value: string) => void;
  /** Opciones del select */
  options: { value: string; label: string }[];
  /** Label del campo */
  label: string;
  /** Placeholder cuando no hay selección */
  placeholder?: string;
  /** Clase adicional */
  className?: string;
}

export function Select({ value, onChange, options, label, placeholder = "Selecciona un departamento", className }: SelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-soil-900" htmlFor="departamento-select">
        {label}
      </label>

      <select
        id="departamento-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-md border border-soil-600/25 bg-white px-3 py-2 text-sm text-soil-900 placeholder:text-soil-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          className,
        )}
        aria-label={label}
      >
        <option disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}