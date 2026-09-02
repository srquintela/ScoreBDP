import Link from "next/link";
import { listarSolicitudes } from "@/lib/data/solicitudes";
import { calcularScore } from "@/lib/scoring/engine";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

function toneEstado(s: { score?: number }): "positive" | "warn" | "error" {
  const sc = s.score ?? 0;
  if (sc >= 600) return "positive";
  if (sc >= 480) return "warn";
  return "error";
}

export default function SolicitudesPage() {
  const solicitudes = listarSolicitudes();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-soil-900">
            Solicitudes de crédito
          </h2>
          <p className="text-sm text-soil-500">
            {solicitudes.length} en cartera · calificadas con BDP Score
          </p>
        </div>
        <Link href="/solicitudes/nueva">
          <Button>Nueva solicitud</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-md border border-soil-900/15 bg-wheat-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-soil-900/15 text-left text-[11px] uppercase tracking-wide text-soil-400">
              <th className="px-4 py-3 font-semibold">Código</th>
              <th className="px-4 py-3 font-semibold">Productor</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">Cultivo</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">Zona</th>
              <th className="px-4 py-3 text-right font-semibold">Monto</th>
              <th className="px-4 py-3 text-right font-semibold">Score</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-soil-900/10">
            {solicitudes.map((s) => {
              const sc = s.score ?? calcularScore(s).total;
              return (
                <tr key={s.id} className="hover:bg-wheat-50">
                  <td className="px-4 py-3 font-mono text-xs text-soil-500">{s.codigo}</td>
                  <td className="px-4 py-3 font-medium text-soil-900">{s.productor}</td>
                  <td className="hidden px-4 py-3 text-soil-600 md:table-cell">
                    {s.cultivoSolicitado}
                  </td>
                  <td className="hidden px-4 py-3 text-soil-600 sm:table-cell">{s.parcela}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-soil-900">
                    {s.montoSolicitado.toLocaleString("es-BO")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-lg font-semibold tabular-nums text-soil-900">
                      {sc}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Badge tone={toneEstado(s)}>
                        {sc >= 480 ? "Elegible" : "Riesgo"}
                      </Badge>
                      <Link
                        href={`/solicitudes/${s.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-400 hover:underline"
                      >
                        Ver
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
