import type { MultiPolygon, Polygon, Position } from "geojson";
import { mapConfig } from "@/config/maps";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function parseCoordinate(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function getCoordinates(
  latitude: unknown,
  longitude: unknown,
): Coordinates | null {
  const lat = parseCoordinate(latitude);
  const lng = parseCoordinate(longitude);
  return lat !== null &&
    lng !== null &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
    ? { latitude: lat, longitude: lng }
    : null;
}

// Leaflet clicks can cross a repeated world; drafts always store WGS84 longitude.
export function selectCoordinates(
  latitude: number,
  longitude: number,
): Coordinates | null {
  if (!Number.isFinite(longitude)) return null;
  const wrapped = ((((longitude + 180) % 360) + 360) % 360) - 180;
  const valid = getCoordinates(latitude, wrapped);
  return valid
    ? {
        latitude: Number(valid.latitude.toFixed(6)),
        longitude: Number(valid.longitude.toFixed(6)),
      }
    : null;
}

function isPosition(value: unknown): value is Position {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    value.length <= 3 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item)) &&
    getCoordinates(value[1], value[0]) !== null
  );
}

function isRing(value: unknown): value is Position[] {
  if (!Array.isArray(value) || value.length < 4 || !value.every(isPosition))
    return false;
  const first = value[0];
  const last = value[value.length - 1];
  if (
    first.length !== last.length ||
    !first.every((item, i) => item === last[i])
  )
    return false;
  // Reject collapsed rings. This is rendering validation, not cadastral topology validation.
  const area = value.slice(0, -1).reduce((sum, point, i) => {
    const next = value[i + 1];
    return (
      sum +
      (point[0] - first[0]) * (next[1] - first[1]) -
      (next[0] - first[0]) * (point[1] - first[1])
    );
  }, 0);
  return Math.abs(area) > 0;
}

function isPolygonCoordinates(value: unknown): value is Position[][] {
  return Array.isArray(value) && value.length > 0 && value.every(isRing);
}

/** Accepts geometry directly from Parcel/PostGIS, in [longitude, latitude] order. */
export function isParcelGeometry(
  value: unknown,
): value is Polygon | MultiPolygon {
  if (
    !value ||
    typeof value !== "object" ||
    !("type" in value) ||
    !("coordinates" in value)
  )
    return false;
  if (value.type === "Polygon") return isPolygonCoordinates(value.coordinates);
  return (
    value.type === "MultiPolygon" &&
    Array.isArray(value.coordinates) &&
    value.coordinates.length > 0 &&
    value.coordinates.every(isPolygonCoordinates)
  );
}

export function getMapView(latitude: unknown, longitude: unknown) {
  const coordinates = getCoordinates(latitude, longitude);
  return {
    coordinates,
    center: coordinates
      ? ([coordinates.latitude, coordinates.longitude] as [number, number])
      : mapConfig.boliviaCenter,
    zoom: coordinates ? mapConfig.parcelZoom : mapConfig.overviewZoom,
  };
}
