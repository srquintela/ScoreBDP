import { waterBalanceDemoRule } from "@/config/water-balance";
import type { RealClimateObservation } from "@/types/climate";

export type WaterBalanceInput = Pick<
  RealClimateObservation,
  "precipitation" | "evapotranspiration" | "coverage" | "expectedDays"
>;
export type WaterRatioClass = keyof typeof waterBalanceDemoRule.labels;

export function classifyWaterRatio(
  ratio: number | null,
): WaterRatioClass | null {
  if (ratio === null || !Number.isFinite(ratio) || ratio < 0) return null;
  if (ratio < waterBalanceDemoRule.thresholds.lowUpperExclusive) return "LOW";
  if (ratio < waterBalanceDemoRule.thresholds.intermediateUpperExclusive)
    return "INTERMEDIATE";
  return "HIGH";
}

const validTotal = (value: number | null): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;

export function calculateWaterBalance(data: WaterBalanceInput) {
  const precipitation = validTotal(data.precipitation);
  const et0 = validTotal(data.evapotranspiration);
  let unavailableReason: string | null = null;
  if (precipitation === null || et0 === null) {
    unavailableReason =
      "Faltan datos válidos de precipitación o ET₀ para calcular el balance.";
  } else if (
    !Number.isInteger(data.expectedDays) ||
    data.expectedDays <= 0 ||
    data.coverage.precipitation_sum !== data.expectedDays ||
    data.coverage.et0_fao_evapotranspiration !== data.expectedDays
  ) {
    // Aggregates do not retain matching daily samples; partial totals cannot be compared safely.
    unavailableReason =
      "Cobertura incompleta: P y ET₀ deben cubrir todos los días del mismo período para calcular el balance.";
  }
  const difference = unavailableReason === null ? precipitation! - et0! : null;
  const quotient =
    unavailableReason === null && et0! > 0 ? precipitation! / et0! : null;
  const ratio =
    quotient !== null && Number.isFinite(quotient) ? quotient : null;
  const ratioUnavailableReason =
    unavailableReason ??
    (et0 === 0
      ? "Relación no calculable: ET₀ es igual a cero; no se aplica la Regla DEMO."
      : ratio === null
        ? "La relación excede el rango numérico representable."
        : null);
  const balanceLabel =
    difference === null
      ? "Balance no disponible"
      : difference < 0
        ? "Déficit climático referencial"
        : difference > 0
          ? "Superávit climático referencial"
          : "Balance climático referencial nulo";
  return {
    precipitation,
    et0,
    difference,
    ratio,
    balanceLabel,
    unavailableReason,
    ratioUnavailableReason,
  };
}
