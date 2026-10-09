import type { ApplicationInput, Supplement } from "@/lib/scorebdp/contracts";
import type {
  ParcelDraft,
  ProductiveProfileDraft,
} from "@/features/formulario/types";
import type { RealClimateObservation } from "@/types/climate";
import { climateMatchesParcel } from "@/features/clima/parcel-evidence";
import { getCoordinates, isParcelGeometry } from "@/lib/maps/geometry";
export interface AgriculturalCapture {
  version: 1;
  solicitudId: number;
  savedAt: string;
  application: ApplicationInput;
  financial: Supplement;
  purpose: string;
  period: "MONTHLY" | "SEASONAL";
  parcel: ParcelDraft;
  productive: ProductiveProfileDraft;
  climate: RealClimateObservation | null;
  origin: "DECLARED" | "SYNTHETIC";
}
export const blankParcel: ParcelDraft = {
  id: null,
  name: "",
  department: "",
  municipality: "",
  community: "",
  latitude: "",
  longitude: "",
  areaHectares: "",
  mainCrop: "",
  geometry: null,
  source: "MANUAL",
};
export const blankProductive: ProductiveProfileDraft = {
  crop: "",
  experienceYears: "",
  cultivatedAreaHectares: "",
  historicalYield: "",
  estimatedProduction: "",
  estimatedProductionCost: "",
  expectedSalePrice: "",
  expectedIncome: "",
  diversificationLevel: "",
};
export function mergeParcel(
  parcel: ParcelDraft,
  patch: Partial<ParcelDraft>,
  climate: RealClimateObservation | null,
) {
  const next = { ...parcel, ...patch };
  if (
    (patch.latitude !== undefined && patch.latitude !== parcel.latitude) ||
    (patch.longitude !== undefined && patch.longitude !== parcel.longitude)
  ) {
    // Una edición manual del punto no conserva un vínculo Kobo o un polígono anterior.
    if (patch.geometry === undefined) {
      next.geometry = null;
      next.source = "MANUAL";
      next.koboSubmissionId = null;
      next.id = null;
    }
  }
  return {
    parcel: next,
    climate: climateMatchesParcel(climate, next) ? climate : null,
  };
}
export function validateParcel(parcel: ParcelDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const key of ["name", "department", "municipality", "mainCrop"] as const)
    if (!parcel[key].trim()) errors[key] = "Completa este dato de la parcela.";
  if (!getCoordinates(parcel.latitude, parcel.longitude)) {
    errors.latitude = "Ingresa coordenadas válidas.";
    errors.longitude = "Ingresa coordenadas válidas.";
  }
  if (
    !Number.isFinite(Number(parcel.areaHectares)) ||
    Number(parcel.areaHectares) <= 0
  )
    errors.areaHectares = "La superficie debe ser mayor que cero.";
  if (parcel.geometry && !isParcelGeometry(parcel.geometry))
    errors.name = "La geometría de la parcela no es válida.";
  return errors;
}
export function validateProduction(
  productive: ProductiveProfileDraft,
  parcel: ParcelDraft,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!productive.crop.trim()) errors.crop = "Ingresa el cultivo.";
  for (const key of [
    "experienceYears",
    "historicalYield",
    "estimatedProduction",
    "estimatedProductionCost",
    "expectedSalePrice",
    "expectedIncome",
  ] as const) {
    const value = productive[key];
    if (
      value.trim() === "" ||
      !Number.isFinite(Number(value)) ||
      Number(value) < 0
    )
      errors[key] = "Ingresa un número no negativo.";
  }
  if (
    !Number.isFinite(Number(productive.cultivatedAreaHectares)) ||
    Number(productive.cultivatedAreaHectares) <= 0 ||
    Number(productive.cultivatedAreaHectares) > Number(parcel.areaHectares)
  )
    errors.cultivatedAreaHectares =
      "La superficie debe ser positiva y no superar la parcela.";
  if (!["LOW", "MEDIUM", "HIGH"].includes(productive.diversificationLevel))
    errors.diversificationLevel = "Selecciona la diversificación.";
  return errors;
}
export function productionIndicators(value: ProductiveProfileDraft) {
  const number = (key: keyof ProductiveProfileDraft) =>
    value[key].trim() !== "" && Number.isFinite(Number(value[key]))
      ? Number(value[key])
      : null;
  const area = number("cultivatedAreaHectares"),
    yieldValue = number("historicalYield"),
    estimated = number("estimatedProduction"),
    price = number("expectedSalePrice"),
    income = number("expectedIncome"),
    cost = number("estimatedProductionCost");
  return {
    reference: area !== null && yieldValue !== null ? area * yieldValue : null,
    grossPotential:
      estimated !== null && price !== null ? estimated * price : null,
    margin: income !== null && cost !== null ? income - cost : null,
  };
}
