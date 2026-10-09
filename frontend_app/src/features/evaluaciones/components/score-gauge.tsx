type ScoreGaugeProps = {
  score: number | null;
  letter: string | null;
};

export function ScoreGauge({ score, letter }: ScoreGaugeProps) {
  const available = score !== null && Number.isFinite(score);
  const progress = available ? Math.min(100, Math.max(0, score / 10)) : 0;

  return (
    <div className="grid flex-1 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">BDP Score</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight">
          {available ? "Resultado de la evaluación" : "Evaluación pendiente"}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Escala del modelo de 0 a 1.000. El resultado orienta el análisis del
          oficial y no determina la aprobación del crédito.
        </p>
        {available && letter ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Categoría del modelo</span>
            <span className="text-sm font-bold text-primary">{letter}</span>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Genera el score para ver la categoría y su posición en la escala.
          </p>
        )}
      </div>

      <div className="mx-auto w-full max-w-[240px] text-center">
        <svg
          className="block h-auto w-full overflow-visible"
          viewBox="0 0 240 142"
          role="img"
          aria-label={
            available
              ? `BDP Score ${score} de 1000, categoría ${letter ?? "no informada"}`
              : "BDP Score aún no calculado"
          }
        >
          <defs>
            <linearGradient id="scoreGaugeGradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#005FBC" />
              <stop offset="100%" stopColor="#00A0E3" />
            </linearGradient>
          </defs>
          <path
            d="M 22 120 A 98 98 0 0 1 218 120"
            pathLength={100}
            fill="none"
            stroke="var(--secondary)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M 22 120 A 98 98 0 0 1 218 120"
            pathLength={100}
            fill="none"
            stroke="url(#scoreGaugeGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={100}
            strokeDashoffset={100 - progress}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
          <text
            x="120"
            y="73"
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize="13"
            fontWeight="500"
          >
            {available ? "Score" : "Pendiente"}
          </text>
          <text
            x="120"
            y="105"
            textAnchor="middle"
            className="fill-foreground"
            fontSize="31"
            fontWeight="750"
            fontVariant="tabular-nums"
          >
            {available
              ? score.toLocaleString("es-BO", { maximumFractionDigits: 2 })
              : "—"}
          </text>
        </svg>
        <p className="-mt-1 text-sm text-muted-foreground">
          {available ? "de 1.000 puntos" : "Sin score calculado"}
        </p>
        {available && (
          <div
            className="mt-4 flex justify-between text-[11px] font-medium text-muted-foreground"
            aria-hidden="true"
          >
            <span>0</span>
            <span>500</span>
            <span>1.000</span>
          </div>
        )}
      </div>
    </div>
  );
}
