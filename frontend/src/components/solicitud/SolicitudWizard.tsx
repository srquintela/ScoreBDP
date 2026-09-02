"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { crearSolicitud } from "@/actions/score.actions";
import { calcularScore } from "@/lib/scoring/engine";
import type { SolicitudInput, NivelPotencial, NivelVocacion, NivelComplejidad, PerfilCrediticio } from "@/lib/types";
import { DEPARTAMENTOS_BOLIVIA, type Departamento } from "@/lib/constants/departamentos";
import { Field, inputStyles } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ScoreBreakdown } from "@/components/score/ScoreBreakdown";

function nuevoCodigo(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `SC-2026-${n}`;
}

function inputVacio(): SolicitudInput {
  return {
    id: nuevoCodigo(),
    codigo: "",
    productor: "",
    ci: "",
    cultivoSolicitado: "",
    parcela: "",
    departamento: undefined,
    montoSolicitado: 0,
    plazoMeses: 12,
    potencial: { nivel: "medio", rendimiento: 50 },
    vocacion: { nivel: "si" },
    complejidad: { nivel: "media", complementarios: 1 },
    perfil: { estado: "regular", antiguedadMeses: 0, deudaIngresoRatio: 0 },
  };
}

const STEPS = ["Datos generales", "Potencial", "Vocación", "Complejidad", "Perfil", "Revisión"];

