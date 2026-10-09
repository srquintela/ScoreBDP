export const factorKeys = [
  "perfil_financiero",
  "viabilidad",
  "adopcion",
  "mercado",
  "riesgo_climatico",
] as const;
export type FactorKey = (typeof factorKeys)[number];
export type Weights = Record<FactorKey, number>;
export type Factors = Record<FactorKey, number | null>;
export const defaultWeights: Weights = {
  perfil_financiero: 70,
  viabilidad: 5,
  adopcion: 5,
  mercado: 5,
  riesgo_climatico: 15,
};
export const factorLabels: Record<FactorKey, string> = {
  perfil_financiero: "Financiero",
  viabilidad: "Viabilidad",
  adopcion: "Adopción",
  mercado: "Mercado",
  riesgo_climatico: "Clima favorable",
};
export interface ApplicationInput {
  ci: string;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  fechanac: string;
  genero: string;
  direccion: string;
  departamento: string;
  municipio: string;
  producto: string;
  caedec: string;
  monto: number;
  messiembra: string;
}
export interface ApplicationRow {
  id: number;
  municipio: string | null;
  producto: string | null;
  monto: number | null;
  fecha: string | null;
  ci: string | null;
  nombre: string | null;
  primer_apellido: string | null;
}
export interface Catalogs {
  municipios: { codmunicipio: string; municipio: string }[];
  productos: { id: number; descripcion: string }[];
  caedec: { caedec: string; actividad: string }[];
}
export interface Evaluation {
  solicitudId: number;
  source: "DEMO" | "API";
  date: string;
  score: number | null;
  letter: string | null;
  factors: Factors;
  weights: Weights;
  warnings: string[];
  version: string;
}
export interface Supplement {
  plazo: string;
  cuota: string;
  ingresos: string;
  egresos: string;
  deuda: string;
  cuotasExistentes: string;
  experiencia: string;
  superficie: string;
  rendimiento: string;
  costo: string;
  precio: string;
}
export interface ScoreBdpRepository {
  list(id?: number): Promise<ApplicationRow[]>;
  catalogs(departamento: string): Promise<Catalogs>;
  create(input: ApplicationInput): Promise<number>;
  evaluate(id: number): Promise<Evaluation>;
  weights(): Promise<Weights>;
  saveWeights(weights: Weights): Promise<void>;
}
