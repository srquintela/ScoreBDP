import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary: "bg-blue-600 text-on-accent hover:bg-blue-700",
  secondary: "border border-soil-600/30 bg-wheat-50 text-soil-900 hover:bg-wheat-100",
  ghost: "text-soil-600 hover:bg-wheat-100",
  danger: "bg-brick-700 text-on-accent hover:bg-brick-700/90",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
