"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/cookies";
import { calcularScore, calcularPuntajeBruto } from "@/lib/scoring/engine";
import {
  guardarSolicitud,
  crearSolicitudBruta,
  obtenerSolicitud,
} from "@/lib/data/solicitudes";
import type { SolicitudInput, ResultadoScore } from "@/lib/types";

export type ScoreActionState =
  | { ok: true; score: ResultadoScore }
  | { ok: false; error: string }
  | undefined;

/**
 * Recalcula el score a partir de un input sin persistir. Lo usa el formulario
 * multi-paso para mostrar el desglose en vivo antes de guardar.
 */
export async function recalcularScore(
  input: SolicitudInput
): Promise<{ score: ResultadoScore; puntajeBruto: number }> {
  return {
    score: calcularScore(input),
    puntajeBruto: calcularPuntajeBruto(input),
  };
}

/**
 * Guarda una solicitud completa y redirige al detalle.
 */
export async function crearSolicitud(input: SolicitudInput): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const existe = obtenerSolicitud(input.id);
  const guardada = existe
    ? guardarSolicitud(input, session.userId)
    : crearSolicitudBruta(input, session.userId);

  redirect(`/solicitudes/${guardada.id}`);
}

export type GuardarBorradorState = { ok: boolean; id?: string; error?: string } | undefined;

export async function guardarBorrador(
  input: SolicitudInput
): Promise<GuardarBorradorState> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sesión no válida" };

  const existe = obtenerSolicitud(input.id);
  const guardada = existe
    ? guardarSolicitud(input, session.userId, "borrador")
    : crearSolicitudBruta(input, session.userId);

  return { ok: true, id: guardada.id };
}