export function SolicitudWizard() {
  const [paso, setPaso] = useState(0);
  const [input, setInput] = useState<SolicitudInput>(inputVacio);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  const score = useMemo(() => calcularScore(input), [input]);

  function set<K extends keyof SolicitudInput>(key: K, value: SolicitudInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();

    if (!input.departamento) {
      return;
    }

    setEnviando(true);
    await crearSolicitud(input);
    // creaSolicitud redirige; por seguridad: si no redirige, volvemos al listado
    router.push("/solicitudes");
  }

  return (
    <form onSubmit={enviar} className="space-y-8">
      {/* Stepper */}
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => setPaso(i)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                i === paso
                  ? "bg-blue-600 text-on-accent"
                  : "bg-wheat-100 text-soil-600 hover:bg-wheat-50"
              }`}
            >
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>

      {/* Paso 1: datos generales */}
      {paso === 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Código" hint="Se asigna automáticamente">
            <input value={input.codigo || input.id} disabled className={inputStyles} />
          </Field>
          <Field label="Productor">
            <input
              value={input.productor}
              onChange={(e) => set("productor", e.target.value)}
              className={inputStyles}
              required
            />
          </Field>
          <Field label="Carnet de identidad">
            <input
              value={input.ci}
              onChange={(e) => set("ci", e.target.value)}
              className={inputStyles}
            />
          </Field>
          <Field label="Cultivo solicitado">
            <input
              value={input.cultivoSolicitado}
              onChange={(e) => set("cultivoSolicitado", e.target.value)}
              className={inputStyles}
              placeholder="Ej. Quinua"
            />
          </Field>
          <Field label="Parcela / Comunidad">
            <input
              value={input.parcela}
              onChange={(e) => set("parcela", e.target.value)}
              className={inputStyles}
            />
          </Field>
          <Field label="Departamento">
            <select
              value={input.departamento ?? ""}
              onChange={(e) => set("departamento", e.target.value as Departamento)}
              className={inputStyles}
              required
            >
              <option value="">Selecciona un departamento</option>
              {DEPARTAMENTOS_BOLIVIA.map((departamento) => (
                <option key={departamento} value={departamento}>
                  {departamento}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Monto solicitado (Bs)">
            <input
              type="number"
              value={input.montoSolicitado || ""}
              onChange={(e) => set("montoSolicitado", Number(e.target.value))}
              className={inputStyles}
            />
          </Field>
          <Field label="Plazo (meses)">
            <input
              type="number"
              value={input.plazoMeses}
              onChange={(e) => set("plazoMeses", Number(e.target.value))}
              className={inputStyles}
            />
          </Field>
        </div>
      )}

      {/* Paso 2: Potencial */}
      {paso === 1 && (
        <div className="grid grid-cols-1 gap-4">
          <Field label="Nivel de potencial" hint="Capacidad de rendimiento del terreno para el cultivo solicitado">
            <div className="flex gap-2">
              {(["alto", "medio", "bajo"] as NivelPotencial[]).map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => set("potencial", { ...input.potencial, nivel: n })}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize ${
                    input.potencial.nivel === n
                      ? "border-blue-600 bg-blue-100 text-blue-600"
                      : "border-soil-900/15 text-soil-600"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Índice de rendimiento (0-100)">
            <input
              type="range"
              min={0}
              max={100}
              value={input.potencial.rendimiento}
              onChange={(e) =>
                set("potencial", { ...input.potencial, rendimiento: Number(e.target.value) })
              }
              className="w-full"
            />
            <span className="font-mono text-sm tabular-nums text-soil-900">
              {input.potencial.rendimiento}/100
            </span>
          </Field>
        </div>
      )}

      {/* Paso 3: Vocación */}
      {paso === 2 && (
        <Field label="Alineación con la vocación productiva de la zona">
          <div className="flex flex-col gap-2 sm:flex-row">
            {(
              [
                ["si", "Sí, alineado"],
                ["no", "No alineado"],
                ["segunda_ronda", "2da+ ronda mismo producto"],
              ] as [NivelVocacion, string][]
            ).map(([val, label]) => (
              <button
                type="button"
                key={val}
                onClick={() => set("vocacion", { ...input.vocacion, nivel: val })}
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                  input.vocacion.nivel === val
                    ? "border-blue-600 bg-blue-100 text-blue-600"
                    : "border-soil-900/15 text-soil-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>
      )}

      {/* Paso 4: Complejidad */}
      {paso === 3 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Resiliencia circular">
            <div className="flex gap-2">
              {(["alta", "media", "monocultivo"] as NivelComplejidad[]).map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => set("complejidad", { ...input.complejidad, nivel: n })}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize ${
                    input.complejidad.nivel === n
                      ? "border-blue-600 bg-blue-100 text-blue-600"
                      : "border-soil-900/15 text-soil-600"
                  }`}
                >
                  {n === "monocultivo" ? "Monocultivo" : n}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Cultivos complementarios">
            <input
              type="number"
              value={input.complejidad.complementarios}
              onChange={(e) =>
                set("complejidad", {
                  ...input.complejidad,
                  complementarios: Number(e.target.value),
                })
              }
              className={inputStyles}
            />
          </Field>
        </div>
      )}

      {/* Paso 5: Perfil crediticio */}
      {paso === 4 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Historial de pagos">
            <div className="flex gap-2">
              {(
                [
                  ["limpio", "Limpio"],
                  ["regular", "Regular"],
                  ["default_previo", "Default previo"],
                ] as [PerfilCrediticio, string][]
              ).map(([val, label]) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => set("perfil", { ...input.perfil, estado: val })}
                  className={`flex-1 rounded-md border px-3 py-2 text-xs sm:text-sm ${
                    input.perfil.estado === val
                      ? "border-blue-600 bg-blue-100 text-blue-600"
                      : "border-soil-900/15 text-soil-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Antigüedad (meses)">
            <input
              type="number"
              value={input.perfil.antiguedadMeses}
              onChange={(e) =>
                set("perfil", { ...input.perfil, antiguedadMeses: Number(e.target.value) })
              }
              className={inputStyles}
            />
          </Field>
          <Field label="Relación deuda-ingreso (0-1)">
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={input.perfil.deudaIngresoRatio || ""}
              onChange={(e) =>
                set("perfil", { ...input.perfil, deudaIngresoRatio: Number(e.target.value) })
              }
              className={inputStyles}
            />
          </Field>
        </div>
      )}

      {/* Paso 6: Revisión */}
      {paso === 5 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-md border border-soil-900/15 bg-wheat-100 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-soil-900">
                Desglose del puntaje
              </h3>
              <span className="font-mono text-3xl font-bold tabular-nums text-soil-900">
                {score.total}
              </span>
            </div>
            <ScoreBreakdown capas={score.capas} />
          </div>
          <div className="rounded-md border border-soil-900/15 bg-wheat-100 p-5">
            <h3 className="font-display text-lg font-semibold text-soil-900">
              Resumen
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                ["Productor", input.productor || "—"],
                ["Cultivo", input.cultivoSolicitado || "—"],
                ["Monto", input.montoSolicitado ? `Bs ${input.montoSolicitado.toLocaleString("es-BO")}` : "—"],
                ["Parcela", input.parcela || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-soil-400">{k}</dt>
                  <dd className="text-right font-medium text-soil-900">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {/* Navegación */}
      <div className="flex items-center justify-between border-t border-soil-900/10 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setPaso((p) => Math.max(0, p - 1))}
          disabled={paso === 0}
        >
          Anterior
        </Button>

        {paso < STEPS.length - 1 ? (
          <Button type="button" onClick={() => setPaso((p) => Math.min(STEPS.length - 1, p + 1))}>
            Siguiente
          </Button>
        ) : (
          <Button type="submit" disabled={enviando}>
            {enviando ? "Calificando…" : "Calcular puntaje"}
          </Button>
        )}
      </div>
    </form>
  );
}
