"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Evaluation } from "@/lib/scorebdp/contracts";
import { factorKeys, factorLabels } from "@/lib/scorebdp/contracts";
import { contribution } from "@/lib/scorebdp/scoring";
export function ScoreChart({ result }: { result: Evaluation }) {
  const rows = factorKeys.map((key) => ({
    name: factorLabels[key],
    aporte:
      result.factors[key] === null
        ? null
        : contribution(key, result.factors[key]!, result.weights[key]),
  }));
  const complete = rows.every((row) => row.aporte !== null);
  const sum = rows.reduce((total, row) => total + (row.aporte ?? 0), 0);
  return (
    <section className="mt-6 rounded-lg border border-border p-4">
      <h3 className="font-semibold">
        Aporte por dimensión · puntos sobre 1.000
      </h3>
      <p className="my-3 text-xs text-muted-foreground">
        El gráfico muestra puntos ponderados, no porcentajes ni probabilidades
        de incumplimiento. Los factores sin datos no tienen barra.
      </p>
      <div className="h-72 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            accessibilityLayer
            margin={{ left: 5, right: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 1000]} />
            <YAxis dataKey="name" type="category" width={95} />
            <Tooltip />
            <Bar
              isAnimationActive={false}
              dataKey="aporte"
              name="Aporte (puntos)"
              fill="#005FBC"
              radius={[0, 5, 5, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {complete &&
        result.score !== null &&
        Math.abs(sum - result.score) > 0.01 && (
          <p className="text-sm text-danger">
            La suma reconstruida ({sum.toFixed(2)}) difiere del total recibido (
            {result.score}). Puede existir redondeo o diferencia metodológica;
            no se ajustaron valores para ocultarla.
          </p>
        )}
    </section>
  );
}
