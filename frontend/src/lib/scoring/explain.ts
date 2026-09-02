import type { ResultadoScore, SolicitudInput } from "@/lib/types";

export type NivelRiesgo =
  | "alto_riesgo"
  | "riesgo_medio"
  | "riesgo_moderado"
  | "elegible";

export function clasificarRiesgo(score: number): NivelRiesgo {
  if (score >= 700) return "elegible";
  if (score >= 600) return "riesgo_moderado";
  if (score >= 480) return "riesgo_medio";
  return "alto_riesgo";
}

export const ETIQUETA_RIESGO: Record<NivelRiesgo, string> = {
  elegible: "Elegible para crédito",
  riesgo_moderado: "Elegible con condiciones",
  riesgo_medio: "Revisión especial",
  alto_riesgo: "Crédito no recomendado",
};

export function explicarRiesgo(score: number): string {
  switch (clasificarRiesgo(score)) {
    case "elegible":
      return "El score supera el umbral de financiamiento. El oficial puede proceder con la propuesta de crédito.";
    case "riesgo_moderado":
      return "Dentro de rango, pero conviene aplicar condiciones de garantía o plazo ajustado antes de aprobar.";
    case "riesgo_medio":
      return "Requiere revisión adicional del analista de riesgo antes de tomar una decisión.";
    case "alto_riesgo":
      return "El score no alcanza el umbral mínimo. La propuesta no se recomienda en las condiciones actuales.";
  }
}

/**
 * Resumen accionable en el tono del equipo de riesgo: explica la causa y la
 * acción concreta para subir el score, sin tono robótico de error.
 */
export function resumenExplicativo(
  input: SolicitudInput,
  score: ResultadoScore
): string {
  const capaDominante = [...score.capas].sort((a, b) => a.peso - b.peso)[0] ?? score.capas[0];
  const mejorRecomendacion = score.recomendaciones[0];

  if (clasificarRiesgo(score.total) === "elegible") {
    return `La combinación de ${input.potencial.nivel} potencial, alineación de vocación y un perfil crediticio sólido le da la confianza necesaria. ${mejorRecomendacion ? "Si busca aún más margen: " + mejorRecomendacion.detalle : ""}`.trim();
  }

  const causa = score.capas
    .filter((c) => c.puntajeBruto < 0)
    .map((c) => c.nombre.toLowerCase())
    .join(" y ");

  if (mejorRecomendacion) {
    return `La principal traba está en ${capaDominante.nombre.toLowerCase()}. ${mejorRecomendacion.titulo}: suma ${mejorRecomendacion.impacto} puntos.${causa ? ` Los puntos negativos vienen de ${causa}.` : ""}`;
  }

  return `El resultado se explica por la suma de las cuatro capas sin puntos negativos, pero aún no alcanza el umbral.`;
}
