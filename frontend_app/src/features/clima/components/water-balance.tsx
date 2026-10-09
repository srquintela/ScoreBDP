import { waterBalanceDemoRule } from "@/config/water-balance";
import {
  calculateWaterBalance,
  classifyWaterRatio,
  type WaterBalanceInput,
} from "@/features/clima/water-balance";
import { formatDecimal } from "@/lib/formatters/producer";

export function WaterBalance({
  observation,
}: {
  observation: WaterBalanceInput;
}) {
  const balance = calculateWaterBalance(observation);
  const classification = classifyWaterRatio(balance.ratio);
  const { thresholds, labels } = waterBalanceDemoRule;
  const indicators = [
    {
      label: "Precipitación acumulada (P)",
      value: balance.precipitation,
      unit: " mm",
    },
    {
      label: "Evapotranspiración de referencia acumulada (ET₀)",
      value: balance.et0,
      unit: " mm",
    },
    { label: "Diferencia P - ET₀", value: balance.difference, unit: " mm" },
    { label: "Relación P / ET₀", value: balance.ratio, unit: " (sin unidad)" },
  ];
  return (
    <section
      aria-label="Balance hídrico referencial"
      className="rounded-lg border border-border p-4"
    >
      <h3 className="text-sm font-semibold">Balance hídrico referencial</h3>
      <p className="mt-2 text-helper text-muted-foreground">
        P y ET₀: datos base de Open-Meteo — REAL. Diferencia y relación:
        cálculos derivados para el mismo período.
      </p>
      <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {indicators.map((item) => (
          <div key={item.label}>
            <dt className="text-label text-muted-foreground">{item.label}</dt>
            <dd className="mt-1 text-sm font-semibold">
              {item.value === null
                ? "No disponible"
                : formatDecimal(item.value, item.unit)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm font-medium">{balance.balanceLabel}</p>
      {balance.unavailableReason && (
        <p className="mt-2 text-helper text-muted-foreground">
          {balance.unavailableReason} Los acumulados disponibles pueden ser
          parciales.
        </p>
      )}
      {balance.ratioUnavailableReason &&
        balance.ratioUnavailableReason !== balance.unavailableReason && (
          <p className="mt-2 text-helper text-muted-foreground">
            {balance.ratioUnavailableReason}
          </p>
        )}
      <div className="mt-4 rounded-md bg-muted/40 p-3 text-helper">
        <p className="font-semibold">
          Regla DEMO ·{" "}
          {classification ? labels[classification] : "Sin clasificación"}
        </p>
        <p className="mt-2 text-muted-foreground">
          Umbrales provisionales de P/ET₀: {labels.LOW.toLowerCase()} si es
          menor a {formatDecimal(thresholds.lowUpperExclusive)};{" "}
          {labels.INTERMEDIATE.toLowerCase()} desde{" "}
          {formatDecimal(thresholds.lowUpperExclusive)} y menor a{" "}
          {formatDecimal(thresholds.intermediateUpperExclusive)};{" "}
          {labels.HIGH.toLowerCase()} desde{" "}
          {formatDecimal(thresholds.intermediateUpperExclusive)}.
        </p>
        <p className="mt-2 text-muted-foreground">
          No es un índice oficial de sequía ni una recomendación agronómica. La
          clasificación queda pendiente de validación por especialistas.
        </p>
      </div>
      <p className="mt-4 text-helper text-muted-foreground">
        Este indicador compara la precipitación del período con la
        evapotranspiración de referencia. Es una señal de apoyo para el MVP y no
        sustituye una evaluación agronómica del cultivo, suelo o sistema de
        riego.
      </p>
      <p className="mt-2 text-helper text-muted-foreground">
        No representa directamente las necesidades reales del cultivo y no
        modifica el BDP Score.
      </p>
    </section>
  );
}
