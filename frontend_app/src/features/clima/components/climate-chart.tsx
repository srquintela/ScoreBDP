"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { RealClimateObservation } from "@/types/climate";
export function ClimateChart({
  observation,
}: {
  observation: RealClimateObservation;
}) {
  const data = [
    { name: "Precipitación", mm: observation.precipitation },
    { name: "ET₀", mm: observation.evapotranspiration },
  ];
  if (data.some((row) => row.mm === null))
    return <p>No hay acumulados suficientes para la gráfica.</p>;
  return (
    <section className="mt-5 rounded-lg border border-border p-4">
      <h3 className="font-semibold">Acumulados del periodo (mm)</h3>
      <p className="my-2 text-xs text-muted-foreground">
        {observation.periodStart} a {observation.periodEnd}. No representa una
        serie temporal ni una predicción. Revisa la cobertura de cada variable.
      </p>
      <div className="h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar
              isAnimationActive={false}
              dataKey="mm"
              name="Acumulado (mm)"
              fill="#00A0E3"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
