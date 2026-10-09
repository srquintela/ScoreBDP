"use client";
import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  koboBaseSubmissionToParcelPatch,
  formatKoboSubmissionLabel,
} from "@/lib/kobo/mapper";
import type {
  KoboSubmissionDTO,
  KoboSubmissionsApiResponse,
} from "@/lib/kobo/types";
import type { ParcelDraft } from "@/features/formulario/types";

const DEFAULT_CAPTURE_URL = "https://ee.bdp.com.bo/x/KYNUqQ4Y";
export function KoboImportPanel({
  currentDraft,
  onImport,
  onFallbackToManual,
}: {
  currentDraft: ParcelDraft;
  onImport: (patch: Partial<ParcelDraft>) => void;
  onFallbackToManual: () => void;
}) {
  const [rows, setRows] = useState<KoboSubmissionDTO[]>([]),
    [selected, setSelected] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [reload, setReload] = useState(0),
    [hasMore, setHasMore] = useState(false);
  const [captureUrl, setCaptureUrl] = useState(DEFAULT_CAPTURE_URL);
  const knownSubmissionIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    fetch("/api/kobo/submissions", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body: KoboSubmissionsApiResponse & { hasMore?: boolean } =
          await response.json();
        if (!response.ok || !body.success)
          throw new Error(body.error || "No se pudo consultar Kobo.");
        if (active) {
          const newGeoshapes = body.data.filter(
            (row) => row.hasGeoshape && !knownSubmissionIds.current.has(row.submissionId),
          );
          const latestNew = [...newGeoshapes].sort(
            (a, b) =>
              new Date(b.submissionTime ?? b.startedAt ?? 0).getTime() -
              new Date(a.submissionTime ?? a.startedAt ?? 0).getTime(),
          )[0];
          setRows(body.data);
          setHasMore(!!body.hasMore);
          if (body.captureUrl) setCaptureUrl(body.captureUrl);
          if (latestNew) {
            setSelected(latestNew.submissionId);
            setConfirmed(false);
          } else {
            const newest = [...body.data]
              .filter((row) => row.hasGeoshape)
              .sort(
                (a, b) =>
                  new Date(b.submissionTime ?? b.startedAt ?? 0).getTime() -
                  new Date(a.submissionTime ?? a.startedAt ?? 0).getTime(),
              )[0];
            if (newest) {
              setSelected((current) => current || newest.submissionId);
            }
          }
          knownSubmissionIds.current = new Set(body.data.map((row) => row.submissionId));
          setError("");
        }
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "Error al consultar Kobo.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [reload]);
  useEffect(() => {
    function refreshWhenReturningFromKobo() {
      if (document.visibilityState !== "visible") return;
      setLoading(true);
      setReload((value) => value + 1);
    }
    document.addEventListener("visibilitychange", refreshWhenReturningFromKobo);
    return () =>
      document.removeEventListener("visibilitychange", refreshWhenReturningFromKobo);
  }, []);
  function apply() {
    const submission = rows.find((row) => row.submissionId === selected);
    if (!submission || !confirmed) return;
    const converted = koboBaseSubmissionToParcelPatch(
      submission,
      currentDraft.name,
    );
    if (!converted) {
      setError(
        "El polígono no es válido. Selecciona otra captura o usa registro manual.",
      );
      return;
    }
    onImport(converted.patch);
  }
  return (
    <section className="space-y-4 rounded-lg border border-border p-4">
      <h3 className="font-semibold">Evidencia de campo · Kobo</h3>
      <p className="text-sm text-muted-foreground">
        Selecciona y confirma la captura correcta. El sistema no deduce quién es
        su propietario. La superficie importada se calcula desde el polígono.
      </p>
      <div className="flex flex-wrap items-center gap-3 rounded-md bg-primary/5 p-3">
        <Button asChild>
          <a href={captureUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden="true" />
            Abrir Kobo y marcar polígono
          </a>
        </Button>
        <p className="text-sm text-muted-foreground">
          Al volver de Kobo, se buscará la captura nueva y se seleccionará automáticamente.
        </p>
      </div>
      {loading ? (
        <p role="status">Consultando Kobo…</p>
      ) : (
        <>
          <label htmlFor="kobo-capture">
            Captura disponible
            <select
              id="kobo-capture"
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                setConfirmed(false);
              }}
            >
              <option value="">Selecciona una captura</option>
              {rows.map((row) => (
                <option
                  key={row.submissionId}
                  value={row.submissionId}
                  disabled={!row.hasGeoshape}
                >
                  {formatKoboSubmissionLabel(row)}
                  {row.hasGeoshape ? "" : " · sin polígono"}
                </option>
              ))}
            </select>
          </label>
          {!rows.length && !error && <p>No hay capturas disponibles.</p>}
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Confirmo que esta captura corresponde a la parcela de la solicitud.
          </label>
        </>
      )}
      {error && (
        <p className="text-danger" role="alert">
          {error}
        </p>
      )}
      {hasMore && (
        <p className="text-sm">
          Se muestran las primeras 100 capturas. El listado no representa la
          totalidad del formulario.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button disabled={loading || !selected || !confirmed} onClick={apply}>
          Completar superficie y coordenadas
        </Button>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setSelected("");
            setConfirmed(false);
            setReload((value) => value + 1);
          }}
        >
          Actualizar
        </Button>
        <Button variant="outline" onClick={onFallbackToManual}>
          Usar captura manual
        </Button>
      </div>
    </section>
  );
}
