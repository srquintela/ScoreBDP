import { Departamento } from "@/lib/constants/departamentos";

export type Rol = "oficial" | "analista" | "jefe_agencia";

export type Sesion = {
  userId: string;
  role: Rol;
  name?: string;
};

// ----- Capas de puntuación -----

export type NivelPotencial = "alto" | "medio" | "bajo";

export type NivelVocacion = "si" | "no" | "segunda_ronda";

export type NivelComplejidad = "alta" | "media" | "monocultivo";

export type PerfilCrediticio =
  | "limpio"
  | "regular"
  | "default_previo";

// ----- Entrada del motor (lo que captura el oficial) -----

export type SolicitudInput = {
  id: string;
  codigo: string;
  productor: string;
  ci: string;
  cultivoSolicitado: string;
  parcela: string;
  departamento: Departamento;
  montoSolicitado: number;
  plazoMeses: number;

  potencial: {
    nivel: NivelPotencial;
    /** Índice 0-100 de capacidad de rendimiento del terreno */
    rendimiento: number;
    justificacion?: string;
  };

  vocacion: {
    nivel: NivelVocacion;
    justificacion?: string;
  };

  complejidad: {
    nivel: NivelComplejidad;
    /** cant de cultivos complementarios declarados */
    complementarios: number;
    justificacion?: string;
  };

  perfil: {
    estado: PerfilCrediticio;
    antiguedadMeses: number;
    deudaIngresoRatio: number; // 0 - 1
    justificacion?: string;
  };
};

// ----- Resultado -----

export type ResultadoCapa = {
  clave: CapaClave;
  nombre: string;
  peso: number; // 0-1
  puntos: number; // contribución ponderada: peso * puntajeBruto
  puntajeBruto: number; // el +X / -Y de la regla
  nivel: string;
  justificacion: string;
};

export type CapaClave =
  | "potencial"
  | "vocacion"
  | "complejidad"
  | "perfil";

export type ResultadoScore = {
  total: number; // score final 300 - 800
  capas: ResultadoCapa[];
  // lista de "qué cambiar para subir el score" ordenada por impacto
  recomendaciones: Recomendacion[];
};

export type Recomendacion = {
  capa: CapaClave;
  impacto: number; // pts que ganaría
  titulo: string;
  detalle: string;
  condicion: "cambiar_cultivo" | "diversificar" | "pago" | "antiguedad" | "deuda";
};

export type EstadoSolicitud =
  | "borrador"
  | "en_evaluacion"
  | "aprobada"
  | "rechazada";
