import Link from "next/link";

export default function SolicitudNotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="font-mono text-5xl font-bold text-soil-400">404</p>
      <h2 className="mt-4 font-display text-xl font-semibold text-soil-900">
        Solicitud no encontrada
      </h2>
      <p className="mt-2 text-sm text-soil-500">
        El código solicitado no existe o no tiene permiso para verlo.
      </p>
      <Link
        href="/solicitudes"
        className="mt-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-400 hover:underline"
      >
        Volver al listado
      </Link>
    </div>
  );
}
