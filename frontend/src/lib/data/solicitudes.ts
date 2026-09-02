import type { SolicitudInput, EstadoSolicitud } from "@/lib/types";
import { calcularScore } from "@/lib/scoring/engine";

export type SolicitudGuardada = SolicitudInput & {
  estado: EstadoSolicitud;
  fechaCreacion: string;
  oficialId: string;
  score?: number;
};

// Repositorio en memoria con datos mock. En producción esto se conecta a la
// base de datos / backend de crédito de BDP.
const repo = new Map<string, SolicitudGuardada>();

const base: Omit<SolicitudGuardada, "potencial" | "vocacion" | "complejidad" | "perfil"> = {
  id: "",
  codigo: "",
  productor: "",
  ci: "",
  cultivoSolicitado: "",
  parcela: "",
  departamento: "",
  montoSolicitado: 0,
  plazoMeses: 0,
  estado: "en_evaluacion",
  fechaCreacion: new Date().toISOString(),
  oficialId: "of-001",
};

function seed(): SolicitudGuardada[] {
  const s1: SolicitudInput = {
    id: "SC-2026-0001",
    codigo: "SC-2026-0001",
    productor: "Juan Mamani Quispe",
    ci: "5478123 LP",
    cultivoSolicitado: "Quinua",
    parcela: "Parcela A — Colomi",
    departamento: "Cochabamba",
    montoSolicitado: 180000,
    plazoMeses: 12,
    potencial: { nivel: "alto", rendimiento: 82, justificacion: "Suelo alto rendimiento para quinua" },
    vocacion: { nivel: "segunda_ronda", justificacion: "Tercera campaña de quinua en la zona" },
    complejidad: { nivel: "alta", complementarios: 4, justificacion: "Alterna con papa y haba" },
    perfil: { estado: "limpio", antiguedadMeses: 36, deudaIngresoRatio: 0.28 },
  };

  const s2: SolicitudInput = {
    id: "SC-2026-0002",
    codigo: "SC-2026-0002",
    productor: "María Choque",
    ci: "4890123 CB",
    cultivoSolicitado: "Plátano",
    parcela: "Parcela B — Villa Tunari",
    departamento: "Cochabamba",
    montoSolicitado: 240000,
    plazoMeses: 24,
    potencial: { nivel: "medio", rendimiento: 55 },
    vocacion: { nivel: "no", justificacion: "Zona con vocación de cacao" },
    complejidad: { nivel: "monocultivo", complementarios: 1 },
    perfil: { estado: "default_previo", antiguedadMeses: 5, deudaIngresoRatio: 0.72 },
  };

  const s3: SolicitudInput = {
    id: "SC-2026-0003",
    codigo: "SC-2026-0003",
    productor: "Pedro Quispe",
    ci: "6012387 SC",
    cultivoSolicitado: "Maíz",
    parcela: "Parcela C — San Julián",
    departamento: "Santa Cruz",
    montoSolicitado: 95000,
    plazoMeses: 10,
    potencial: { nivel: "bajo", rendimiento: 38 },
    vocacion: { nivel: "si", justificacion: "Maíz alineado a la vocación" },
    complejidad: { nivel: "media", complementarios: 2 },
    perfil: { estado: "regular", antiguedadMeses: 14, deudaIngresoRatio: 0.48 },
  };

  return [s1, s2, s3].map((s) => ({
    ...base,
    ...s,
    score: calcularScore(s).total,
  }));
}

export function listarSolicitudes(): SolicitudGuardada[] {
  if (repo.size === 0) {
    for (const s of seed()) {
      repo.set(s.id, s);
    }
  }
  return [...repo.values()].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));
}

export function obtenerSolicitud(id: string): SolicitudGuardada | undefined {
  return listarSolicitudes().find((s) => s.id === id);
}

export function guardarSolicitud(
  data: SolicitudInput,
  oficialId: string,
  estado: EstadoSolicitud = "en_evaluacion"
): SolicitudGuardada {
  const existente = repo.get(data.id);
  const guardada: SolicitudGuardada = {
    ...data,
    estado: existente?.estado ?? estado,
    fechaCreacion: existente?.fechaCreacion ?? new Date().toISOString(),
    oficialId,
    score: calcularScore(data).total,
  };
  repo.set(data.id, guardada);
  return guardada;
}

export function crearSolicitudBruta(
  data: SolicitudInput,
  oficialId: string
): SolicitudGuardada {
  repo.set(data.id, { ...data, estado: "borrador", fechaCreacion: new Date().toISOString(), oficialId });
  return repo.get(data.id)!;
}
