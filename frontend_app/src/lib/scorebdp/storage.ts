// Espacios separados: los datos de demostración nunca sustituyen respuestas API.
export function readSession<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export function writeSession(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error(
      "No se pudo guardar en esta sesión. Habilita el almacenamiento del navegador y reintenta.",
    );
  }
}
