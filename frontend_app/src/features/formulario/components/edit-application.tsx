"use client";
import { useEffect, useState } from "react";
import { repository, dataMode } from "@/lib/scorebdp";
import { readSession } from "@/lib/scorebdp/storage";
import type { ApplicationInput } from "@/lib/scorebdp/contracts";
import type { AgriculturalCapture } from "../agricultural-capture";
import { emptyApplication } from "../validation";
import { createPilot } from "../pilot";
import { ApplicationForm } from "./application-form";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/shared/page-heading";
export function EditApplication({ id }: { id: number }) {
  const [state, setState] = useState<{
      input: ApplicationInput;
      capture?: AgriculturalCapture;
    } | null>(null),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    repository
      .list(id)
      .then((rows) => {
        if (!active) return;
        const row = rows.find((item) => item.id === id);
        if (!row) throw new Error("Solicitud no encontrada.");
        const saved = readSession<AgriculturalCapture | null>(
          `bdp:${dataMode}:capture:${id}`,
          null,
        );
        setState({
          input: {
            ...emptyApplication,
            ci: row.ci ?? "",
            nombre: row.nombre ?? "",
            primer_apellido: row.primer_apellido ?? "",
            monto: row.monto ?? 0,
            municipio: row.municipio ?? "",
            producto: row.producto ?? "",
          },
          capture:
            saved?.version === 1 && saved.solicitudId === id
              ? saved
              : undefined,
        });
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : "No se pudo recuperar la solicitud.",
          );
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (error) return <ErrorNotice>{error}</ErrorNotice>;
  if (!state) return <p role="status">Recuperando solicitud…</p>;
  return (
    <>
      {dataMode === "demo" && id === 1 && (
        <div className="mb-6 rounded-lg border border-border bg-secondary p-4">
          <p className="mb-3 text-sm">
            Caso piloto opcional: persona, parcela, producción y finanzas
            sintéticas. La evidencia meteorológica se consultará por separado;
            no se simula una respuesta real.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              const pilot = createPilot();
              setState({ input: pilot.application, capture: pilot });
              setRevision((value) => value + 1);
            }}
          >
            Cargar caso piloto sintético
          </Button>
        </div>
      )}
      <ApplicationForm
        key={revision}
        applicationId={id}
        initialInput={state.input}
        initialCapture={state.capture}
      />
    </>
  );
}
