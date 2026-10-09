import type { ParcelDraft } from "@/features/formulario/types";
import type { Coordinates } from "@/lib/maps/geometry";
import { getCoordinates } from "@/lib/maps/geometry";

/** One patch for both fields; geometry and registered area are never inferred from a point. */
export function parcelLocationPatch(
  coordinates: Coordinates,
): Partial<ParcelDraft> {
  return getCoordinates(coordinates.latitude, coordinates.longitude)
    ? {
        latitude: String(coordinates.latitude),
        longitude: String(coordinates.longitude),
      }
    : {};
}
