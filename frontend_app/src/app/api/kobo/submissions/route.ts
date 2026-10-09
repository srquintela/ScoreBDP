import { NextResponse } from "next/server";
import type { KoboSubmissionDTO } from "@/lib/kobo/types";
export const dynamic = "force-dynamic";
const DEFAULT_CAPTURE_URL = "https://ee.bdp.com.bo/x/KYNUqQ4Y";

async function getCaptureUrl(base: URL, asset: string, token: string) {
  try {
    const response = await fetch(
      new URL(`/api/v2/assets/${encodeURIComponent(asset)}/`, base),
      {
        headers: { Authorization: `Token ${token}`, Accept: "application/json" },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(12000),
      },
    );
    if (!response.ok) return DEFAULT_CAPTURE_URL;
    const body = await response.json();
    const candidate = body?.deployment__links?.url ?? body?.deployment__links?.offline_url;
    if (typeof candidate !== "string") return DEFAULT_CAPTURE_URL;
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : DEFAULT_CAPTURE_URL;
  } catch {
    return DEFAULT_CAPTURE_URL;
  }
}

export async function GET() {
  const token = process.env.KOBO_API_TOKEN,
    asset = process.env.KOBO_ASSET_UID;
  const headers = { "Cache-Control": "no-store" };
  if (!token || !asset)
    return NextResponse.json(
      {
        success: false,
        count: 0,
        data: [],
        error:
          "Kobo no está configurado. Define KOBO_BASE_URL, KOBO_ASSET_UID y KOBO_API_TOKEN en el servidor. Puedes usar captura manual.",
      },
      { status: 503, headers },
    );
  try {
    const base = new URL(
      process.env.KOBO_BASE_URL || "https://kf.kobotoolbox.org",
    );
    if (base.protocol !== "https:") throw new Error("Configuración inválida");
    const url = new URL(
      `/api/v2/assets/${encodeURIComponent(asset)}/data/`,
      base,
    );
    url.search = new URLSearchParams({
      format: "json",
      limit: "100",
    }).toString();
    const [response, captureUrl] = await Promise.all([
      fetch(url, {
      headers: { Authorization: `Token ${token}`, Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20000),
      }),
      getCaptureUrl(base, asset, token),
    ]);
    if (!response.ok)
      return NextResponse.json(
        {
          success: false,
          count: 0,
          data: [],
          error:
            response.status === 401 || response.status === 403
              ? "Kobo rechazó las credenciales o permisos."
              : "No se pudieron obtener las capturas de Kobo.",
        },
        {
          status:
            response.status === 401 || response.status === 403 ? 401 : 502,
          headers,
        },
      );
    const body = await response.json();
    if (!Array.isArray(body.results)) throw new Error("Respuesta inválida");
    const field = process.env.KOBO_GEOSHAPE_FIELD || "Record_an_area";
    const data: KoboSubmissionDTO[] = body.results
      .filter((item: Record<string, unknown>) => item && item._id != null)
      .map((item: Record<string, unknown>) => ({
        submissionId: String(item._id),
        submissionUuid: String(item._uuid ?? ""),
        startedAt: typeof item.start === "string" ? item.start : null,
        submissionTime:
          typeof item._submission_time === "string"
            ? item._submission_time
            : null,
        hasGeoshape:
          typeof item[field] === "string" &&
          Boolean((item[field] as string).trim()),
        rawGeoshape:
          typeof item[field] === "string" ? (item[field] as string) : null,
      }));
    return NextResponse.json(
      {
        success: true,
        count: data.length,
        data,
        hasMore: Boolean(body.next),
        captureUrl,
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        count: 0,
        data: [],
        error:
          "Kobo no respondió o entregó una respuesta inválida. No se utilizaron datos de reemplazo.",
      },
      { status: 502, headers },
    );
  }
}
