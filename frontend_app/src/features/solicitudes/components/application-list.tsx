"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { repository } from "@/lib/scorebdp";
import type { ApplicationRow } from "@/lib/scorebdp/contracts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PageHeading,
  ErrorNotice,
  money,
} from "@/components/shared/page-heading";
export function ApplicationList() {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    repository
      .list()
      .then((value) => {
        if (active) setRows(value);
      })
      .catch(() => {
        if (active) setError("No se pudieron cargar las solicitudes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function load(all = false) {
    setError("");
    if (!all && search && !/^[1-9]\d*$/.test(search)) {
      setError("Ingresa un identificador entero positivo.");
      return;
    }
    setLoading(true);
    try {
      setRows(
        await repository.list(all || !search ? undefined : Number(search)),
      );
      if (all) setSearch("");
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "No se pudo consultar.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <PageHeading
        title="Lista de solicitudes"
        description="Consulta una solicitud y abre su expediente antes de generar la evaluación."
        action={
          <Button asChild>
            <Link href="/solicitud">Nueva solicitud</Link>
          </Button>
        }
      />
      <Card className="overflow-hidden">
        <form
          className="flex flex-wrap items-end gap-3 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void load();
          }}
        >
          <label htmlFor="search">
            Identificador
            <Input
              id="search"
              className="mt-2 w-48"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej. 1"
              inputMode="numeric"
            />
          </label>
          <Button type="submit" disabled={loading}>
            Buscar
          </Button>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => void load(true)}
          >
            Mostrar todas
          </Button>
        </form>
        {error && (
          <div className="px-5">
            <ErrorNotice>{error}</ErrorNotice>
          </div>
        )}
        {loading ? (
          <p className="p-6" role="status">
            Cargando…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>ID / fecha</th>
                  <th>Solicitante</th>
                  <th>Municipio</th>
                  <th>Producto</th>
                  <th>Monto</th>
                  <th>Expediente</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      #{row.id}
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {row.fecha?.slice(0, 10) ?? "Sin fecha"}
                      </span>
                    </td>
                    <td>
                      {row.nombre} {row.primer_apellido}
                      <span className="mt-1 block text-xs text-muted-foreground">
                        CI: {row.ci ?? "Sin dato"}
                      </span>
                    </td>
                    <td>{row.municipio ?? "Sin dato"}</td>
                    <td>{row.producto ?? "Sin dato"}</td>
                    <td>{money(row.monto)}</td>
                    <td>
                      <Button variant="outline" asChild>
                        <Link href={`/solicitudes/${row.id}`}>
                          Ver evaluación
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && !error && (
              <p className="p-8 text-center text-muted-foreground">
                No hay solicitudes para esta búsqueda.
              </p>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
