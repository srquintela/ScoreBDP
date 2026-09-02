import type { ResultadoScore, Recomendacion } from "@/lib/types";
import { clasificarRiesgo, ETIQUETA_RIESGO, explicarRiesgo } from "@/lib/scoring/explain";

function iconoCondicion(c: Recomendacion["condicion"]) {
  switch (c) {
    case "cambiar_cultivo":
      return "Cultivo";
    case "diversificar":
      return "Diversificación";
    case "pago":
      return "Pago";
    case "deuda":
      return "Deuda";
    case "antiguedad":
      return "Antigüedad";
  }
}

export function ExplanationPanel({ score }: { score: ResultadoScore }) {
  const riesgo = clasificarRiesgo(score.total);

  return (
    <section aria-label="Explicación del puntaje">
      <div className="mb-3">
        <p className="font-display text-lg font-semibold text-soil-900">
          Por qué este puntaje
        </p>
        <p className="text-sm text-soil-600">
          {ETIQUETA_RIESGO[riesgo]} · {explicarRiesgo(score.total)}
        </p>
      </div>

      {score.recomendaciones.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-soil-700">
            Qué hacer para subir tu score, en orden de impacto:
          </p>
          <ol className="space-y-3">
            {score.recomendaciones.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-md border border-blue-600/25 bg-blue-100/50 p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-mono text-xs font-semibold text-on-accent">
                  +{r.impacto}
                </div>
                <div>
                  <p className="text-sm font-semibold text-soil-900">
                    {r.titulo}
                  </p>
                  <p className="text-sm text-soil-600">{r.detalle}</p>
                  <span className="mt-1 inline-block text-xs font-medium text-blue-400">
                    {iconoCondicion(r.condicion)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="rounded-md border border-soil-900/10 bg-wheat-100 p-4 text-sm text-soil-600">
          El puntaje ya está en el rango más alto. No hay cambios pendientes para
          subirlo.
        </p>
      )}
    </section>
  );
}
