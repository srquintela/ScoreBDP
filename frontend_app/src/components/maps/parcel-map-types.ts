import type { Parcel } from "@/types/domain";
import type { Coordinates } from "@/lib/maps/geometry";

interface ParcelMapBase {
  latitude?: number | string | null;
  longitude?: number | string | null;
  areaHectares?: number | string | null;
  geometry?: Parcel["geometry"];
  name?: string;
}

export type ParcelMapProps = ParcelMapBase &
  (
    | { mode: "READ_ONLY"; onLocationChange?: never }
    | { mode: "EDITABLE"; onLocationChange: (coordinates: Coordinates) => void }
  );
