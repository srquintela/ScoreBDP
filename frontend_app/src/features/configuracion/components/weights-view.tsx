"use client";
import { useEffect, useState } from "react";
import { repository, dataMode } from "@/lib/scorebdp";
import {
  defaultWeights,
  factorKeys,
  factorLabels,
  type Weights,
} from "@/lib/scorebdp/contracts";
import { validateWeights } from "@/lib/scorebdp/scoring";
import { PageHeading, ErrorNotice } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
export function WeightsView() {
  const [weights, setWeights] = useState<Weights>({ ...defaultWeights });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    repository
      .weights()
      .then((data) => {
        if (active) {
          setWeights(data);
          setMessage("Configuración recuperada.");
        }
      })
      .catch((e) => {
        if (active)
          setError(
            `${e instanceof Error ? e.message : "No se pudieron consultar los pesos."} Los valores del formulario son una propuesta local, no la configuración confirmada.`,
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const total = factorKeys.reduce((sum, key) => sum + weights[key], 0);
  async function save() {
    setError("");
    setMessage("");
    if (!validateWeights(weights)) {
      setError(
        "Cada peso debe estar entre 0 y 100 y el total debe sumar 100%.",
      );
      return;
    }
    setBusy(true);
    try {
      await repository.saveWeights(weights);
      setMessage(
        dataMode === "demo"
          ? "Pesos DEMO guardados para esta sesión."
          : "El backend confirmó el guardado de los pesos.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title="Configuración de pesos"
        description="La propuesta del MVP asigna 70% a financiero, 15% a clima y 5% a cada dimensión restante."
      />
      <Card className="max-w-3xl p-6">
        <p className="mb-6 text-sm text-muted-foreground">
          Los cambios se aplican a nuevas evaluaciones. Cada resultado de esta
          sesión conserva los pesos utilizados al calcularlo.
        </p>
        {loading ? (
          <p role="status">Consultando configuración…</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <div className="space-y-5">
              {factorKeys.map((key) => (
                <label
                  key={key}
                  htmlFor={key}
                  className="grid items-center gap-3 sm:grid-cols-[1fr_150px]"
                >
                  <span>
                    {factorLabels[key]}{" "}
                    <span className="font-normal text-muted-foreground">
                      (%)
                    </span>
                  </span>
                  <Input
                    id={key}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={Number.isNaN(weights[key]) ? "" : weights[key]}
                    onChange={(e) => {
                      setWeights((prev) => ({
                        ...prev,
                        [key]:
                          e.target.value === "" ? NaN : Number(e.target.value),
                      }));
                      setMessage("");
                    }}
                  />
                </label>
              ))}
            </div>
            <div className="my-6 flex justify-between rounded-lg bg-secondary p-4">
              <strong>Total</strong>
              <strong>
                {Number.isFinite(total) ? total.toFixed(2) : "—"}%
              </strong>
            </div>
            {error && <ErrorNotice>{error}</ErrorNotice>}
            {message && (
              <p role="status" className="mb-4 text-sm">
                {message}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={busy || !validateWeights(weights)}
              >
                {busy
                  ? "Guardando…"
                  : dataMode === "demo"
                    ? "Guardar en DEMO"
                    : "Guardar en backend"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setWeights({ ...defaultWeights });
                  setMessage("Propuesta 70/5/5/5/15 cargada. Aún no guardada.");
                }}
              >
                Usar propuesta del MVP
              </Button>
            </div>
          </form>
        )}
      </Card>
    </>
  );
}
