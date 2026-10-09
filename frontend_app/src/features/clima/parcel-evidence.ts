import { getCoordinates } from "@/lib/maps/geometry";
import type { RealClimateObservation } from "@/types/climate";
import type { EvaluationDraft, ParcelDraft } from "@/features/formulario/types";

export function climateMatchesParcel(
  climate: RealClimateObservation | null | undefined,
  parcel: Pick<ParcelDraft, "id" | "latitude" | "longitude">,
): boolean {
  const coords = getCoordinates(parcel.latitude, parcel.longitude);
  return (
    !!climate &&
    climate.sourceStatus === "REAL" &&
    !!coords &&
    climate.latitude === coords.latitude &&
    climate.longitude === coords.longitude &&
    climate.parcelId === (parcel.id ?? "draft-parcel")
  );
}

export function updateDraftParcel(
  draft: EvaluationDraft,
  patch: Partial<ParcelDraft>,
): EvaluationDraft {
  const parcel = { ...draft.parcel, ...patch };
  return {
    ...draft,
    parcel,
    climate: climateMatchesParcel(draft.climate, parcel) ? draft.climate : null,
  };
}

export function attachDraftClimate(
  draft: EvaluationDraft,
  climate: RealClimateObservation,
): EvaluationDraft {
  return climateMatchesParcel(climate, draft.parcel)
    ? { ...draft, climate }
    : draft;
}
