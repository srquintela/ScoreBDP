"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { repository, dataMode } from "@/lib/scorebdp";
import type {
  ApplicationInput,
  Catalogs,
  Supplement,
} from "@/lib/scorebdp/contracts";
import { writeSession } from "@/lib/scorebdp/storage";
import {
  emptyApplication,
  emptySupplement,
  validateApplication,
  validateSupplement,
  financialIndicators,
} from "../validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  PageHeading,
  ErrorNotice,
  money,
} from "@/components/shared/page-heading";
import { ParcelStep } from "@/features/parcelas/components/parcel-step";
import { ProductiveStep } from "@/features/formulario/components/productive-step";
import { ClimateIntelligenceCard } from "@/features/clima/components/climate-intelligence-card";
import { ClimateChart } from "@/features/clima/components/climate-chart";
import { climateMatchesParcel } from "@/features/clima/parcel-evidence";
import {
  blankParcel,
  blankProductive,
  mergeParcel,
  validateParcel,
  validateProduction,
  productionIndicators,
  type AgriculturalCapture,
} from "../agricultural-capture";
import type { ParcelDraft } from "@/features/formulario/types";
import type { RealClimateObservation } from "@/types/climate";
const departments = [
  "Chuquisaca",
  "La Paz",
  "Cochabamba",
  "Oruro",
  "Potosí",
  "Tarija",
  "Santa Cruz",
  "Beni",
  "Pando",
];
const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const steps = [
  "Solicitante",
  "Crédito",
  "Finanzas",
  "Parcela",
  "Producción",
  "Clima",
  "Revisión",
];
const extras: { key: keyof Supplement; label: string; unit: string }[] = [
  { key: "plazo", label: "Plazo solicitado", unit: "meses" },
  { key: "cuota", label: "Cuota propuesta mensual", unit: "Bs" },
  { key: "ingresos", label: "Ingresos mensuales declarados", unit: "Bs" },
  {
    key: "egresos",
    label: "Egresos mensuales sin cuotas de deuda",
    unit: "Bs",
  },
  { key: "deuda", label: "Saldo total de deuda", unit: "Bs" },
  {
    key: "cuotasExistentes",
    label: "Cuotas mensuales de otras deudas",
    unit: "Bs",
  },
  { key: "experiencia", label: "Experiencia en el cultivo", unit: "años" },
  { key: "superficie", label: "Superficie cultivada", unit: "ha" },
  { key: "rendimiento", label: "Rendimiento esperado", unit: "kg/ha" },
  { key: "costo", label: "Costo de campaña", unit: "Bs" },
  { key: "precio", label: "Precio esperado de venta", unit: "Bs/kg" },
];
export function ApplicationForm({
  applicationId,
  initialCapture,
  initialInput,
}: {
  applicationId?: number;
  initialCapture?: AgriculturalCapture;
  initialInput?: ApplicationInput;
} = {}) {
  const [parcel, setParcel] = useState({
    ...blankParcel,
    ...initialCapture?.parcel,
  });
  const [productive, setProductive] = useState({
    ...blankProductive,
    ...initialCapture?.productive,
  });
  const [climate, setClimate] = useState<RealClimateObservation | null>(
    initialCapture?.climate ?? null,
  );
  const [purpose, setPurpose] = useState(initialCapture?.purpose ?? "");
  const [period, setPeriod] = useState<"MONTHLY" | "SEASONAL">(
    initialCapture?.period ?? "MONTHLY",
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<number | null>(
    applicationId ?? null,
  );
  function updateParcel(patch: Partial<ParcelDraft>) {
    const updated = mergeParcel(parcel, patch, climate);
    setParcel(updated.parcel);
    setClimate(updated.climate);
  }
  const production = productionIndicators(productive);

  const [input, setInput] = useState<ApplicationInput>({
    ...emptyApplication,
    ...initialInput,
    ...initialCapture?.application,
  });
  const [supplement, setSupplement] = useState<Supplement>({
    ...emptySupplement,
    ...initialCapture?.financial,
  });
  const [step, setStep] = useState(0);
  const [catalogs, setCatalogs] = useState<Catalogs>({
    municipios: [],
    productos: [],
    caedec: [],
  });
  const [catalogError, setCatalogError] = useState("");
  const [reload, setReload] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [storageWarning, setStorageWarning] = useState("");
  useEffect(() => {
    let active = true;
    repository
      .catalogs(input.departamento)
      .then((data) => {
        if (active) {
          setCatalogs(data);
          setCatalogError("");
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setCatalogs({ municipios: [], productos: [], caedec: [] });
          setCatalogError(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los catálogos. Revisa la conexión con FastAPI.",
          );
        }
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, [input.departamento, reload]);
  const update = <K extends keyof ApplicationInput>(
    key: K,
    value: ApplicationInput[K],
  ) => setInput((previous) => ({ ...previous, [key]: value }));
  const indicators =
    period === "MONTHLY"
      ? financialIndicators(supplement)
      : { available: null, payments: null, remaining: null, ratio: null };
  function textField(
    key: keyof ApplicationInput,
    label: string,
    type = "text",
    maxLength?: number,
  ) {
    return (
      <label key={key} htmlFor={key}>
        {label}
        <Input
          className="field-input"
          id={key}
          type={type}
          maxLength={maxLength}
          value={input[key]}
          onChange={(e) => update(key, e.target.value)}
        />
      </label>
    );
  }
  function selectField(
    key: keyof ApplicationInput,
    label: string,
    options: { value: string; label: string }[],
    disabled = false,
  ) {
    return (
      <label htmlFor={key}>
        {label}
        <select
          id={key}
          className="field-input"
          value={input[key]}
          disabled={disabled}
          onChange={(e) => update(key, e.target.value)}
        >
          <option value="">Selecciona una opción</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }
  function validateCurrent(current: number) {
    if (current === 0)
      return validateApplication(input).filter(
        (message) =>
          !["Selecciona", "El monto"].some((start) =>
            message.startsWith(start),
          ),
      );
    if (current === 1)
      return [
        ...validateApplication(input),
        ...(!purpose.trim() ? ["Indica el destino del crédito."] : []),
      ];
    if (current === 2) {
      const required = [
        "plazo",
        "cuota",
        "ingresos",
        "egresos",
        "deuda",
        "cuotasExistentes",
      ] as const;
      return [
        ...validateSupplement(supplement),
        ...required
          .filter((key) => supplement[key].trim() === "")
          .map((key) => `Completa ${key}.`),
      ];
    }
    if (current === 3) {
      const found = validateParcel(parcel);
      setFieldErrors(found);
      return Object.values(found);
    }
    if (current === 4) {
      const found = validateProduction(productive, parcel);
      setFieldErrors(found);
      return Object.values(found);
    }
    return [];
  }
  function next() {
    setErrors([]);
    setFieldErrors({});
    const found = validateCurrent(step);
    if (found.length) {
      setErrors(found);
      return;
    }
    if (step === 2)
      setParcel((previous) => ({
        ...previous,
        department: previous.department || input.departamento,
        municipality: previous.municipality || input.municipio,
        mainCrop: previous.mainCrop || input.producto,
      }));
    if (step === 3)
      setProductive((previous) => ({
        ...previous,
        crop: previous.crop || parcel.mainCrop,
      }));
    setStep((value) => value + 1);
  }
  async function save() {
    if (busy || savedId !== null) return;
    for (let current = 0; current < 5; current++) {
      const found = validateCurrent(current);
      if (found.length) {
        setStep(current);
        setErrors(found);
        return;
      }
    }
    setBusy(true);
    setErrors([]);
    try {
      // Probar almacenamiento antes de crear la solicitud, para evitar perder evidencia.
      writeSession(`bdp:${dataMode}:pending-capture`, {
        application: input,
        financial: supplement,
        purpose,
        period,
        parcel,
        productive,
        climate,
      });
      const id = pendingId ?? (await repository.create(input));
      setPendingId(id);
      const capture: AgriculturalCapture = {
        version: 1,
        solicitudId: id,
        savedAt: new Date().toISOString(),
        application: input,
        financial: supplement,
        purpose,
        period,
        parcel,
        productive,
        climate: climateMatchesParcel(climate, parcel) ? climate : null,
        origin: initialCapture?.origin ?? "DECLARED",
      };
      const legacy = {
        ...supplement,
        experiencia: productive.experienceYears,
        superficie: productive.cultivatedAreaHectares,
        rendimiento: String(Number(productive.historicalYield) * 1000),
        costo: productive.estimatedProductionCost,
        precio: String(Number(productive.expectedSalePrice) / 1000),
      };
      try {
        writeSession(`bdp:${dataMode}:capture:${id}`, capture);
        writeSession(`bdp:${dataMode}:supplement:${id}`, legacy);
        setSavedId(id);
        sessionStorage.removeItem(`bdp:${dataMode}:pending-capture`);
      } catch {
        setStorageWarning(
          `La solicitud #${id} existe, pero falló el guardado de evidencia. Reintenta para el mismo identificador; no se creará otra solicitud.`,
        );
      }
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "No se pudo guardar."]);
    } finally {
      setBusy(false);
    }
  }
  if (savedId !== null)
    return (
      <>
        <PageHeading
          title="Expediente preparado"
          description={
            applicationId
              ? "Captura complementaria actualizada en esta sesión."
              : dataMode === "demo"
                ? "Registro de demostración guardado en esta sesión."
                : "La API confirmó el registro básico de la solicitud."
          }
        />
        <Card className="max-w-2xl p-8">
          <p className="text-2xl font-bold">Solicitud #{savedId}</p>
          <p className="my-5 text-sm leading-6">
            Los datos financieros y productivos complementarios se conservan
            solo en esta sesión. Su persistencia en Oracle requiere ampliar el
            contrato del backend.
          </p>
          {storageWarning && <ErrorNotice>{storageWarning}</ErrorNotice>}
          <Button asChild>
            <Link href={`/solicitudes/${savedId}`}>Abrir expediente</Link>
          </Button>
        </Card>
      </>
    );
  return (
    <>
      <PageHeading
        title={
          applicationId
            ? `Completar evaluación #${applicationId}`
            : "Alta de solicitud y evaluación"
        }
        description="Registra la operación agrícola y prepara la información que utilizará el oficial."
      />
      <ol className="mb-6 grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {steps.map((label, index) => (
          <li
            key={label}
            aria-current={index === step ? "step" : undefined}
            className={`rounded-lg border p-3 text-sm ${index === step ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground"}`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 6) void save();
          else next();
        }}
        noValidate
      >
        <Card className="p-5 md:p-8">
          <h2 className="mb-6 text-xl font-bold">{steps[step]}</h2>
          {step === 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              {textField("ci", "Carnet de identidad", "text", 15)}
              {textField("nombre", "Nombre", "text", 20)}
              {textField("primer_apellido", "Primer apellido", "text", 20)}
              {textField(
                "segundo_apellido",
                "Segundo apellido (opcional)",
                "text",
                20,
              )}
              {textField("fechanac", "Fecha de nacimiento", "date")}
              {selectField("genero", "Género", [
                { value: "Femenino", label: "Femenino" },
                { value: "Masculino", label: "Masculino" },
              ])}
              <div className="md:col-span-2">
                {textField("direccion", "Dirección", "text", 200)}
              </div>
            </div>
          )}
          {step === 1 && (
            <>
              {catalogError && (
                <ErrorNotice>
                  {catalogError}{" "}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCatalogLoading(true);
                      setReload((value) => value + 1);
                    }}
                  >
                    Reintentar
                  </Button>
                </ErrorNotice>
              )}
              <div className="grid gap-5 md:grid-cols-2">
                <label htmlFor="departamento">
                  Departamento
                  <select
                    id="departamento"
                    className="field-input"
                    value={input.departamento}
                    onChange={(e) => {
                      setCatalogLoading(true);
                      setInput((prev) => ({
                        ...prev,
                        departamento: e.target.value,
                        municipio: "",
                      }));
                    }}
                  >
                    <option value="">Selecciona una opción</option>
                    {departments.map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                  </select>
                </label>
                {selectField(
                  "municipio",
                  "Municipio",
                  catalogs.municipios.map((m) => ({
                    value: m.municipio,
                    label: m.municipio,
                  })),
                  catalogLoading || !input.departamento,
                )}
                {selectField(
                  "producto",
                  "Producto / cultivo",
                  catalogs.productos.map((p) => ({
                    value: p.descripcion,
                    label: p.descripcion,
                  })),
                  catalogLoading,
                )}
                {selectField(
                  "caedec",
                  "Actividad CAEDEC",
                  catalogs.caedec.map((c) => ({
                    value: c.caedec,
                    label: `${c.caedec} · ${c.actividad}`,
                  })),
                  catalogLoading,
                )}
                <label htmlFor="monto">
                  Monto solicitado (Bs)
                  <Input
                    id="monto"
                    className="field-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={input.monto || ""}
                    onChange={(e) => update("monto", Number(e.target.value))}
                  />
                </label>
                <label htmlFor="purpose">
                  Destino del crédito
                  <Input
                    id="purpose"
                    className="field-input"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </label>
                {selectField(
                  "messiembra",
                  "Mes de siembra",
                  months.map((name, i) => ({
                    value: String(i + 1),
                    label: name,
                  })),
                )}
              </div>
              {catalogLoading && (
                <p role="status" className="mt-4 text-sm">
                  Cargando catálogos…
                </p>
              )}
              {dataMode === "demo" && (
                <p className="mt-5 text-sm text-muted-foreground">
                  El catálogo sintético incluye Viacha, La Paz. No representa la
                  cobertura real del backend.
                </p>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <p className="mb-6 rounded-lg bg-secondary p-4 text-sm leading-6">
                Primera capa de capacidad de pago declarada. Estos datos no
                modifican el score institucional actual ni se envían todavía a
                Oracle. Los importes mensuales deben corresponder al mismo
                periodo; si los ingresos son estacionales, requieren análisis
                por campaña.
              </p>
              <label className="mb-5" htmlFor="periodo">
                Disponibilidad del ingreso
                <select
                  id="periodo"
                  value={period}
                  onChange={(e) =>
                    setPeriod(e.target.value as "MONTHLY" | "SEASONAL")
                  }
                >
                  <option value="MONTHLY">Mensual regular</option>
                  <option value="SEASONAL">Estacional / por cosecha</option>
                </select>
              </label>
              {period === "SEASONAL" && (
                <p className="mb-4 text-sm text-danger">
                  Los importes mensuales no prueban disponibilidad en cada
                  vencimiento. El análisis mensual se suspende; se requiere
                  flujo por campaña.
                </p>
              )}
              <div className="grid gap-5 md:grid-cols-2">
                {extras
                  .filter((field) =>
                    [
                      "plazo",
                      "cuota",
                      "ingresos",
                      "egresos",
                      "deuda",
                      "cuotasExistentes",
                    ].includes(field.key),
                  )
                  .map((field) => (
                    <label key={field.key} htmlFor={field.key}>
                      {field.label} ({field.unit})
                      <Input
                        id={field.key}
                        className="field-input"
                        type="number"
                        min="0"
                        step={field.key === "plazo" ? "1" : "any"}
                        value={supplement[field.key]}
                        onChange={(e) =>
                          setSupplement((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                      />
                    </label>
                  ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Disponible antes de deuda", indicators.available],
                  ["Pagos mensuales", indicators.payments],
                  ["Remanente mensual", indicators.remaining],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-lg bg-secondary p-4"
                  >
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-2 font-semibold">
                      {money(value as number | null)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <ParcelStep
              parcels={[]}
              value={parcel}
              onChange={updateParcel}
              errors={fieldErrors}
            />
          )}
          {step === 4 && (
            <>
              <ProductiveStep
                value={productive}
                onChange={(patch) =>
                  setProductive((prev) => ({ ...prev, ...patch }))
                }
                errors={fieldErrors}
              />
              <div className="mt-5 rounded-lg bg-secondary p-4 text-sm">
                <p>
                  Producción de referencia:{" "}
                  {production.reference === null
                    ? "Pendiente"
                    : `${production.reference} t`}
                  .
                </p>
                <p>
                  Valor bruto potencial si se vende toda la producción:{" "}
                  {money(production.grossPotential)}.
                </p>
                <p>
                  Excedente declarado antes de deuda: {money(production.margin)}
                  .
                </p>
                <p className="mt-2">
                  Unidades: t/ha, toneladas y Bs/t. El valor bruto supone venta
                  total; no descuenta autoconsumo, semilla o pérdidas. El
                  ingreso declarado puede diferir y requiere explicación del
                  oficial.
                </p>
              </div>
            </>
          )}
          {step === 5 && (
            <>
              <ClimateIntelligenceCard
                latitude={parcel.latitude}
                longitude={parcel.longitude}
                parcelId={parcel.id}
                observation={climate}
                onResult={(value) => {
                  if (climateMatchesParcel(value, parcel)) setClimate(value);
                }}
              />
              {climate && <ClimateChart observation={climate} />}
              <p className="mt-4 text-sm text-muted-foreground">
                Puedes continuar sin clima. Su ausencia queda explícita y no se
                convierte en un valor favorable. Esta evidencia no reemplaza el
                factor municipal de ScoreBDP.
              </p>
            </>
          )}
          {step === 6 && (
            <>
              <dl className="grid gap-5 sm:grid-cols-2">
                {[
                  ["Solicitante", `${input.nombre} ${input.primer_apellido}`],
                  ["CI", input.ci],
                  ["Ubicación", `${input.departamento} / ${input.municipio}`],
                  ["Cultivo", input.producto],
                  ["Monto", money(input.monto)],
                  ["Siembra", months[Number(input.messiembra) - 1]],
                  ["CAEDEC", input.caedec],
                  [
                    "Modo",
                    dataMode === "demo" ? "Demostración local" : "API ScoreBDP",
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-sm text-muted-foreground">
                Guardar registra la solicitud. El score se genera mediante una
                acción separada en el expediente. La parcela y la evidencia
                climática se conservan en la sesión, vinculadas a esta
                solicitud. No modifican por sí solas los factores
                institucionales.
              </p>
            </>
          )}
          {step === 6 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold">Evidencia agrícola</h3>
              <p>
                Parcela: {parcel.name} · {parcel.areaHectares} ha · Origen:{" "}
                {parcel.source ?? "MANUAL"}.
              </p>
              <p>
                Cultivo: {productive.crop} · Superficie:{" "}
                {productive.cultivatedAreaHectares} ha · Rendimiento:{" "}
                {productive.historicalYield} t/ha.
              </p>
              <p>
                Clima:{" "}
                {climate
                  ? `${climate.source} · ${climate.periodStart} a ${climate.periodEnd}`
                  : "No disponible; evidencia pendiente"}
                .
              </p>
              {parcel.municipality.toLowerCase().trim() !==
                input.municipio.toLowerCase().trim() && (
                <p className="text-danger">
                  El municipio de parcela difiere del de solicitud. El score
                  municipal utiliza el de la solicitud; verifica esta
                  discrepancia.
                </p>
              )}
              {productive.crop.toLowerCase().trim() !==
                input.producto.toLowerCase().trim() && (
                <p className="text-danger">
                  El cultivo productivo difiere del producto de la solicitud.
                  Revisa la correspondencia antes de evaluar.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {steps.slice(0, 6).map((name, index) => (
                  <Button
                    key={name}
                    variant="outline"
                    onClick={() => {
                      setStep(index);
                      setErrors([]);
                    }}
                  >
                    Editar {name.toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {applicationId && (
            <p className="mt-4 text-sm text-muted-foreground">
              La edición complementa el expediente local. La API existente no
              ofrece actualización de estos datos; los cambios de solicitud no
              se envían como una nueva solicitud.
            </p>
          )}
          {storageWarning && <ErrorNotice>{storageWarning}</ErrorNotice>}
          {errors.length > 0 && (
            <ErrorNotice>
              <ul className="list-disc pl-5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </ErrorNotice>
          )}
          <div className="mt-8 flex justify-between gap-4">
            {step > 0 ? (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setStep((value) => value - 1);
                  setErrors([]);
                }}
              >
                Atrás
              </Button>
            ) : (
              <span />
            )}
            <Button
              type="submit"
              disabled={
                busy || (step === 1 && (catalogLoading || !!catalogError))
              }
            >
              {busy
                ? "Guardando…"
                : step === 6
                  ? applicationId
                    ? "Guardar captura local"
                    : "Guardar solicitud y expediente"
                  : "Continuar"}
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
}
