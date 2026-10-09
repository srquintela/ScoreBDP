import { climateConfig, OPEN_METEO_ARCHIVE_URL } from "@/config/climate";
import { getCoordinates } from "@/lib/maps/geometry";
import { isCalendarDate, periodDays } from "@/lib/climate/period";
import type { ClimateQuery, ParsedClimateData } from "@/types/climate";

export class ClimateError extends Error {
  constructor(
    public readonly code:
      | "INVALID_INPUT"
      | "INVALID_RESPONSE"
      | "HTTP"
      | "TIMEOUT"
      | "NETWORK"
      | "UNAVAILABLE",
  ) {
    super(code);
    this.name = "ClimateError";
  }
}

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const invalid = (): never => {
  throw new ClimateError("INVALID_RESPONSE");
};

export function validateClimateQuery(query: ClimateQuery) {
  if (
    !getCoordinates(query.latitude, query.longitude) ||
    !isCalendarDate(query.periodStart) ||
    !isCalendarDate(query.periodEnd) ||
    periodDays(query) < 1 ||
    periodDays(query) > 366
  )
    throw new ClimateError("INVALID_INPUT");
}

export function parseOpenMeteoResponse(
  input: unknown,
  query: ClimateQuery,
): ParsedClimateData {
  if (
    !record(input) ||
    input.error ||
    !record(input.daily) ||
    !record(input.daily_units)
  )
    return invalid();
  const coordinates = getCoordinates(input.latitude, input.longitude);
  if (!coordinates || typeof input.timezone !== "string" || !input.timezone)
    return invalid();
  const dates = input.daily.time;
  if (
    !Array.isArray(dates) ||
    !dates.every(isCalendarDate) ||
    dates.length > periodDays(query)
  )
    return invalid();
  if (
    dates.some(
      (date, i) =>
        date < query.periodStart ||
        date > query.periodEnd ||
        (i > 0 && date <= dates[i - 1]),
    )
  )
    return invalid();
  const series = {} as ParsedClimateData["series"];
  const units = {} as ParsedClimateData["units"];
  for (const variable of climateConfig.dailyVariables) {
    const values = input.daily[variable];
    if (
      input.daily_units[variable] !== climateConfig.units[variable] ||
      !Array.isArray(values) ||
      values.length !== dates.length
    )
      return invalid();
    if (
      !values.every(
        (value) =>
          value === null ||
          (typeof value === "number" &&
            Number.isFinite(value) &&
            (variable === "temperature_2m_mean" || value >= 0) &&
            (variable !== "soil_moisture_0_to_7cm_mean" || value <= 1)),
      )
    )
      return invalid();
    series[variable] = values;
    units[variable] = climateConfig.units[variable];
  }
  return {
    dates,
    series,
    units,
    timezone: input.timezone,
    gridCoordinates: coordinates,
  };
}

export class OpenMeteoClient {
  constructor(
    private readonly http: typeof fetch = (input, init) => fetch(input, init),
    private readonly timeoutMs: number = climateConfig.timeoutMs,
  ) {}

  async getHistorical(query: ClimateQuery): Promise<ParsedClimateData> {
    validateClimateQuery(query);
    const url = new URL(OPEN_METEO_ARCHIVE_URL);
    url.search = new URLSearchParams({
      latitude: String(query.latitude),
      longitude: String(query.longitude),
      start_date: query.periodStart,
      end_date: query.periodEnd,
      daily: climateConfig.dailyVariables.join(","),
      timezone: "auto",
    }).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.http(url.toString(), {
        signal: controller.signal,
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!response.ok) throw new ClimateError("HTTP");
      let json: unknown;
      try {
        json = await response.json();
      } catch {
        throw new ClimateError("INVALID_RESPONSE");
      }
      return parseOpenMeteoResponse(json, query);
    } catch (error) {
      if (controller.signal.aborted) throw new ClimateError("TIMEOUT");
      if (error instanceof ClimateError) throw error;
      throw new ClimateError("NETWORK");
    } finally {
      clearTimeout(timeout);
    }
  }
}
