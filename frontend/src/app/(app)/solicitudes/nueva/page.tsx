import { SolicitudWizard } from "@/components/solicitud/SolicitudWizard";

export default function NuevaSolicitudPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-soil-900">
          Alta de solicitud
        </h2>
        <p className="text-sm text-soil-500">
          Completó cada capa de datos del productor. El desglose se calcula en
          vivo antes de guardar.
        </p>
      </div>

      <SolicitudWizard />
    </div>
  );
}
