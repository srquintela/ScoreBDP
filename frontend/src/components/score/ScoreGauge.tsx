import { clasificarRiesgo } from "@/lib/scoring/explain";

function colorPorRiesgo(score: number): { barra: string; ring: string } {
  const riesgo = clasificarRiesgo(score);
  switch (riesgo) {
    case "elegible":
      return { barra: "bg-blue-400", ring: "text-blue-400" };
    case "riesgo_moderado":
      return { barra: "bg-blue-600", ring: "text-blue-600" };
    case "riesgo_medio":
      return { barra: "bg-blue-600", ring: "text-blue-600" };
    case "alto_riesgo":
      return { barra: "bg-brick-700", ring: "text-brick-700" };
  }
}

export function ScoreGauge({
  score,
  size = "lg",
}: {
  score: number;
  size?: "lg" | "sm";
}) {
  const min = 300;
  const max = 800;
  const pct = ((score - min) / (max - min)) * 100;
  const { barra, ring } = colorPorRiesgo(score);
  const large = size === "lg";

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative flex items-center justify-center rounded-full ${large ? "h-44 w-44" : "h-28 w-28"}`}
      >
        <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-soil-400/30"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
            className={barra}
          />
        </svg>
        <div className={`text-center ${ring}`}>
          <div className={`${large ? "text-6xl" : "text-3xl"} font-mono font-semibold tabular-nums`}>
            {score}
          </div>
          {size === "sm" && (
            <div className="text-[10px] uppercase tracking-wide text-soil-400">Score</div>
          )}
        </div>
      </div>
      {size === "lg" && (
        <p className="mt-2 text-xs text-soil-400">
          Rango <span className="tabular-nums">300 – 800</span>
        </p>
      )}
    </div>
  );
}
