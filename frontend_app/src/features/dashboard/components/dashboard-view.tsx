"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Files, Wallet, MapPin } from "lucide-react";
import { repository, dataMode } from "@/lib/scorebdp";
import type { ApplicationRow } from "@/lib/scorebdp/contracts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PageHeading,
  ErrorNotice,
  money,
} from "@/components/shared/page-heading";
export function DashboardView() {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    repository
      .list()
      .then((data) => {
        if (active) setRows(data);
      })
      .catch(() => {
        if (active)
          setError(
            "No se pudieron consultar las solicitudes. Verifica la conexión del backend.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const total = rows.reduce((sum, row) => sum + (row.monto ?? 0), 0);
  const groups = Object.entries(
    rows.reduce<Record<string, number>>((result, row) => {
      const key = row.producto ?? "Sin producto";
      result[key] = (result[key] ?? 0) + 1;
      return result;
    }, {}),
  );
  return (
    <>
      <PageHeading
        title="Dashboard"
        description="Una vista de las solicitudes disponibles y su actividad productiva."
        action={
          <Button asChild>
            <Link href="/solicitud">
              Nueva solicitud <ArrowUpRight />
            </Link>
          </Button>
        }
      />
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {loading ? (
        <p role="status">Cargando solicitudes…</p>
      ) : (
        !error && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  label: "Solicitudes disponibles",
                  value: String(rows.length),
                  icon: Files,
                },
                {
                  label: "Monto solicitado",
                  value: money(total),
                  icon: Wallet,
                },
                {
                  label: "Municipios representados",
                  value: String(
                    new Set(rows.map((r) => r.municipio).filter(Boolean)).size,
                  ),
                  icon: MapPin,
                },
              ].map((item) => (
                <Card key={item.label} className="p-6">
                  <item.icon className="mb-5 text-primary" size={22} />
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold">{item.value}</p>
                </Card>
              ))}
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
              <Card className="p-6">
                <h2 className="text-lg font-bold">Solicitudes por cultivo</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cantidad de solicitudes, no nivel de riesgo.
                </p>
                <div className="mt-6 space-y-5">
                  {groups.length ? (
                    groups.map(([name, count]) => (
                      <div key={name}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span>{name}</span>
                          <strong>{count}</strong>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-[#00A0E3]"
                            style={{
                              width: `${(count / Math.max(rows.length, 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No hay solicitudes registradas.</p>
                  )}
                </div>
              </Card>
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between p-6">
                  <h2 className="text-lg font-bold">Solicitudes recientes</h2>
                  <Link
                    className="text-sm text-primary underline"
                    href="/solicitudes"
                  >
                    Ver todas
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th>Solicitud</th>
                        <th>Producto</th>
                        <th>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...rows]
                        .sort((a, b) =>
                          String(b.fecha).localeCompare(String(a.fecha)),
                        )
                        .slice(0, 5)
                        .map((row) => (
                          <tr key={row.id}>
                            <td>
                              <Link
                                className="font-semibold text-primary underline"
                                href={`/solicitudes/${row.id}`}
                              >
                                #{row.id} · {row.nombre}
                              </Link>
                            </td>
                            <td>{row.producto ?? "Sin dato"}</td>
                            <td>{money(row.monto)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              {dataMode === "demo"
                ? "Indicadores calculados sobre las solicitudes sintéticas y capturas de esta sesión."
                : "Indicadores calculados sobre el listado devuelto por la API; no incluyen evaluaciones históricas ni una clasificación de riesgo."}
            </p>
          </>
        )
      )}
    </>
  );
}
