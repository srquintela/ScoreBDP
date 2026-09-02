import { notFound } from "next/navigation";
import { obtenerSolicitud } from "@/lib/data/solicitudes";
import { calcularScore } from "@/lib/scoring/engine";
import { clasificarRiesgo, ETIQUETA_RIESGO } from "@/lib/scoring/explain";
import { ScoreGauge } from "@/components/score/ScoreGauge";
import { ScoreBreakdown } from "@/components/score/ScoreBreakdown";
import { ExplanationPanel } from "@/components/score/ExplanationPanel";
import { Badge } from "@/components/ui/Badge";

export default async function SolicitudDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const solicitud = obtenerSolicitud(id);
  if (!solicitud) notFound();

  const score = calcularScore(solicitud);
  const riesgo = clasificarRiesgo(score.total);

  const tone =
    riesgo === "elegible" ? "positive" : riesgo === "alto_riesgo" ? "error" : "warn";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-soil-400">{solicitud.codigo}</p>
          <h2 className="font-display text-2xl font-semibold text-soil-900">
            {solicitud.productor}
          </h2>
          <p className="text-sm text-soil-500">
            {solicitud.cultivoSolicitado} · {solicitud.parcela} ·{" "}
            {solicitud.departamento}
          </p>
        </div>
        <Badge tone={tone}>{ETIQUETA_RIESGO[riesgo]}</Badge>
      </div>

      {/* Un momento de énfasis: el score grande */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-md border border-soil-900/15 bg-wheat-100 px-6 py-8">
          <p className="mb-2 text-sm font-medium text-soil-400">BDP Score</p>
          <ScoreGauge score={score.total} />
          <div className="mt-4 w-full border-t border-soil-900/15 pt-4 text-center text-sm">
            <p className="text-soil-500">Monto solicitado</p>
            <p className="font-mono text-lg font-semibold tabular-nums text-soil-900">
              Bs {solicitud.montoSolicitado.toLocaleString("es-BO")}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <ScoreBreakdown capas={score.capas} />
        </div>
      </section>

      {/* Segundo elemento más importante: la explicación */}
      <section className="rounded-md border border-soil-900/15 bg-wheat-100 p-6">
        <ExplanationPanel score={score} />
      </section>
    </div>
  );
}
