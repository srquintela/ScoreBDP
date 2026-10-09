"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="rounded-xl bg-card p-8">
      <h1 className="text-xl font-bold">No se pudo cargar esta pantalla</h1>
      <p className="my-4">
        Reintenta la operación. No se generó un resultado de reemplazo.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
