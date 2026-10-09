import type { Polygon, Position } from "geojson";
import type { ParsedKoboGeoshape } from "./types";

const EARTH_RADIUS_METERS = 6378137;

/**
 * Calculates 2D polygon centroid (center of mass) using Green's theorem / Shoelace.
 * Ring coordinates are [longitude, latitude].
 */
export function calculatePolygonCentroid(ring: Position[]): {
  latitude: number;
  longitude: number;
} {
  const n = ring.length;
  if (n < 4) {
    if (n === 0) return { latitude: 0, longitude: 0 };
    const avgLon = ring.reduce((sum, p) => sum + p[0], 0) / n;
    const avgLat = ring.reduce((sum, p) => sum + p[1], 0) / n;
    return {
      latitude: Number(avgLat.toFixed(6)),
      longitude: Number(avgLon.toFixed(6)),
    };
  }

  let signedArea = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < n - 1; i++) {
    const x0 = ring[i][0];
    const y0 = ring[i][1];
    const x1 = ring[i + 1][0];
    const y1 = ring[i + 1][1];

    const cross = x0 * y1 - x1 * y0;
    signedArea += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }

  signedArea *= 0.5;

  if (Math.abs(signedArea) < 1e-12) {
    // Degenerate or collapsed ring fallback: arithmetic mean of non-duplicate points
    const points = ring.slice(0, -1);
    const avgLon = points.reduce((sum, p) => sum + p[0], 0) / points.length;
    const avgLat = points.reduce((sum, p) => sum + p[1], 0) / points.length;
    return {
      latitude: Number(avgLat.toFixed(6)),
      longitude: Number(avgLon.toFixed(6)),
    };
  }

  const factor = 1 / (6 * signedArea);
  cx *= factor;
  cy *= factor;

  return {
    latitude: Number(cy.toFixed(6)),
    longitude: Number(cx.toFixed(6)),
  };
}

/**
 * Calculates geodesic area in hectares for a spherical polygon ring using
 * the Chamberlain-Duquette algorithm (RFC / OGC GIS standard).
 * Coordinates are [longitude, latitude].
 */
export function calculateGeodesicAreaHectares(ring: Position[]): number {
  const n = ring.length;
  if (n < 4) return 0;

  let total = 0;
  for (let i = 0; i < n - 1; i++) {
    const lon1Rad = (ring[i][0] * Math.PI) / 180;
    const lat1Rad = (ring[i][1] * Math.PI) / 180;
    const lon2Rad = (ring[i + 1][0] * Math.PI) / 180;
    const lat2Rad = (ring[i + 1][1] * Math.PI) / 180;

    total += (lon2Rad - lon1Rad) * (2 + Math.sin(lat1Rad) + Math.sin(lat2Rad));
  }

  const areaSquareMeters = Math.abs(
    (total * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2,
  );
  const hectares = areaSquareMeters / 10000;

  // Round to 2 decimal places, minimum 0.01 if non-zero
  if (hectares > 0 && hectares < 0.01) {
    return Number(hectares.toFixed(4));
  }
  return Number(hectares.toFixed(2));
}

/**
 * Parses a Kobo geoshape string ("lat lon alt acc; lat lon alt acc; ...") into
 * a valid GeoJSON Polygon with representative centroid and surface area in hectares.
 */
export function parseKoboGeoshape(
  raw: string | null | undefined,
): ParsedKoboGeoshape | null {
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return null;
  }

  const tokens = raw.trim().split(";");
  const positions: Position[] = [];

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) continue;

    const lat = Number(parts[0]);
    const lon = Number(parts[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;

    // GeoJSON position is [longitude, latitude]
    positions.push([Number(lon.toFixed(6)), Number(lat.toFixed(6))]);
  }

  // Count distinct points before closing
  const distinctPoints = positions.filter((p, index) => {
    return (
      index === 0 ||
      p[0] !== positions[index - 1][0] ||
      p[1] !== positions[index - 1][1]
    );
  });

  if (distinctPoints.length < 3) {
    return null;
  }

  // Ensure ring closure
  const first = distinctPoints[0];
  const last = distinctPoints[distinctPoints.length - 1];
  const isClosed = first[0] === last[0] && first[1] === last[1];

  const closedRing: Position[] = isClosed
    ? distinctPoints
    : [...distinctPoints, [first[0], first[1]]];

  if (closedRing.length < 4) {
    return null;
  }

  const centroid = calculatePolygonCentroid(closedRing);
  const areaHectares = calculateGeodesicAreaHectares(closedRing);

  const polygon: Polygon = {
    type: "Polygon",
    coordinates: [closedRing],
  };

  return {
    polygon,
    centroid,
    areaHectares,
  };
}
