import type { ApplicationInput, Supplement } from "@/lib/scorebdp/contracts";
export const emptyApplication: ApplicationInput = {
  ci: "",
  nombre: "",
  primer_apellido: "",
  segundo_apellido: "",
  fechanac: "",
  genero: "",
  direccion: "",
  departamento: "",
  municipio: "",
  producto: "",
  caedec: "",
  monto: 0,
  messiembra: "",
};
export const emptySupplement: Supplement = {
  plazo: "",
  cuota: "",
  ingresos: "",
  egresos: "",
  deuda: "",
  cuotasExistentes: "",
  experiencia: "",
  superficie: "",
  rendimiento: "",
  costo: "",
  precio: "",
};
export function validateApplication(
  input: ApplicationInput,
  now = new Date(),
): string[] {
  const errors: string[] = [];
  if (!input.ci.trim() || input.ci.length > 15)
    errors.push("CI requerido, máximo 15 caracteres.");
  if (
    !input.nombre.trim() ||
    input.nombre.length > 20 ||
    !input.primer_apellido.trim() ||
    input.primer_apellido.length > 20
  )
    errors.push(
      "Nombre y primer apellido requeridos, máximo 20 caracteres cada uno.",
    );
  if (input.segundo_apellido.length > 20)
    errors.push("Segundo apellido: máximo 20 caracteres.");
  const date = new Date(`${input.fechanac}T00:00:00`);
  let age = now.getFullYear() - date.getFullYear();
  if (
    now.getMonth() < date.getMonth() ||
    (now.getMonth() === date.getMonth() && now.getDate() < date.getDate())
  )
    age--;
  if (!input.fechanac || Number.isNaN(date.getTime()) || age < 18)
    errors.push(
      "La fecha de nacimiento debe corresponder a una persona mayor de edad.",
    );
  if (!input.genero || !input.direccion.trim() || input.direccion.length > 200)
    errors.push("Completa género y dirección (máximo 200 caracteres).");
  if (
    !input.departamento ||
    !input.municipio ||
    !input.producto ||
    !input.caedec
  )
    errors.push("Selecciona departamento, municipio, producto y CAEDEC.");
  if (!Number.isFinite(input.monto) || input.monto <= 0)
    errors.push("El monto solicitado debe ser mayor que cero.");
  if (!/^(?:[1-9]|1[0-2])$/.test(input.messiembra))
    errors.push("Selecciona un mes de siembra válido.");
  return errors;
}
export function validateSupplement(input: Supplement): string[] {
  const errors: string[] = [];
  for (const [key, value] of Object.entries(input))
    if (value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0))
      errors.push(`El campo ${key} debe ser un número no negativo.`);
  if (
    input.plazo !== "" &&
    (!Number.isInteger(Number(input.plazo)) || Number(input.plazo) <= 0)
  )
    errors.push("El plazo debe ser un número entero positivo.");
  if (input.superficie !== "" && Number(input.superficie) <= 0)
    errors.push("La superficie cultivada debe ser mayor que cero.");
  return errors;
}
export function financialIndicators(input: Supplement) {
  const value = (key: keyof Supplement) =>
    input[key] === "" ? null : Number(input[key]);
  const income = value("ingresos"),
    expenses = value("egresos"),
    quota = value("cuota"),
    existing = value("cuotasExistentes");
  const available =
    income !== null && expenses !== null ? income - expenses : null;
  const payments =
    quota !== null && existing !== null ? quota + existing : null;
  return {
    available,
    payments,
    remaining:
      available !== null && payments !== null ? available - payments : null,
    ratio:
      available !== null && available > 0 && payments !== null
        ? payments / available
        : null,
  };
}
