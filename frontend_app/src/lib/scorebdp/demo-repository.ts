import {
  defaultWeights,
  type ApplicationRow,
  type Factors,
  type ScoreBdpRepository,
  type Weights,
} from "./contracts";
import { calculateScore, scoreLetter, validateWeights } from "./scoring";
import { readSession, writeSession } from "./storage";
const seed: ApplicationRow = {
  id: 1,
  nombre: "Productora",
  primer_apellido: "Demostración",
  ci: "DEMO-001",
  municipio: "Viacha",
  producto: "Papa",
  monto: 25000,
  fecha: "2026-01-15T12:00:00Z",
};
const synthetic: Factors = {
  perfil_financiero: 0.8,
  viabilidad: 0.6,
  adopcion: 0.5,
  mercado: 0.8,
  riesgo_climatico: 0.3,
};
const all = (): ApplicationRow[] =>
  readSession("bdp:demo:applications:v1", [seed]);
const weights = (): Weights =>
  readSession("bdp:demo:weights:v1", defaultWeights);
export const demoRepository: ScoreBdpRepository = {
  async list(id) {
    return all().filter((row) => id === undefined || row.id === id);
  },
  async catalogs(departamento) {
    return {
      municipios:
        departamento === "La Paz"
          ? [{ codmunicipio: "DEMO-VIACHA", municipio: "Viacha" }]
          : [],
      productos: [
        { id: 1, descripcion: "Papa" },
        { id: 2, descripcion: "Maíz" },
      ],
      caedec: [
        { caedec: "DEMO-AGRO", actividad: "Agricultura · catálogo sintético" },
      ],
    };
  },
  async create(input) {
    const rows = all();
    const id = Math.max(0, ...rows.map((row) => row.id)) + 1;
    const row = {
      id,
      municipio: input.municipio,
      producto: input.producto,
      monto: input.monto,
      fecha: new Date().toISOString(),
      ci: input.ci,
      nombre: input.nombre,
      primer_apellido: input.primer_apellido,
    };
    writeSession("bdp:demo:applications:v1", [...rows, row]);
    return id;
  },
  async evaluate(id) {
    if (!all().some((row) => row.id === id))
      throw new Error("Solicitud no encontrada.");
    const factors: Factors =
      id === 1
        ? { ...synthetic }
        : {
            perfil_financiero: null,
            viabilidad: null,
            adopcion: null,
            mercado: null,
            riesgo_climatico: null,
          };
    const current = weights();
    const score = calculateScore(factors, current);
    return {
      solicitudId: id,
      source: "DEMO",
      date: new Date().toISOString(),
      score,
      letter: scoreLetter(score),
      factors,
      weights: current,
      version: "scorebdp-demo-1",
      warnings: [
        id === 1
          ? "Factores sintéticos de un caso ilustrativo. No proceden de buró, Oracle ni fuentes climáticas."
          : "Solicitud capturada en modo DEMO. No hay factores externos disponibles; no se inventa un score.",
        "El score no aprueba ni rechaza el crédito. Las reglas requieren validación institucional.",
      ],
    };
  },
  async weights() {
    return weights();
  },
  async saveWeights(value) {
    if (!validateWeights(value)) throw new Error("Los pesos deben sumar 100.");
    writeSession("bdp:demo:weights:v1", value);
  },
};
