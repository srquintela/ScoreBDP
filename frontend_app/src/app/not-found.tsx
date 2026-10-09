import Link from "next/link";
export default function NotFound() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Página no encontrada</h1>
      <Link
        className="mt-4 inline-block text-primary underline"
        href="/solicitudes"
      >
        Volver a solicitudes
      </Link>
    </div>
  );
}
