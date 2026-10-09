import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";
import { formatDecimal } from "@/lib/formatters/producer";
import type { ClimateVariable, RealClimateObservation } from "@/types/climate";
import { WaterBalance } from "@/features/clima/components/water-balance";

export function ClimateResult({
  observation: data,
}: {
  observation: RealClimateObservation;
}) {
  const indicators: {
    label: string;
    value: number | null;
    unit: string;
    variable: ClimateVariable;
  }[] = [
    {
      label: "Precipitación acumulada",
      value: data.precipitation,
      unit: " mm",
      variable: "precipitation_sum",
    },
    {
      label: "Temperatura media",
      value: data.averageTemperature,
      unit: " °C",
      variable: "temperature_2m_mean",
    },
    {
      label: "Humedad media del suelo (0–7 cm)",
      value: data.soilMoisture,
      unit: " % vol.",
      variable: "soil_moisture_0_to_7cm_mean",
    },
    {
      label: "Evapotranspiración ET0 acumulada",
      value: data.evapotranspiration,
      unit: " mm",
      variable: "et0_fao_evapotranspiration",
    },
  ];
  const partial = Object.values(data.coverage).some(
    (days) => days < data.expectedDays,
  );
  return (
    <div className="mt-5 space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-helper">
        <Badge>Open-Meteo — REAL</Badge>
        <span>
          Período analizado: {formatDate(data.periodStart)} –{" "}
          {formatDate(data.periodEnd)}
        </span>
      </div>
      {partial && (
        <p role="status" className="rounded-md bg-muted p-3 text-helper">
          Cobertura incompleta. Los acumulados y promedios incluyen únicamente
          los días con datos; los faltantes no se consideran cero.
        </p>
      )}
      <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {indicators.map((item) => (
          <div key={item.variable}>
            <dt className="text-label text-muted-foreground">{item.label}</dt>
            <dd className="mt-1 text-sm font-semibold">
              {item.value === null
                ? "No disponible"
                : formatDecimal(item.value, item.unit)}
            </dd>
            <dd className="mt-1 text-helper text-muted-foreground">
              {data.coverage[item.variable]} de {data.expectedDays} días con
              datos
            </dd>
          </div>
        ))}
      </dl>
      <WaterBalance observation={data} />
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-semibold">Indicador climático DEMO</p>
        <p className="mt-2 text-sm">
          Días con precipitación baja:{" "}
          {data.dryDays === null
            ? "No disponible"
            : `${data.dryDays} de ${data.coverage.precipitation_sum} días con datos`}
          .
        </p>
        <p className="mt-2 text-helper text-muted-foreground">
          Regla DEMO: precipitación diaria menor a{" "}
          {formatDecimal(data.dryDayThresholdMm, " mm")}. Cuenta días
          individuales, no períodos consecutivos. No es un índice oficial de
          sequía.
        </p>
      </div>
      {data.precipitation !== null && (
        <p className="text-sm">
          Durante el período analizado, la precipitación acumulada en los{" "}
          {data.coverage.precipitation_sum} días con datos fue de{" "}
          {formatDecimal(data.precipitation, " mm")}.
        </p>
      )}
      <p className="text-helper text-muted-foreground">
        Datos meteorológicos/modelados para la ubicación consultada; no
        corresponden necesariamente a mediciones realizadas dentro de la
        parcela.
      </p>
      <p className="text-helper text-muted-foreground">
        Evidencia complementaria. No modifica el BDP Score ni determina una
        decisión crediticia.
      </p>
      <details className="border-t border-border pt-4 text-helper">
        <summary className="cursor-pointer font-medium">
          Fuente y trazabilidad
        </summary>
        <dl className="mt-3 space-y-2 text-muted-foreground">
          <div>
            <dt className="font-medium">Fuente</dt>
            <dd>
              <a
                className="underline"
                href="https://open-meteo.com/en/docs/historical-weather-api"
                target="_blank"
                rel="noreferrer"
              >
                Open-Meteo Historical Weather API
              </a>{" "}
              · REAL ·{" "}
              <a
                className="underline"
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY 4.0
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium">Fecha de consulta</dt>
            <dd>
              <time dateTime={data.consultedAt}>
                {formatDate(data.consultedAt)} ·{" "}
                {new Intl.DateTimeFormat("es-BO", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/La_Paz",
                }).format(new Date(data.consultedAt))}{" "}
                (Bolivia)
              </time>
            </dd>
          </div>
          <div>
            <dt className="font-medium">Coordenadas consultadas</dt>
            <dd>
              {data.latitude}, {data.longitude}
            </dd>
          </div>
          <div>
            <dt className="font-medium">
              Celda del modelo devuelta por la fuente
            </dt>
            <dd>
              {data.gridCoordinates.latitude}, {data.gridCoordinates.longitude}{" "}
              · Zona horaria: {data.timezone}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Variables diarias utilizadas</dt>
            <dd>
              <ul className="mt-1 space-y-1">
                {data.variables.map((variable) => (
                  <li className="break-all" key={variable}>
                    {variable} ({data.units[variable]})
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt className="font-medium">Humedad del suelo</dt>
            <dd>
              Media del contenido volumétrico en m³/m³ multiplicada por 100 para
              mostrar % vol.
            </dd>
          </div>
        </dl>
      </details>
    </div>
  );
}
