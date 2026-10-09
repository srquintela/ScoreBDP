"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { repository, dataMode } from "@/lib/scorebdp";
import {
  factorKeys,
  factorLabels,
  type ApplicationRow,
  type Evaluation,
  type Supplement,
} from "@/lib/scorebdp/contracts";
import { contribution } from "@/lib/scorebdp/scoring";
import { readSession, writeSession } from "@/lib/scorebdp/storage";
import { financialIndicators } from "@/features/formulario/validation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PageHeading,
  ErrorNotice,
  money,
  decimal,
} from "@/components/shared/page-heading";
import type { AgriculturalCapture } from "@/features/formulario/agricultural-capture";
import { EvidencePanels } from "./evidence-panels";
import { ScoreChart } from "./score-chart";
import { ScoreGauge } from "./score-gauge";
import { defaultWeights } from "@/lib/scorebdp/contracts";
const sourceLabels = {
  perfil_financiero: "Calificación de buró por CI",
  viabilidad: "Indicador bs por municipio y producto",
  adopcion: "Indicador sectorial por municipio y producto",
  mercado: "Indicador vcr por municipio y producto",
  riesgo_climatico: "Riesgo municipal por mes de siembra",
};
export function EvaluationView({ id }: { id: number }) {
  const [capture, setCapture] = useState<AgriculturalCapture | null>(null);
  const [row, setRow] = useState<ApplicationRow | null>(null);
  const [result, setResult] = useState<Evaluation | null>(null);
  const [supplement, setSupplement] = useState<Supplement | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("resumen");
  useEffect(() => {
    let active = true;
    repository
      .list(id)
      .then((rows) => {
        if (!active) return;
        setRow(rows.find((item) => item.id === id) ?? null);
        const stored = readSession<Evaluation | null>(
          `bdp:${dataMode}:result:${id}`,
          null,
        );
        if (stored?.solicitudId === id) setResult(stored);
        setSupplement(
          readSession<Supplement | null>(
            `bdp:${dataMode}:supplement:${id}`,
            null,
          ),
        );
        const saved = readSession<AgriculturalCapture | null>(
          `bdp:${dataMode}:capture:${id}`,
          null,
        );
        if (saved?.version === 1 && saved.solicitudId === id) setCapture(saved);
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "No se pudo consultar.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  async function generate() {
    setBusy(true);
    setError("");
    try {
      const value = await repository.evaluate(id);
      setResult(value);
      try {
        writeSession(`bdp:${dataMode}:result:${id}`, value);
      } catch {
        setError(
          "El resultado se obtuvo, pero no pudo conservarse en el navegador.",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el score.");
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p role="status">Cargando expediente…</p>;
  if (!row)
    return (
      <>
        <PageHeading
          title="Expediente no disponible"
          description="No se encontró la solicitud o no fue posible consultar el backend."
        />
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <Button asChild>
          <Link href="/solicitudes">Volver a solicitudes</Link>
        </Button>
      </>
    );
  const finance =
    supplement && capture?.period !== "SEASONAL"
      ? financialIndicators(supplement)
      : null;
  return (
    <>
      <Link
        className="mb-5 inline-block text-sm text-primary underline"
        href="/solicitudes"
      >
        ← Volver a solicitudes
      </Link>
      <PageHeading
        title={`Expediente #${id}`}
        description={`${row.nombre ?? ""} ${row.primer_apellido ?? ""} · ${row.producto ?? "Sin producto"} · ${row.municipio ?? "Sin municipio"}`}
        action={
          <Badge>
            {dataMode === "demo" ? "DEMO · datos sintéticos" : "API ScoreBDP"}
          </Badge>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Monto solicitado", money(row.monto)],
          ["CI", row.ci ?? "No disponible"],
          ["Fecha de solicitud", row.fecha?.slice(0, 10) ?? "No disponible"],
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      <div
        className="mb-6 flex flex-wrap gap-2"
        role="group"
        aria-label="Secciones del expediente"
      >
        {[
          ["resumen", "Score y aportes"],
          ["finanzas", "Finanzas"],
          ["produccion", "Producción"],
          ["parcela", "Parcela y mapa"],
          ["clima", "Clima"],
          ["fuentes", "Fuentes y alcance"],
        ].map(([key, label]) => (
          <Button
            key={key}
            variant={tab === key ? "default" : "outline"}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Button asChild variant="outline">
          <Link href={`/solicitudes/${id}/editar`}>
            {capture
              ? "Editar captura agrícola"
              : "Completar evaluación agrícola"}
          </Link>
        </Button>
        {capture && (
          <span className="text-xs text-muted-foreground">
            Captura local: {capture.savedAt} ·{" "}
            {capture.origin === "SYNTHETIC"
              ? "Datos sintéticos"
              : "Datos declarados / importados"}
          </span>
        )}
      </div>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {tab === "resumen" && (
        <>
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <ScoreGauge
                score={result?.score ?? null}
                letter={result?.letter ?? null}
              />
              <div className="max-w-sm">
                <Button
                  onClick={() => void generate()}
                  disabled={busy || !!result}
                >
                  {busy
                    ? "Calculando…"
                    : result
                      ? "Evaluación obtenida"
                      : dataMode === "demo"
                        ? "Ejecutar demostración"
                        : "Generar y guardar score"}
                </Button>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {dataMode === "demo"
                    ? "El caso #1 tiene factores sintéticos completos. Las nuevas capturas quedan pendientes de datos externos."
                    : "Generar score crea un registro en el backend. Esta pantalla evita repetir el envío después de obtener un resultado."}
                </p>
              </div>
            </div>
            {result && (
              <>
                {result.source === "API" && (
                  <p className="mt-5 rounded-lg bg-secondary p-3 text-sm">
                    Completitud no verificada: la API actual no diferencia
                    faltantes convertidos en cero.
                  </p>
                )}
                {factorKeys.some(
                  (key) => result.weights[key] !== defaultWeights[key],
                ) && (
                  <p className="mt-4 text-sm text-danger">
                    Los pesos de esta ejecución difieren de la propuesta
                    70/5/5/5/15. Se muestran los pesos realmente aplicados.
                  </p>
                )}
                <ScoreChart result={result} />
                <div className="mt-8 space-y-5">
                  {factorKeys.map((key) => {
                    const factor = result.factors[key],
                      weight = result.weights[key],
                      points =
                        factor === null
                          ? null
                          : contribution(key, factor, weight);
                    return (
                      <div key={key}>
                        <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                          <span className="font-semibold">
                            {factorLabels[key]}{" "}
                            <span className="font-normal text-muted-foreground">
                              · {weight}%
                            </span>
                          </span>
                          <span>
                            {points === null
                              ? "Pendiente"
                              : `${decimal(points)} / ${weight * 10} pts`}
                          </span>
                        </div>
                        <div
                          className="h-3 overflow-hidden rounded-full bg-secondary"
                          role="meter"
                          aria-label={`${factorLabels[key]}: aporte al score`}
                          aria-valuemin={0}
                          aria-valuemax={Math.max(1, weight * 10)}
                          aria-valuenow={points ?? 0}
                          aria-valuetext={
                            points === null
                              ? "No disponible"
                              : `${points} puntos`
                          }
                        >
                          <div
                            className="h-full rounded-full bg-[#00A0E3]"
                            style={{
                              width: `${points === null || weight === 0 ? 0 : (points / (weight * 10)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-6 text-xs text-muted-foreground">
                  Para clima, el aporte utiliza 1 − riesgo. Pesos y factores
                  quedan asociados a esta ejecución.
                </p>
                <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </>
      )}
      {tab === "finanzas" && (
        <Card className="p-6">
          <h2 className="text-xl font-bold">Información declarada</h2>
          <p className="my-4 text-sm leading-6 text-muted-foreground">
            Estos datos se conservan solo en esta sesión y no intervienen en el
            score institucional actual. La persistencia de este bloque está
            pendiente de integración con Oracle.
          </p>
          {finance ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["Disponible antes de deuda", finance.available],
                  ["Cuotas totales mensuales", finance.payments],
                  ["Remanente mensual", finance.remaining],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-lg bg-secondary p-4"
                  >
                    <p className="text-xs">{label}</p>
                    <p className="mt-2 text-xl font-semibold">
                      {money(value as number | null)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm">
                Carga de cuotas sobre disponible:{" "}
                {finance.ratio === null
                  ? "No calculable"
                  : `${decimal(finance.ratio * 100)}%`}
                . No representa un nivel de riesgo validado.
              </p>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ["Plazo (meses)", supplement?.plazo],
                  ["Saldo de deuda (Bs)", supplement?.deuda],
                  ["Experiencia (años)", supplement?.experiencia],
                  ["Superficie (ha)", supplement?.superficie],
                  ["Rendimiento (kg/ha)", supplement?.rendimiento],
                  ["Costo de campaña (Bs)", supplement?.costo],
                  ["Precio esperado (Bs/kg)", supplement?.precio],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd>{value || "No declarado"}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p>
              {capture?.period === "SEASONAL"
                ? "Ingreso estacional: requiere un flujo de campaña; no se calcula capacidad mensual a partir de promedios."
                : "No hay información complementaria recuperable en esta sesión."}
            </p>
          )}
        </Card>
      )}
      {["produccion", "parcela", "clima"].includes(tab) && (
        <EvidencePanels capture={capture} section={tab} />
      )}
      {tab === "fuentes" && (
        <Card className="overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold">Fuentes y alcance</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {result?.version ?? "Sin evaluación generada"}
              {result ? ` · ${result.date}` : ""}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Factor</th>
                  <th>Valor recibido (0–1)</th>
                  <th>Fuente</th>
                </tr>
              </thead>
              <tbody>
                {factorKeys.map((key) => (
                  <tr key={key}>
                    <td>
                      {key === "riesgo_climatico"
                        ? "Riesgo climático"
                        : factorLabels[key]}
                    </td>
                    <td>{decimal(result?.factors[key] ?? null)}</td>
                    <td>
                      {dataMode === "demo"
                        ? "Ejemplo sintético; no consultado"
                        : sourceLabels[key]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 p-6 text-sm text-muted-foreground">
            <p>
              Los factores viabilidad, adopción y mercado conservan la
              denominación del backend. Su interpretación y normalización
              requieren documentación.
            </p>
            <p>
              Parcela: {capture?.parcel.source ?? "Pendiente"} · Captura Kobo:{" "}
              {capture?.parcel.koboSubmissionId ?? "No disponible"}. Clima de
              parcela:{" "}
              {capture?.climate
                ? `${capture.climate.source}, consultado ${capture.climate.consultedAt}`
                : "No consultado / no disponible"}
              . La evidencia no sustituye el riesgo municipal utilizado por
              ScoreBDP.
            </p>
            <p>
              La metodología del backend y el tratamiento de datos faltantes aún
              requieren revisión antes de usar estos resultados en decisiones.
            </p>
          </div>
        </Card>
      )}
    </>
  );
}
