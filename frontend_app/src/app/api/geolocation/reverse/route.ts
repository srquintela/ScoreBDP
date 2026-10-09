import { NextRequest, NextResponse } from "next/server";
import { reverseGeocodeCoordinates } from "@/lib/geolocation/reverse-geocoding";
import type { ReverseGeocodingDTO } from "@/lib/geolocation/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ReverseGeocodingDTO>> {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");

  if (!latStr || !lonStr) {
    return NextResponse.json(
      {
        success: false,
        department: null,
        municipality: null,
        source: "DERIVED",
        error: "Parámetros 'lat' y 'lon' son obligatorios.",
      },
      { status: 400 },
    );
  }

  const lat = Number(latStr);
  const lon = Number(lonStr);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  ) {
    return NextResponse.json(
      {
        success: false,
        department: null,
        municipality: null,
        source: "DERIVED",
        error: "Coordenadas numéricas fuera de rango válido.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await reverseGeocodeCoordinates(lat, lon);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al procesar ubicación";
    return NextResponse.json(
      {
        success: false,
        department: null,
        municipality: null,
        source: "DERIVED",
        error: message,
      },
      { status: 500 },
    );
  }
}
