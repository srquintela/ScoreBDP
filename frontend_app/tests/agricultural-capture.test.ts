import { afterEach, expect, it, vi } from "vitest";
import { createPilot } from "@/features/formulario/pilot";
import {
  mergeParcel,
  validateParcel,
  validateProduction,
  productionIndicators,
} from "@/features/formulario/agricultural-capture";
import { parseKoboGeoshape } from "@/lib/kobo/geoshape";
import { koboBaseSubmissionToParcelPatch } from "@/lib/kobo/mapper";
import { parseOpenMeteoResponse } from "@/lib/climate/open-meteo-client";
import { summarizeClimate } from "@/features/clima/service";
import { calculateWaterBalance } from "@/features/clima/water-balance";
import { GET as getKobo } from "@/app/api/kobo/submissions/route";
function observation() {
  const query = {
    latitude: -16.65,
    longitude: -68.3,
    periodStart: "2025-01-01",
    periodEnd: "2025-01-02",
  };
  const parsed = parseOpenMeteoResponse(
    {
      latitude: -16.65,
      longitude: -68.3,
      timezone: "America/La_Paz",
      daily_units: {
        precipitation_sum: "mm",
        temperature_2m_mean: "°C",
        soil_moisture_0_to_7cm_mean: "m³/m³",
        et0_fao_evapotranspiration: "mm",
      },
      daily: {
        time: ["2025-01-01", "2025-01-02"],
        precipitation_sum: [3, 3],
        temperature_2m_mean: [15, 16],
        soil_moisture_0_to_7cm_mean: [0.2, 0.3],
        et0_fao_evapotranspiration: [5, 5],
      },
    },
    query,
  );
  return {
    ...summarizeClimate(parsed, query, "2025-02-01T00:00:00Z"),
    id: "fixture-test-only",
    parcelId: "demo-parcel-1",
  };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("el piloto explícitamente sintético tiene parcela y producción coherentes", () => {
  const pilot = createPilot();
  expect(pilot.origin).toBe("SYNTHETIC");
  expect(pilot.climate).toBeNull();
  expect(validateParcel(pilot.parcel)).toEqual({});
  expect(validateProduction(pilot.productive, pilot.parcel)).toEqual({});
  expect(productionIndicators(pilot.productive)).toEqual({
    reference: 10,
    grossPotential: 30000,
    margin: 15000,
  });
});
it("cambiar coordenadas manualmente descarta polígono, vínculo y clima anteriores", () => {
  const pilot = createPilot();
  const result = mergeParcel(
    { ...pilot.parcel, source: "KOBO", koboSubmissionId: "123" },
    { latitude: "-17" },
    observation(),
  );
  expect(result.climate).toBeNull();
  expect(result.parcel.geometry).toBeNull();
  expect(result.parcel.source).toBe("MANUAL");
  expect(result.parcel.koboSubmissionId).toBeNull();
});
it("editar el nombre conserva evidencia correspondiente a la misma parcela", () => {
  const pilot = createPilot();
  const data = observation();
  expect(
    mergeParcel(pilot.parcel, { name: "Parcela renombrada" }, data).climate,
  ).toEqual(data);
});
it("rechaza superficies incompatibles y datos no numéricos", () => {
  const pilot = createPilot();
  expect(
    validateProduction(
      { ...pilot.productive, cultivatedAreaHectares: "3" },
      pilot.parcel,
    ),
  ).toHaveProperty("cultivatedAreaHectares");
  expect(
    validateProduction(
      { ...pilot.productive, historicalYield: "NaN" },
      pilot.parcel,
    ),
  ).toHaveProperty("historicalYield");
  expect(validateParcel({ ...pilot.parcel, latitude: "91" })).toHaveProperty(
    "latitude",
  );
});
it("importa un geoshape válido con trazabilidad y rechaza texto inválido", () => {
  const raw =
    "-16.65 -68.30 0 0;-16.65 -68.29 0 0;-16.64 -68.29 0 0;-16.64 -68.30 0 0;-16.65 -68.30 0 0";
  expect(parseKoboGeoshape(raw)?.areaHectares).toBeGreaterThan(0);
  const result = koboBaseSubmissionToParcelPatch(
    {
      submissionId: "7",
      submissionUuid: "uuid-test",
      startedAt: null,
      submissionTime: null,
      hasGeoshape: true,
      rawGeoshape: raw,
    },
    "Parcela test",
  );
  expect(result?.patch.koboSubmissionId).toBe("7");
  expect(result?.patch.geometry?.type).toBe("Polygon");
  expect(parseKoboGeoshape("incorrecto")).toBeNull();
});
it("obtiene balance y relación del mismo periodo desde una respuesta meteorológica simulada", () => {
  const value = calculateWaterBalance(observation());
  expect(value.difference).toBe(-4);
  expect(value.ratio).toBe(0.6);
});
it("Kobo sin credenciales no consulta proveedores ni intenta leer otros proyectos", async () => {
  vi.stubEnv("KOBO_API_TOKEN", "");
  vi.stubEnv("KOBO_ASSET_UID", "");
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  expect((await getKobo()).status).toBe(503);
  expect(fetch).not.toHaveBeenCalled();
});
it("Kobo expone solo geometría y metadatos, sin token ni otros datos de campo", async () => {
  vi.stubEnv("KOBO_API_TOKEN", "test-secret");
  vi.stubEnv("KOBO_ASSET_UID", "test-asset");
  vi.stubEnv("KOBO_BASE_URL", "https://kobo.example");
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation(async () =>
        Response.json({
          results: [
            {
              _id: 7,
              _uuid: "uuid",
              Record_an_area: "shape",
              private_ci: "no-exponer",
            },
          ],
          next: null,
        }),
      ),
  );
  const response = await getKobo();
  const text = await response.text();
  expect(response.status).toBe(200);
  expect(text).not.toContain("test-secret");
  expect(text).not.toContain("no-exponer");
  expect(text).toContain("rawGeoshape");
});
