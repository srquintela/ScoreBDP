export default function AuditoriaPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-md border border-soil-900/15 bg-wheat-100 p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-sm border border-soil-900/20 bg-wheat-50 font-mono text-xl text-soil-400">
          ⚖
        </div>
        <h2 className="font-display text-2xl font-semibold text-soil-900">
          Auditoría regulada: próximamente
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-soil-500">
          Esta vista documentará la transparencia matemática del motor para la
          verificación regulatoria: cada decisión de score quedará trazable hasta
          la regla que la produjo.
        </p>
        <p className="mx-auto mt-4 max-w-md rounded-md bg-wheat-50 px-4 py-3 text-xs text-soil-600">
          Fuera del alcance del MVP. La trazabilidad por solicitud ya está
          disponible en el detalle de cada expediente.
        </p>
      </div>
    </div>
  );
}
