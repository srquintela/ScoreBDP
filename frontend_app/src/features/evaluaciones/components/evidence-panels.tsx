"use client";
import { Card } from "@/components/ui/card";
import { ParcelMap } from "@/components/maps/parcel-map";
import { ClimateResult } from "@/features/clima/components/climate-result";
import { ClimateChart } from "@/features/clima/components/climate-chart";
import type { AgriculturalCapture } from "@/features/formulario/agricultural-capture";
import { productionIndicators } from "@/features/formulario/agricultural-capture";
import { money } from "@/components/shared/page-heading";
import { isParcelGeometry } from "@/lib/maps/geometry";
import { parseKoboGeoshape } from "@/lib/kobo/geoshape";
export function EvidencePanels({
  capture,
  section,
}: {
  capture: AgriculturalCapture | null;
  section: string;
}) {
  if (!capture)
    return (
      <Card className="p-6">
        <p>
          No hay una captura agrícola recuperable para esta solicitud en esta
          sesión. Completa el formulario para incorporar parcela, producción y
          clima.
        </p>
      </Card>
    );
  const parcel = capture.parcel,
    production = capture.productive,
    indicators = productionIndicators(production);
  if (section === "parcela") {
    const ring =
      isParcelGeometry(parcel.geometry) && parcel.geometry.type === "Polygon"
        ? parcel.geometry.coordinates[0]
        : null;
    const calculated = ring
      ? parseKoboGeoshape(
          ring.map((point) => `${point[1]} ${point[0]} 0 0`).join(";"),
        )?.areaHectares
      : null;
    return (
      <Card className="space-y-5 p-6">
        <h2 className="text-xl font-bold">Parcela vinculada</h2>
        <p className="text-sm">
          Origen: {parcel.source ?? "MANUAL"} · Captura Kobo:{" "}
          {parcel.koboSubmissionId ?? "No corresponde"}.
        </p>
        {capture.origin === "SYNTHETIC" && (
          <p className="text-danger">
            Polígono sintético para demostrar la interfaz. No acredita
            propiedad, superficie ni aptitud real.
          </p>
        )}
        <ParcelMap
          mode="READ_ONLY"
          name={parcel.name}
          latitude={parcel.latitude}
          longitude={parcel.longitude}
          areaHectares={parcel.areaHectares}
          geometry={parcel.geometry}
        />
        <p>
          Superficie registrada: {parcel.areaHectares} ha. Superficie geométrica
          aproximada:{" "}
          {calculated == null ? "No disponible" : `${calculated.toFixed(3)} ha`}
          .
        </p>
        <p className="text-sm text-muted-foreground">
          Las superficies se conservan por separado y deben revisarse si
          difieren. Las coordenadas guardadas representan el punto consultado;
          no prueban condiciones uniformes en todo el polígono.
        </p>
      </Card>
    );
  }
  if (section === "clima")
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold">Clima de la parcela</h2>
        {capture.climate ? (
          <>
            <ClimateResult observation={capture.climate} />
            <ClimateChart observation={capture.climate} />
          </>
        ) : (
          <p className="mt-4">
            Evidencia no disponible. Puedes consultar Open-Meteo desde el
            formulario; no se asigna un valor climático favorable por esta
            ausencia.
          </p>
        )}
      </Card>
    );
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold">Producción declarada</h2>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        {[
          ["Cultivo", production.crop],
          ["Experiencia", `${production.experienceYears} años`],
          ["Superficie cultivada", `${production.cultivatedAreaHectares} ha`],
          ["Rendimiento histórico", `${production.historicalYield} t/ha`],
          ["Producción estimada", `${production.estimatedProduction} t`],
          ["Precio esperado", `${production.expectedSalePrice} Bs/t`],
          ["Costo", money(Number(production.estimatedProductionCost))],
          ["Ingreso declarado", money(Number(production.expectedIncome))],
          [
            "Diversificación",
            (
              { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" } as Record<
                string,
                string
              >
            )[production.diversificationLevel] ?? "Pendiente",
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 rounded-lg bg-secondary p-4 text-sm">
        <p>
          Producción de referencia: {indicators.reference ?? "Pendiente"} t.
        </p>
        <p>
          Valor potencial suponiendo venta total:{" "}
          {money(indicators.grossPotential)}.
        </p>
        <p>Excedente declarado antes de deuda: {money(indicators.margin)}.</p>
        <p className="mt-3">
          La venta total es un supuesto ilustrativo, no una cantidad vendible
          verificada. Los datos productivos no modifican actualmente el score
          institucional.
        </p>
      </div>
    </Card>
  );
}
