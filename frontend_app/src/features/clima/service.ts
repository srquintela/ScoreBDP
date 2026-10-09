import { climateConfig } from "@/config/climate";
import { ClimateError, OpenMeteoClient } from "@/lib/climate/open-meteo-client";
import { historicalPeriod, periodDays } from "@/lib/climate/period";
import { getCoordinates } from "@/lib/maps/geometry";
import type {
  ClimateQuery,
  ParsedClimateData,
  RealClimateObservation,
} from "@/types/climate";

type ClimateEvidence = Omit<RealClimateObservation, "id" | "parcelId">;

export function summarizeClimate(
  data: ParsedClimateData,
  query: ClimateQuery,
  consultedAt: string,
): ClimateEvidence {
  const values = (key: keyof typeof data.series) =>
    data.series[key].filter((value): value is number => value !== null);
  const precipitation = values("precipitation_sum");
  const temperature = values("temperature_2m_mean");
  const moisture = values("soil_moisture_0_to_7cm_mean");
  const et0 = values("et0_fao_evapotranspiration");
  if (
    ![precipitation, temperature, moisture, et0].some((series) => series.length)
  )
    throw new ClimateError("UNAVAILABLE");
  const sum = (series: number[]) =>
    series.length ? series.reduce((a, b) => a + b, 0) : null;
  const mean = (series: number[]) =>
    series.length ? sum(series)! / series.length : null;
  return {
    source: "Open-Meteo",
    sourceStatus: "REAL",
    sourceId: "source-open-meteo-real",
    ...query,
    precipitation: sum(precipitation),
    averageTemperature: mean(temperature),
    soilMoisture: moisture.length ? mean(moisture)! * 100 : null,
    evapotranspiration: sum(et0),
    droughtRisk: null,
    observedAt: query.periodEnd,
    consultedAt,
    timezone: data.timezone,
    gridCoordinates: data.gridCoordinates,
    variables: [...climateConfig.dailyVariables],
    units: { ...data.units },
    coverage: {
      precipitation_sum: precipitation.length,
      temperature_2m_mean: temperature.length,
      soil_moisture_0_to_7cm_mean: moisture.length,
      et0_fao_evapotranspiration: et0.length,
    },
    expectedDays: periodDays(query),
    dryDays: precipitation.length
      ? precipitation.filter((value) => value < climateConfig.dryDayThresholdMm)
          .length
      : null,
    dryDayThresholdMm: climateConfig.dryDayThresholdMm,
    indicatorStatus: "DEMO",
  };
}

export class ClimateService {
  private readonly cache = new Map<
    string,
    { expires: number; evidence: ClimateEvidence }
  >();
  private readonly pending = new Map<string, Promise<ClimateEvidence>>();
  constructor(
    private readonly client = new OpenMeteoClient(),
    private readonly now = () => new Date(),
  ) {}

  async getObservation(input: {
    latitude: unknown;
    longitude: unknown;
    parcelId: string;
  }): Promise<RealClimateObservation> {
    const coordinates = getCoordinates(input.latitude, input.longitude);
    if (!coordinates) throw new ClimateError("INVALID_INPUT");
    const query = { ...coordinates, ...historicalPeriod(this.now()) };
    const key = JSON.stringify([query, climateConfig.dailyVariables]);
    const cached = this.cache.get(key);
    let evidence: ClimateEvidence;
    if (cached && cached.expires > this.now().getTime())
      evidence = cached.evidence;
    else {
      this.cache.delete(key);
      let request = this.pending.get(key);
      if (!request) {
        request = this.client
          .getHistorical(query)
          .then((data) => {
            const result = summarizeClimate(
              data,
              query,
              this.now().toISOString(),
            );
            if (this.cache.size >= climateConfig.cacheMaxEntries)
              this.cache.delete(this.cache.keys().next().value!);
            this.cache.set(key, {
              expires: this.now().getTime() + climateConfig.cacheTtlMs,
              evidence: result,
            });
            return result;
          })
          .finally(() => this.pending.delete(key));
        this.pending.set(key, request);
      }
      evidence = await request;
    }
    return structuredClone({
      ...evidence,
      parcelId: input.parcelId,
      id: `climate-real:${input.parcelId}:${evidence.consultedAt}`,
    });
  }
}

// Session memory only; shared requests across cards, no personal data or persistent storage.
export const climateService = new ClimateService();
