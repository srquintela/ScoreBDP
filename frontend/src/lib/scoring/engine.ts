import type {
  SolicitudInput,
  ResultadoScore,
  ResultadoCapa,
  CapaClave,
  Recomendacion,
  NivelPotencial,
  NivelVocacion,
  NivelComplejidad,
  PerfilCrediticio,
} from "@/lib/types";

/**
 * Motor de calificación BDP Score — 100% basado en reglas, sin caja negra.
 *
 *   BDP Score = 0.30·Potencial + 0.20·Vocación + 0.20·Complejidad + 0.30·Perfil crediticio
 *
 * El score parte de una base y cada capa aporta su puntaje según la tabla de
 * reglas. Las contribuciones son lineales y por eso 100% explicables: cada
 * punto del score se puede rastrear hasta la regla que lo generó.
 */

// Base central y factor de escala para llegar al rango 300-800 manteniendo
// desglose lineal y fiel a los puntajes brutos de la tabla.
const BASE = 500;
const ESCALA = 15;
const MIN = 300;
const MAX = 800;

// ----- Reglas por capa (tabla del producto) -----

const POTENCIAL: Record<NivelPotencial, number> = {
  alto: 25,
  medio: 15,
  bajo: -20,
};

const VOCACION: Record<NivelVocacion, number> = {
  segunda_ronda: 25,
  si: 15,
  no: -15,
};

const COMPLEJIDAD: Record<NivelComplejidad, number> = {
  alta: 20,
  media: 12,
  monocultivo: 5,
};

const PERFIL: Record<PerfilCrediticio, number> = {
  limpio: 20,
  regular: 0,
  default_previo: -30,
};

const PESOS: Record<CapaClave, number> = {
  potencial: 0.3,
  vocacion: 0.2,
  complejidad: 0.2,
  perfil: 0.3,
};

