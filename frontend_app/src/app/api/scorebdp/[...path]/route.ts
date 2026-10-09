import { allowedEndpoint } from "@/lib/scorebdp/proxy";
async function forward(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (process.env.NEXT_PUBLIC_DATA_MODE !== "api")
    return Response.json(
      { error: "El modo DEMO no envía operaciones al backend." },
      { status: 403 },
    );
  const path = (await context.params).path.join("/");
  if (!allowedEndpoint(request.method, path))
    return Response.json(
      { error: "Operación no disponible." },
      { status: 404 },
    );
  const base = process.env.SCOREBDP_API_URL;
  if (!base)
    return Response.json(
      { error: "Configura SCOREBDP_API_URL en el servidor." },
      { status: 503 },
    );
  try {
    const url = new URL(`${base.replace(/\/$/, "")}/api/${path}`);
    url.search = new URL(request.url).search;
    const response = await fetch(url, {
      method: request.method,
      headers: { "Content-Type": "application/json" },
      ...(request.method === "POST" ? { body: await request.text() } : {}),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok)
      return Response.json(
        {
          error: `ScoreBDP respondió ${response.status}. Revisa el servicio y los datos de la solicitud.`,
        },
        { status: response.status },
      );
    return Response.json(await response.json());
  } catch {
    return Response.json(
      {
        error: `La consulta a FastAPI o a la base de datos configurada agotó el tiempo de espera en ${base}/api/${path}. Comprueba el acceso del backend a su base de datos.`,
      },
      { status: 502 },
    );
  }
}
export const GET = forward;
export const POST = forward;
