import {
  factorKeys,
  type ApplicationRow,
  type Catalogs,
  type Evaluation,
  type Factors,
  type ScoreBdpRepository,
  type Weights,
} from "./contracts";
import { validateWeights } from "./scoring";
async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/scorebdp/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
    signal: AbortSignal.timeout(25000),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "El backend no pudo completar la operación.",
    );
  return data;
}
const numberOrNull = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? null
    : Number.isFinite(Number(value))
      ? Number(value)
      : null;
export function normalizeEvaluation(
  data: { score: Record<string, unknown>; pesos: Weights },
  id: number,
): Evaluation {
  if (!data.score || !data.pesos || !validateWeights(data.pesos))
    throw new Error("Respuesta de score o pesos inválida.");
  const sc = data.score;
  if (Number(sc.idsolicitud) !== id)
    throw new Error("El resultado no corresponde a la solicitud.");
  const factors: Factors = {
    perfil_financiero: numberOrNull(sc.scorefinanciero),
    viabilidad: numberOrNull(sc.scoreviabilidad),
    adopcion: numberOrNull(sc.scoreadopcion),
    mercado: numberOrNull(sc.scoremercado),
    riesgo_climatico: numberOrNull(sc.scoreclima),
  };
  if (
    factorKeys.some(
      (key) =>
        factors[key] !== null && (factors[key]! < 0 || factors[key]! > 1),
    )
  )
    throw new Error(
      "El backend devolvió factores fuera del rango 0–1. Requieren revisión.",
    );
  const score = numberOrNull(sc.score);
  if (score !== null && (score < 0 || score > 1000))
    throw new Error("El backend devolvió un score fuera de 0–1.000.");
  return {
    solicitudId: id,
    source: "API",
    date: String(sc.fecha ?? new Date().toISOString()),
    score,
    letter: typeof sc.scoreletra === "string" ? sc.scoreletra : null,
    factors,
    weights: data.pesos,
    version: "Versión no informada por el backend",
    warnings: [
      "Resultado recibido de ScoreBDP. La API actual no distingue factores faltantes convertidos en cero: la completitud requiere revisión.",
      "Los pesos mostrados son los devueltos por esta ejecución, no pesos supuestos por la interfaz.",
      "Este resultado apoya al oficial; no aprueba ni rechaza el crédito.",
    ],
  };
}
export const apiRepository: ScoreBdpRepository = {
  list(id) {
    return request<ApplicationRow[]>(
      `solicitudes${id === undefined ? "" : `?item_id=${id}`}`,
    );
  },
  async catalogs(departamento) {
    const [municipios, productos, caedec] = await Promise.all([
      request<Catalogs["municipios"]>(
        `municipios?departamento=${encodeURIComponent(departamento)}`,
      ),
      request<Catalogs["productos"]>("productos"),
      request<Catalogs["caedec"]>("caedec"),
    ]);
    return { municipios, productos, caedec };
  },
  async create(input) {
    const response = await request<{ solicitud: { id: number } }>(
      "solicitud",
      input,
    );
    if (!Number.isInteger(response.solicitud?.id))
      throw new Error("El servidor no devolvió un id de solicitud válido.");
    return response.solicitud.id;
  },
  async evaluate(id) {
    return normalizeEvaluation(await request("score/generate/" + id, {}), id);
  },
  async weights() {
    const rows =
      await request<(Weights & { id: number; fecha: string })[]>("F_SCO_PESOS");
    if (!Array.isArray(rows) || rows.length === 0)
      throw new Error(
        "No hay pesos consultables. No se asumirá la configuración del servidor.",
      );
    if (rows.length >= 200)
      throw new Error(
        "El catálogo alcanzó el límite de 200 registros; se necesita un endpoint de pesos vigentes.",
      );
    const latest = [...rows].sort(
      (a, b) => String(b.fecha).localeCompare(String(a.fecha)) || b.id - a.id,
    )[0];
    const result = Object.fromEntries(
      factorKeys.map((key) => [key, Number(latest[key])]),
    ) as Weights;
    if (!validateWeights(result))
      throw new Error("Los pesos del backend no son válidos.");
    return result;
  },
  async saveWeights(weights) {
    if (!validateWeights(weights))
      throw new Error("Los pesos deben sumar 100.");
    await request("pesos", weights);
  },
};
