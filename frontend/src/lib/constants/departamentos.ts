export const DEPARTAMENTOS_BOLIVIA = [
  "Chuquisaca",
  "La Paz",
  "Cochabamba",
  "Oruro",
  "Potosí",
  "Tarija",
  "Santa Cruz",
  "Beni",
  "Pando",
] as const;

export type Departamento = (typeof DEPARTAMENTOS_BOLIVIA)[number];