import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function StepCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-5 sm:p-7", className)}>
      <div className="mb-6">
        <h2 className="text-section-title">{title}</h2>
        {description && (
          <p className="mt-1 text-helper text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </Card>
  );
}

export function Field({
  label,
  error,
  hint,
  required = false,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-label font-semibold text-muted-foreground">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-helper text-muted-foreground">
          {hint}
        </span>
      )}
      {error && (
        <span className="mt-1 block text-helper text-danger" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export const inputClass =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
export const textareaClass =
  "min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
