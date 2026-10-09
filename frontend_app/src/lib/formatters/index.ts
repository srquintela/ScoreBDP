const locale = "es-BO";
const missing = "—";
const decimal = new Intl.NumberFormat(locale, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const date = new Intl.DateTimeFormat(locale, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/La_Paz",
});
const valid = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

const integer = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
const scoreNumber = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

export function formatCount(value: number): string {
  return valid(value) ? integer.format(value) : missing;
}

export function formatScore(value: number | null | undefined): string {
  return valid(value) ? scoreNumber.format(value) : missing;
}

export function formatCurrency(value: number | null | undefined): string {
  return valid(value) ? "Bs " + decimal.format(value) : missing;
}

/** Accepts percentage points: 30 -> 30%, not 3000%. */
export function formatPercentage(value: number | null | undefined): string {
  return valid(value)
    ? new Intl.NumberFormat(locale, {
        style: "percent",
        maximumFractionDigits: 2,
      }).format(value / 100)
    : missing;
}

export function formatHectares(value: number | null | undefined): string {
  return valid(value) && value >= 0 ? decimal.format(value) + " ha" : missing;
}

export function formatNdvi(value: number | null | undefined): string {
  return valid(value) && value >= -1 && value <= 1
    ? decimal.format(value)
    : missing;
}

/** Date-only strings retain their calendar day; timestamps require an explicit timezone. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return missing;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (!dateOnly && !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value))
    return missing;
  const calendarDay = value.slice(0, 10);
  const calendar = new Date(calendarDay + "T12:00:00Z");
  if (
    !Number.isFinite(calendar.getTime()) ||
    calendar.toISOString().slice(0, 10) !== calendarDay
  )
    return missing;
  const parsed = new Date(dateOnly ? value + "T12:00:00Z" : value);
  if (!Number.isFinite(parsed.getTime())) return missing;
  return date.format(parsed);
}
