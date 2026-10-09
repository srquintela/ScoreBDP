import { parseKoboGeoshape } from "./geoshape";
import type { KoboSubmissionDTO, ParsedKoboGeoshape } from "./types";
import type { ParcelDraft } from "@/features/formulario/types";

export interface KoboParcelImportResult {
  patch: Partial<ParcelDraft>;
  parsedGeoshape: ParsedKoboGeoshape;
}

/**
 * Maps a Kobo Base submission into a ParcelDraft patch containing ONLY
 * the geospatial data provided by Kobo (geometry, centroid coordinates, and area).
 *
 * Explicitly DOES NOT generate or invent administrative or agronomic fields
 * (department, municipality, community, mainCrop) which remain empty
 * for the agricultural credit analyst to complete.
 */
export function koboBaseSubmissionToParcelPatch(
  submission: KoboSubmissionDTO,
  currentName?: string,
): KoboParcelImportResult | null {
  if (!submission.rawGeoshape) {
    return null;
  }

  const parsed = parseKoboGeoshape(submission.rawGeoshape);
  if (!parsed) {
    return null;
  }

  const patch: Partial<ParcelDraft> = {
    id: `kobo-${submission.submissionId}`,
    geometry: parsed.polygon,
    latitude: String(parsed.centroid.latitude),
    longitude: String(parsed.centroid.longitude),
    areaHectares: String(parsed.areaHectares),
    source: "KOBO",
    koboSubmissionId: submission.submissionId,
  };

  // If the user hasn't named the parcel yet, provide a technical default identifier
  if (!currentName || !currentName.trim()) {
    patch.name = `Parcela Kobo #${submission.submissionId}`;
  }

  return {
    patch,
    parsedGeoshape: parsed,
  };
}

/**
 * Formats a user-friendly, privacy-safe display label for a Kobo submission
 * without exposing personal data or full UUIDs.
 */
export function formatKoboSubmissionLabel(
  submission: KoboSubmissionDTO,
): string {
  const dateStr = submission.submissionTime || submission.startedAt;
  let formattedDate = "";

  if (dateStr) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        formattedDate = ` · ${d.toLocaleDateString("es-BO", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      }
    } catch {
      // Ignore formatting error
    }
  }

  const geoStatus = submission.hasGeoshape
    ? " (con polígono)"
    : " (sin polígono)";
  return `Registro Kobo #${submission.submissionId}${formattedDate}${geoStatus}`;
}