const NIVELES: Record<CapaClave, string> = {
  potencial: "Potencial",
  vocacion: "Vocación",
  complejidad: "Complejidad",
  perfil: "Perfil crediticio",
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function nivelPotencial(input: SolicitudInput): string {
  return input.potencial.nivel.charAt(0).toUpperCase() + input.potencial.nivel.slice(1);
}

function justificar(capa: CapaClave, input: SolicitudInput): string {
  switch (capa) {
    case "potencial":
      return `Índice de capacidad de rendimiento ${input.potencial.rendimiento}/100 para ${input.cultivoSolicitado} en ${input.parcela}.`;
    case "vocacion":
      return input.vocacion.nivel === "segunda_ronda"
        ? `Segunda ronda o más del mismo producto en la zona: alta alineación con el mapa de vocación.`
        : input.vocacion.nivel === "si"
          ? `El cultivo solicitado coincide con el mapa de vocación productiva de la zona.`
          : `El cultivo no coincide con la vocación productiva declarada de la zona.`;
    case "complejidad":
      return `${input.complejidad.complementarios} cultivo(s) complementario(s) declarado(s) en la parcela.`;
    case "perfil":
      return `Antigüedad de ${input.perfil.antiguedadMeses} meses y relación deuda-ingreso ${Math.round(
        input.perfil.deudaIngresoRatio * 100
      )}%.`;
  }
}

function construirCapa(
  clave: CapaClave,
  puntajeBruto: number,
  input: SolicitudInput,
  nivel: string
): ResultadoCapa {
  return {
    clave,
    nombre: NIVELES[clave],
    peso: PESOS[clave],
    puntajeBruto,
    puntos: +(PESOS[clave] * puntajeBruto).toFixed(2),
    nivel,
    justificacion: justificar(clave, input),
  };
}

export function calcularPuntajeBruto(input: SolicitudInput): number {
  return (
    POTENCIAL[input.potencial.nivel] +
    VOCACION[input.vocacion.nivel] +
    COMPLEJIDAD[input.complejidad.nivel] +
    PERFIL[input.perfil.estado]
  );
}

export function calcularScore(input: SolicitudInput): ResultadoScore {
  const capas: ResultadoCapa[] = [
    construirCapa("potencial", POTENCIAL[input.potencial.nivel], input, nivelPotencial(input)),
    construirCapa("vocacion", VOCACION[input.vocacion.nivel], input, input.vocacion.nivel),
    construirCapa(
      "complejidad",
      COMPLEJIDAD[input.complejidad.nivel],
      input,
      input.complejidad.nivel
    ),
    construirCapa("perfil", PERFIL[input.perfil.estado], input, input.perfil.estado),
  ];

  const total = clamp(
    Math.round(BASE + capas.reduce((acc, c) => acc + c.peso * c.puntajeBruto, 0) * ESCALA),
    MIN,
    MAX
  );

  return {
    total,
    capas,
    recomendaciones: recomendar(input),
  };
}

/**
 * Genera las recomendaciones accionables ordenadas por impacto potencial.
 * Es el corazón explicativo: "qué cambio concreto subiría el score".
 */
function recomendar(input: SolicitudInput): Recomendacion[] {
  const r: Recomendacion[] = [];

  // Vocación: subir a 2da ronda o alinear al mapa
  if (input.vocacion.nivel !== "segunda_ronda") {
    const delta =
      input.vocacion.nivel === "no"
        ? VOCACION.segunda_ronda - VOCACION.no
        : VOCACION.segunda_ronda - VOCACION.si;
    r.push({
      capa: "vocacion",
      impacto: roundImpacto(delta, PESOS.vocacion),
      titulo: "Repetir el cultivo en ronda siguiente",
      detalle: `Un cultivo ya sembrado en rondas previas alinea más con la vocación de la zona y suma ${roundImpacto(
        delta,
        PESOS.vocacion
      )} puntos a ${NIVELES.vocacion.toLowerCase()}.`,
      condicion: "cambiar_cultivo",
    });
  }

  // Complejidad: diversificar hacia monocultivo -> alta
  if (input.complejidad.nivel !== "alta") {
    const delta = COMPLEJIDAD.alta - COMPLEJIDAD[input.complejidad.nivel];
    r.push({
      capa: "complejidad",
      impacto: roundImpacto(delta, PESOS.complejidad),
      titulo: "Diversificar con cultivos complementarios",
      detalle: `Agregar cultivos complementarios a la parcela pasa la resiliencia circular a nivel alto y suma ${roundImpacto(
        delta,
        PESOS.complejidad
      )} puntos.`,
      condicion: "diversificar",
    });
  }

  // Potencial: cambiar de cultivo puede subir el rendimiento del terreno
  if (input.potencial.nivel === "bajo") {
    const delta = POTENCIAL.alto - POTENCIAL.bajo;
    r.push({
      capa: "potencial",
      impacto: roundImpacto(delta, PESOS.potencial),
      titulo: "Evaluar un cultivo de mayor rendimiento para la parcela",
      detalle: `Un cultivo con mayor índice de capacidad para ${input.parcela} suma ${roundImpacto(
        delta,
        PESOS.potencial
      )} puntos a ${NIVELES.potencial.toLowerCase()}.`,
      condicion: "cambiar_cultivo",
    });
  }

  // Perfil: pagos limpios y antigüedad
  if (input.perfil.estado !== "limpio") {
    const delta = PERFIL.limpio - PERFIL[input.perfil.estado];
    r.push({
      capa: "perfil",
      impacto: roundImpacto(delta, PESOS.perfil),
      titulo: "Mantener un historial de pagos limpio",
      detalle: `Un historial de pagos sin mora suma ${roundImpacto(
        delta,
        PESOS.perfil
      )} puntos a ${NIVELES.perfil.toLowerCase()}.`,
      condicion: "pago",
    });
  }

  if (input.perfil.deudaIngresoRatio > 0.5 && input.perfil.antiguedadMeses < 12) {
    r.push({
      capa: "perfil",
      impacto: 10,
      titulo: "Consolidar antigüedad y bajar deuda-ingreso",
      detalle: `Con más de 12 meses de antigüedad y una relación deuda-ingreso menor al 50% el perfil gana solidez.`,
      condicion: "deuda",
    });
  }

  return r.sort((a, b) => b.impacto - a.impacto);
}

function roundImpacto(deltaBruto: number, peso: number): number {
  return Math.round(deltaBruto * peso * ESCALA);
}
