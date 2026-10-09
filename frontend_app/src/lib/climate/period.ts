import { climateConfig } from "@/config/climate";
import type { ClimatePeriod } from "@/types/climate";

export const dayMs = 86400000;
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && isoDay(date) === value;
}

export function periodDays(period: ClimatePeriod): number {
  return (
    (Date.parse(period.periodEnd) - Date.parse(period.periodStart)) / dayMs + 1
  );
}

/** Last full calendar months before the archive availability margin, computed in UTC. */
export function historicalPeriod(now = new Date()): ClimatePeriod {
  const available = new Date(
    now.getTime() - climateConfig.availabilityLagDays * dayMs,
  );
  const end = new Date(
    Date.UTC(available.getUTCFullYear(), available.getUTCMonth(), 0),
  );
  const start = new Date(
    Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth() - climateConfig.historyMonths + 1,
      1,
    ),
  );
  return { periodStart: isoDay(start), periodEnd: isoDay(end) };
}
