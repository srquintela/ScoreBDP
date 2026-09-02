import type { ResultadoCapa } from "@/lib/types";

export function ScoreBreakdown({ capas }: { capas: ResultadoCapa[] }) {
  // Fila de total al estilo partida contable
  const contribucionTotal = capas.reduce((acc, c) => acc + c.puntos, 0);

  return (
    <div className="overflow-hidden rounded-md border border-soil-900/15 bg-wheat-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-soil-900/15 text-left text-[11px] uppercase tracking-wide text-soil-400">
            <th className="px-4 py-3 font-semibold">Capa</th>
            <th className="px-4 py-3 font-semibold">Peso</th>
            <th className="px-4 py-3 text-right font-semibold">Puntos</th>
            <th className="hidden px-4 py-3 font-semibold md:table-cell">
              Justificación
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-soil-900/10">
          {capas.map((c) => (
            <tr key={c.clave}>
              <td className="px-4 py-3">
                <span className="font-medium text-soil-900">{c.nombre}</span>
                <span className="ml-2 text-xs capitalize text-soil-400">
                  {c.nivel}
                </span>
              </td>
              <td className="px-4 py-3 tabular-nums text-soil-600">
                {Math.round(c.peso * 100)}%
              </td>
              <td
                className={`px-4 py-3 text-right font-mono font-semibold tabular-nums ${
                  c.puntajeBruto < 0 ? "text-brick-700" : "text-blue-400"
                }`}
              >
                {c.puntajeBruto > 0 ? "+" : ""}
                {c.puntajeBruto}
              </td>
              <td className="hidden px-4 py-3 text-soil-600 md:table-cell">
                {c.justificacion}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-soil-900/15">
            <td className="px-4 py-3 font-semibold text-soil-900">
              Contribución ponderada
            </td>
            <td className="px-4 py-3 tabular-nums text-soil-600">100%</td>
            <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-soil-900">
              {contribucionTotal >= 0 ? "+" : ""}
              {contribucionTotal.toFixed(2)}
            </td>
            <td className="hidden px-4 py-3 md:table-cell" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
