import {
  StepCard,
  Field,
  inputClass,
} from "@/features/formulario/components/wizard-ui";
import type { ProductiveProfileDraft } from "@/features/formulario/types";
import type { DraftErrors } from "@/features/formulario/field-errors";

export function ProductiveStep({
  value,
  onChange,
  errors,
}: {
  value: ProductiveProfileDraft;
  onChange: (patch: Partial<ProductiveProfileDraft>) => void;
  errors: DraftErrors;
}) {
  const update =
    (key: keyof ProductiveProfileDraft) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ [key]: event.target.value });
  return (
    <StepCard
      title="Información productiva"
      description="Registra únicamente la información declarada o disponible para la captura."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Cultivo" required error={errors.crop}>
          <input
            className={inputClass}
            value={value.crop}
            onChange={update("crop")}
          />
        </Field>
        <Field
          label="Experiencia con el cultivo (años)"
          required
          error={errors.experienceYears}
        >
          <input
            type="number"
            min="0"
            step="1"
            className={inputClass}
            value={value.experienceYears}
            onChange={update("experienceYears")}
          />
        </Field>
        <Field
          label="Superficie cultivada (ha)"
          required
          error={errors.cultivatedAreaHectares}
        >
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={value.cultivatedAreaHectares}
            onChange={update("cultivatedAreaHectares")}
          />
        </Field>
        <Field
          label="Rendimiento histórico (t/ha)"
          required
          error={errors.historicalYield}
        >
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={value.historicalYield}
            onChange={update("historicalYield")}
          />
        </Field>
        <Field
          label="Producción estimada (t)"
          required
          error={errors.estimatedProduction}
        >
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={value.estimatedProduction}
            onChange={update("estimatedProduction")}
          />
        </Field>
        <Field
          label="Costo estimado (Bs)"
          required
          error={errors.estimatedProductionCost}
        >
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={value.estimatedProductionCost}
            onChange={update("estimatedProductionCost")}
          />
        </Field>
        <Field
          label="Precio esperado de venta (Bs/t)"
          required
          error={errors.expectedSalePrice}
        >
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={value.expectedSalePrice}
            onChange={update("expectedSalePrice")}
          />
        </Field>
        <Field
          label="Ingreso esperado (Bs)"
          required
          error={errors.expectedIncome}
        >
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={value.expectedIncome}
            onChange={update("expectedIncome")}
          />
        </Field>
        <Field
          label="Nivel de diversificación"
          required
          error={errors.diversificationLevel}
        >
          <select
            className={inputClass}
            value={value.diversificationLevel}
            onChange={update("diversificationLevel")}
          >
            <option value="">Seleccionar</option>
            <option value="LOW">Bajo</option>
            <option value="MEDIUM">Medio</option>
            <option value="HIGH">Alto</option>
          </select>
        </Field>
      </div>
    </StepCard>
  );
}
