export function formatDocument(documentNumber: string): string {
  if (documentNumber.length <= 6) return "••••";
  return documentNumber.slice(0, 3) + "••••" + documentNumber.slice(-3);
}

export function formatDecimal(
  value: number | null | undefined,
  unit = "",
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return (
    new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 }).format(value) +
    unit
  );
}

export function formatCoordinate(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(5)
    : "—";
}
