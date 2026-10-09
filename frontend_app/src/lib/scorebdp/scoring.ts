import { factorKeys, type Factors, type Weights } from "./contracts";
export function validateWeights(weights: Weights): boolean {
  return (
    factorKeys.every(
      (key) =>
        Number.isFinite(weights[key]) &&
        weights[key] >= 0 &&
        weights[key] <= 100,
    ) &&
    Math.abs(factorKeys.reduce((sum, key) => sum + weights[key], 0) - 100) <
      0.0001
  );
}
export function contribution(
  key: keyof Factors,
  factor: number,
  weight: number,
) {
  return Number(
    ((key === "riesgo_climatico" ? 1 - factor : factor) * weight * 10).toFixed(
      2,
    ),
  );
}
export function calculateScore(
  factors: Factors,
  weights: Weights,
): number | null {
  if (!validateWeights(weights))
    throw new Error("Los pesos deben estar entre 0 y 100 y sumar 100.");
  if (factorKeys.some((key) => factors[key] === null)) return null;
  if (
    factorKeys.some(
      (key) =>
        !Number.isFinite(factors[key]) ||
        factors[key]! < 0 ||
        factors[key]! > 1,
    )
  )
    throw new Error("Factores fuera del rango 0–1.");
  return Number(
    factorKeys
      .reduce(
        (sum, key) =>
          sum +
          (key === "riesgo_climatico" ? 1 - factors[key]! : factors[key]!) *
            weights[key] *
            10,
        0,
      )
      .toFixed(2),
  );
}
export function scoreLetter(score: number | null): string | null {
  if (score === null) return null;
  return score >= 900
    ? "A"
    : score >= 700
      ? "B"
      : score >= 500
        ? "C"
        : score >= 300
          ? "D"
          : score >= 100
            ? "E"
            : "F";
}
