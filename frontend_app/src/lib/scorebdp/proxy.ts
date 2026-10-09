export function allowedEndpoint(method: string, path: string) {
  return method === "GET"
    ? /^(municipios|productos|caedec|solicitudes|F_SCO_PESOS|score\/(baseline|sector|vocacion|complejidad|clima))$/.test(
        path,
      )
    : method === "POST" &&
        /^(solicitud|pesos|score\/generate\/[1-9]\d*)$/.test(path);
}
