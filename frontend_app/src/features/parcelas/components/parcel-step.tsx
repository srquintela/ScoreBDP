"use client";

import { useState } from "react";
import { ParcelMap } from "@/components/maps/parcel-map";
import { parcelLocationPatch } from "@/features/parcelas/parcel-location";
import {
  StepCard,
  Field,
  inputClass,
} from "@/features/formulario/components/wizard-ui";
import { KoboImportPanel } from "@/features/parcelas/components/kobo-import-panel";
import type { Parcel } from "@/types/domain";
import type { ParcelDraft } from "@/features/formulario/types";
import type { DraftErrors } from "@/features/formulario/field-errors";

function toDraft(parcel: Parcel): ParcelDraft {
  return {
    id: parcel.id,
    name: parcel.name,
    department: parcel.department,
    municipality: parcel.municipality,
    community: parcel.community,
    latitude: String(parcel.latitude),
    longitude: String(parcel.longitude),
    areaHectares: String(parcel.areaHectares),
    mainCrop: parcel.mainCrop,
    geometry: parcel.geometry,
    source: "DEMO",
  };
}

export function ParcelStep({
  parcels,
  value,
  onChange,
  errors,
}: {
  parcels: Parcel[];
  value: ParcelDraft;
  onChange: (patch: Partial<ParcelDraft>) => void;
  errors: DraftErrors;
}) {
  const [isKoboSelected, setIsKoboSelected] = useState<boolean>(
    value.source === "KOBO",
  );

  const update =
    (key: keyof ParcelDraft) => (event: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ [key]: event.target.value });

  // Compute selected value for the dropdown
  let currentSelectValue = "";
  if (isKoboSelected || value.source === "KOBO") {
    currentSelectValue = "kobo";
  } else if (value.id && parcels.some((p) => p.id === value.id)) {
    currentSelectValue = value.id;
  }

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value;
    if (selected === "kobo") {
      setIsKoboSelected(true);
      // Reset demo id if any, but keep other manual fields
      if (value.source === "DEMO") {
        onChange({ id: null, geometry: null, source: "KOBO" });
      }
    } else if (selected === "") {
      setIsKoboSelected(false);
      onChange({ id: null, geometry: null, source: "MANUAL" });
    } else {
      setIsKoboSelected(false);
      const parcel = parcels.find((item) => item.id === selected);
      if (parcel) {
        onChange(toDraft(parcel));
      } else {
        onChange({ id: null, geometry: null, source: "MANUAL" });
      }
    }
  };

  const handleFallbackToManual = () => {
    setIsKoboSelected(false);
    onChange({ id: null, geometry: null, source: "MANUAL" });
  };

  return (
    <StepCard
      title="Parcela productiva"
      description="Importa una parcela desde Kobo o registra su ubicación manualmente. Confirma siempre su relación con esta solicitud."
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <label
          className="text-label font-semibold text-muted-foreground"
          htmlFor="parcel-select"
        >
          Origen / captura de parcela
        </label>
        <select
          id="parcel-select"
          className={inputClass + " max-w-sm"}
          value={currentSelectValue}
          onChange={handleSelectChange}
        >
          <option value="">Registrar datos manualmente</option>
          <option value="kobo">Importar desde Kobo BDP</option>
          {parcels.length > 0 && (
            <optgroup label="Parcelas DEMO">
              {parcels.map((parcel) => (
                <option key={parcel.id} value={parcel.id}>
                  {parcel.name} · {parcel.mainCrop}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {(isKoboSelected || value.source === "KOBO") && (
        <KoboImportPanel
          currentDraft={value}
          onImport={(patch) => {
            onChange(patch);
          }}
          onFallbackToManual={handleFallbackToManual}
        />
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre / identificador" required error={errors.name}>
          <input
            className={inputClass}
            value={value.name}
            onChange={update("name")}
          />
        </Field>
        <Field label="Cultivo principal" required error={errors.mainCrop}>
          <input
            className={inputClass}
            value={value.mainCrop}
            onChange={update("mainCrop")}
          />
        </Field>
        <Field label="Departamento" required error={errors.department}>
          <input
            className={inputClass}
            value={value.department}
            onChange={update("department")}
          />
        </Field>
        <Field label="Municipio" required error={errors.municipality}>
          <input
            className={inputClass}
            value={value.municipality}
            onChange={update("municipality")}
          />
        </Field>
        <Field label="Comunidad">
          <input
            className={inputClass}
            value={value.community}
            onChange={update("community")}
          />
        </Field>
        <Field label="Superficie (ha)" required error={errors.areaHectares}>
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={value.areaHectares}
            onChange={update("areaHectares")}
          />
        </Field>
        <Field label="Latitud" required error={errors.latitude}>
          <input
            type="number"
            min="-90"
            max="90"
            step="0.00001"
            className={inputClass}
            value={value.latitude}
            onChange={update("latitude")}
          />
        </Field>
        <Field label="Longitud" required error={errors.longitude}>
          <input
            type="number"
            min="-180"
            max="180"
            step="0.00001"
            className={inputClass}
            value={value.longitude}
            onChange={update("longitude")}
          />
        </Field>
      </div>

      <div className="mt-6" id="parcel-map-container">
        <ParcelMap
          mode="EDITABLE"
          name={value.name}
          latitude={value.latitude}
          longitude={value.longitude}
          areaHectares={value.areaHectares}
          geometry={value.geometry}
          onLocationChange={(coordinates) =>
            onChange(parcelLocationPatch(coordinates))
          }
        />
      </div>
    </StepCard>
  );
}
