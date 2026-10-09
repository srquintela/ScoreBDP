import type { ReverseGeocodingDTO } from "./types";

const BOLIVIA_DEPARTMENTS = [
  "Beni",
  "Chuquisaca",
  "Cochabamba",
  "La Paz",
  "Oruro",
  "Pando",
  "Potosí",
  "Santa Cruz",
  "Tarija",
] as const;

/**
 * Normalizes a department name against Bolivia's 9 official departments.
 */
export function normalizeBolivianDepartment(
  raw: string | null | undefined,
): string | null {
  if (!raw || typeof raw !== "string") return null;

  const cleaned = raw
    .trim()
    .replace(/^Departamento\s+(de\s+)?/i, "")
    .replace(/^Depto\.?\s+(de\s+)?/i, "")
    .trim();

  for (const dept of BOLIVIA_DEPARTMENTS) {
    if (cleaned.localeCompare(dept, "es", { sensitivity: "accent" }) === 0) {
      return dept;
    }
    // Also match without accents (e.g. Potosi -> Potosí)
    const normalizedDept = dept
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const normalizedCleaned = cleaned
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (normalizedCleaned.toLowerCase() === normalizedDept.toLowerCase()) {
      return dept;
    }
  }

  return cleaned || null;
}

/**
 * Normalizes a municipality name by stripping administrative prefixes common in Bolivia OSM data.
 */
export function normalizeBolivianMunicipality(
  raw: string | null | undefined,
): string | null {
  if (!raw || typeof raw !== "string") return null;

  const cleaned = raw
    .trim()
    .replace(/^Gobierno\s+Aut[oó]nomo\s+Municipal\s+(de\s+)?/i, "")
    .replace(/^Municipio\s+(de\s+)?/i, "")
    .replace(/^Secci[oó]n\s+Municipal\s+(de\s+)?/i, "")
    .replace(/^Alcald[ií]a\s+(de\s+)?/i, "")
    .trim();

  return cleaned || null;
}

/**
 * Queries OpenStreetMap Nominatim server-side to resolve administrative divisions (Department, Municipality)
 * from geographic coordinates without requiring API keys or exposing personal data.
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodingDTO> {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return {
      success: false,
      department: null,
      municipality: null,
      source: "DERIVED",
      error: "Coordenadas inválidas para geocodificación inversa.",
    };
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;

  try {
    const response = await fetch(nominatimUrl, {
      method: "GET",
      headers: {
        "User-Agent": "BDP-Score-Agro/1.0 (agro@bdp.com.bo)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return {
        success: false,
        department: null,
        municipality: null,
        source: "DERIVED",
        error: `Servicio de geocodificación no disponible (HTTP ${response.status}).`,
      };
    }

    const data = await response.json();
    const address = data?.address || {};

    const rawDepartment =
      address.state || address.region || address.state_district || null;
    const rawMunicipality =
      address.municipality ||
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      null;

    const department = normalizeBolivianDepartment(rawDepartment);
    const municipality = normalizeBolivianMunicipality(rawMunicipality);

    return {
      success: Boolean(department || municipality),
      department,
      municipality,
      source: "DERIVED",
      formattedAddress:
        typeof data?.display_name === "string" ? data.display_name : null,
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Error de conexión con geocodificador";
    return {
      success: false,
      department: null,
      municipality: null,
      source: "DERIVED",
      error: `No fue posible conectar con el servicio geográfico: ${message}`,
    };
  }
}
