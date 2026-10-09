import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calculateWaterBalance,
  classifyWaterRatio,
  type WaterBalanceInput,
} from "@/features/clima/water-balance";
import { WaterBalance } from "@/features/clima/components/water-balance";
import { waterBalanceDemoRule } from "@/config/water-balance";

const observation = (
  precipitation: number | null = 600,
  et0: number | null = 1000,
): WaterBalanceInput => ({
  precipitation,
  evapotranspiration: et0,
  expectedDays: 365,
  coverage: {
    precipitation_sum: 365,
    et0_fao_evapotranspiration: 365,
    temperature_2m_mean: 365,
    soil_moisture_0_to_7cm_mean: 365,
  },
});
afterEach(() => vi.unstubAllGlobals());

describe("derived water balance", () => {
  it.each([
    [600, 1000, -400, 0.6, "Déficit climático referencial"],
    [1200, 1000, 200, 1.2, "Superávit climático referencial"],
    [1000, 1000, 0, 1, "Balance climático referencial nulo"],
    [0, 1000, -1000, 0, "Déficit climático referencial"],
  ])(
    "calculates P=%s and ET0=%s",
    (p, et0, difference, ratio, balanceLabel) => {
      expect(calculateWaterBalance(observation(p, et0))).toMatchObject({
        difference,
        ratio,
        balanceLabel,
        unavailableReason: null,
      });
    },
  );
  it.each([0, 600])(
    "keeps a valid difference but never divides by zero (P=%s)",
    (p) => {
      const result = calculateWaterBalance(observation(p, 0));
      expect(result.difference).toBe(p);
      expect(result.ratio).toBeNull();
      expect(result.ratioUnavailableReason).toContain("ET₀ es igual a cero");
      expect(classifyWaterRatio(result.ratio)).toBeNull();
    },
  );
  it.each([
    [null, 100],
    [100, null],
    [null, null],
    [NaN, 100],
    [100, Infinity],
    [-1, 100],
    [100, -1],
  ])("does not treat missing/invalid totals as zero: %s, %s", (p, et0) => {
    const result = calculateWaterBalance(observation(p, et0));
    expect(result.difference).toBeNull();
    expect(result.ratio).toBeNull();
    expect(result.unavailableReason).toContain("Faltan datos válidos");
  });
  it("does not compare partial accumulations, even when coverage counts match", () => {
    const data = observation();
    data.coverage.precipitation_sum = 300;
    data.coverage.et0_fao_evapotranspiration = 300;
    expect(calculateWaterBalance(data)).toMatchObject({
      precipitation: 600,
      et0: 1000,
      difference: null,
      ratio: null,
    });
    data.coverage.et0_fao_evapotranspiration = 365;
    expect(calculateWaterBalance(data).unavailableReason).toContain(
      "Cobertura incompleta",
    );
  });
  it("requires only precipitation and ET0 coverage, not unrelated variables", () => {
    const data = observation();
    data.coverage.temperature_2m_mean = 0;
    data.coverage.soil_moisture_0_to_7cm_mean = 0;
    expect(calculateWaterBalance(data).difference).toBe(-400);
  });
  it("guards against numerical overflow and empty periods", () => {
    expect(
      calculateWaterBalance(observation(Number.MAX_VALUE, Number.MIN_VALUE))
        .ratio,
    ).toBeNull();
    expect(
      calculateWaterBalance({ ...observation(), expectedDays: 0 }).difference,
    ).toBeNull();
  });
});

describe("DEMO classification", () => {
  it.each([
    [0, "LOW"],
    [0.499, "LOW"],
    [0.5, "INTERMEDIATE"],
    [0.999, "INTERMEDIATE"],
    [1, "HIGH"],
    [2, "HIGH"],
  ] as const)("classifies ratio %s as %s", (ratio, expected) => {
    expect(classifyWaterRatio(ratio)).toBe(expected);
  });
  it.each([null, NaN, Infinity, -1])(
    "does not classify an unavailable/invalid ratio %s",
    (ratio) => {
      expect(classifyWaterRatio(ratio)).toBeNull();
    },
  );
  it("uses the centralized thresholds at both boundaries", () => {
    expect(waterBalanceDemoRule.status).toBe("DEMO");
    expect(
      classifyWaterRatio(waterBalanceDemoRule.thresholds.lowUpperExclusive),
    ).toBe("INTERMEDIATE");
    expect(
      classifyWaterRatio(
        waterBalanceDemoRule.thresholds.intermediateUpperExclusive,
      ),
    ).toBe("HIGH");
  });
});

describe("water balance evidence presentation", () => {
  it("renders REAL inputs, derived calculations and explicit DEMO limitations without HTTP or mutation", () => {
    const http = vi.fn();
    vi.stubGlobal("fetch", http);
    const data = observation();
    const original = structuredClone(data);
    const html = renderToStaticMarkup(
      createElement(WaterBalance, { observation: data }),
    );
    for (const label of [
      "Balance hídrico referencial",
      "Open-Meteo — REAL",
      "cálculos derivados",
      "Regla DEMO",
      "Relación intermedia",
      "Déficit climático referencial",
      "No es un índice oficial de sequía ni una recomendación agronómica.",
      "Este indicador compara la precipitación del período con la evapotranspiración de referencia. Es una señal de apoyo para el MVP y no sustituye una evaluación agronómica del cultivo, suelo o sistema de riego.",
      "no modifica el BDP Score",
    ]) {
      expect(html).toContain(label);
    }
    expect(http).not.toHaveBeenCalled();
    expect(data).toEqual(original);
  });
  it.each([observation(100, 0), observation(null, 100)])(
    "shows unavailability without a fabricated classification",
    (data) => {
      const html = renderToStaticMarkup(
        createElement(WaterBalance, { observation: data }),
      );
      expect(html).toContain("No disponible");
      expect(html).toContain("Regla DEMO · Sin clasificación");
      expect(html).not.toContain("Infinity");
      expect(html).not.toContain("NaN");
    },
  );
});
