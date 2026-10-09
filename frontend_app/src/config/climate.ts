export const OPEN_METEO_BASE_URL = "https://api.open-meteo.com";
export const OPEN_METEO_ARCHIVE_URL =
  "https://archive-api.open-meteo.com/v1/archive";

export const climateConfig = {
  historyMonths: 12,
  availabilityLagDays: 7,
  timeoutMs: 20000,
  cacheTtlMs: 30 * 60 * 1000,
  cacheMaxEntries: 32,
  dryDayThresholdMm: 1,
  dailyVariables: [
    "precipitation_sum",
    "temperature_2m_mean",
    "soil_moisture_0_to_7cm_mean",
    "et0_fao_evapotranspiration",
  ],
  units: {
    precipitation_sum: "mm",
    temperature_2m_mean: "°C",
    soil_moisture_0_to_7cm_mean: "m³/m³",
    et0_fao_evapotranspiration: "mm",
  },
} as const;
