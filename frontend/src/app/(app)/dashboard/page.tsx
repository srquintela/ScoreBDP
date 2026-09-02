import { listarSolicitudes } from "@/lib/data/solicitudes";
import { calcularScore } from "@/lib/scoring/engine";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export default async function DashboardPage() {
  const solicitudes = listarSolicitudes();

  const carteraTotal = solicitudes.reduce((a, s) => a + s.montoSolicitado, 0);
  const conScore = solicitudes.map((s) => calcularScore(s));
  const promedio = conScore.length
    ? Math.round(conScore.reduce((a, c) => a + c.total, 0) / conScore.length)
    : 0;
  const baja = conScore.filter((c) => c.total < 480).length;
  const pctBaja = solicitudes.length ? Math.round((baja / solicitudes.length) * 100) : 0;

  // Promedio de puntaje bruto por capa (para la distribución)
  const capasDist = (["potencial", "vocacion", "complejidad", "perfil"] as const).map(
    (clave) => {
      const capas = conScore.map((c) => c.capas.find((x) => x.clave === clave)!);
      const prom = capas.length
        ? Math.round(capas.reduce((a, c) => a + c.puntajeBruto, 0) / capas.length)
        : 0;
      return { clave, nombre: capas[0]?.nombre ?? clave, prom };
    }
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-2xl font-semibold text-soil-900">
          Resumen de cartera
        </h2>
        <p className="text-sm text-soil-500">
          Cartera de créditos agrícolas en evaluación, primer piso.
        </p>
      </section>

      {/* KPIs tipo ledger */}
      <section className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-soil-900/15 bg-soil-900/10 sm:grid-cols-3">
        {[
          { label: "Cartera en evaluación", valor: carteraTotal.toLocaleString("es-BO"), pref: "Bs " },
          { label: "Score promedio", valor: String(promedio), pref: "" },
          { label: "Solicitudes bajo umbral", valor: `${pctBaja}%`, pref: "" },
        ].map((k) => (
          <div key={k.label} className="bg-wheat-100 px-5 py-4">
            <p className="text-xs text-soil-400">{k.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-soil-900">
              {k.pref}
              {k.valor}
            </p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Distribución por capa */}
        <section className="rounded-md border border-soil-900/15 bg-wheat-100 p-5">
          <h3 className="font-display text-lg font-semibold text-soil-900">
            Distribución por capa
          </h3>
          <p className="mb-4 text-sm text-soil-500">
            Puntaje bruto promedio de la cartera por cada capa del motor.
          </p>
          <ul className="space-y-3">
            {capasDist.map((c) => (
              <li key={c.clave}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-soil-900">{c.nombre}</span>
                  <span
                    className={`font-mono tabular-nums ${
                      c.prom < 0 ? "text-brick-700" : "text-blue-400"
                    }`}
                  >
                    {c.prom > 0 ? "+" : ""}
                    {c.prom}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-wheat-100">
                  <div
                    className={`h-full ${c.prom < 0 ? "bg-brick-700" : "bg-blue-400"}`}
                    style={{ width: `${Math.min(100, Math.abs(c.prom) * 3)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Solicitudes recientes */}
        <section className="rounded-md border border-soil-900/15 bg-wheat-100 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-soil-900">
              Solicitudes recientes
            </h3>
            <Link
              href="/solicitudes"
              className="text-sm font-medium text-blue-600 hover:text-blue-400 hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <ul className="divide-y divide-soil-900/10">
            {solicitudes.slice(0, 5).map((s) => {
              const sc = s.score ?? calcularScore(s).total;
              return (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-soil-900">{s.productor}</p>
                    <p className="text-xs text-soil-400">
                      {s.cultivoSolicitado} · {s.departamento}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-semibold tabular-nums text-soil-900">
                      {sc}
                    </span>
                    {sc < 480 ? <Badge tone="error">Bajo</Badge> : <Badge tone="positive">Ok</Badge>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Zonas con potencial y bajo financiamiento (unlock) */}
      <section className="rounded-md border border-soil-900/15 bg-blue-100/40 p-5">
        <h3 className="font-display text-lg font-semibold text-soil-900">
          Potencial desatendido
        </h3>
        <p className="mb-4 text-sm text-soil-600">
          Zonas con alto índice de rendimiento y poca oferta de crédito. Son
          candidatas a ampliar cobertura.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { zona: "Colomi — Cochabamba", cultivo: "Quinua", rendimiento: "82/100", financiamiento: "Bajo" },
            { zona: "San Julián — Santa Cruz", cultivo: "Soya", rendimiento: "78/100", financiamiento: "Medio" },
            { zona: "Caranavi — La Paz", cultivo: "Café arábica", rendimiento: "75/100", financiamiento: "Bajo" },
          ].map((z) => (
            <div key={z.zona} className="rounded-md border border-blue-600/20 bg-wheat-50 p-4">
              <p className="font-medium text-soil-900">{z.zona}</p>
              <p className="text-sm text-soil-500">
                {z.cultivo} · Rendimiento <span className="tabular-nums">{z.rendimiento}</span>
              </p>
              <p className="mt-1 text-xs font-medium text-blue-700">
                Financiamiento: {z.financiamiento}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
