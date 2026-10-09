import type { MultiPolygon, Polygon } from "geojson";

export type SourceStatus = "REAL" | "DEMO" | "UNAVAILABLE" | "DERIVED";
export type Severity = "LOW" | "MEDIUM" | "HIGH";
export type RiskLevel = Severity;
export type DataValue = string | number | boolean | null;
export type SourceCategory = "PRODUCTIVE" | "CREDIT" | "CLIMATE" | "SATELLITE";
export type IntegrationType = "MOCK" | "REST" | "MANUAL" | "KOBO";

export interface SourceReference {
  sourceId: string;
  source: string;
  sourceStatus: SourceStatus;
}

export interface DataSource {
  id: string;
  name: string;
  category: SourceCategory;
  status: SourceStatus;
  integrationType: IntegrationType;
  lastUpdatedAt: string | null;
  description: string;
}

export interface Producer {
  id: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  municipality: string;
  community: string;
  mainActivity: string;
  mainCrop: string;
  agriculturalExperienceYears: number;
  createdAt: string;
}

export type ApplicationStatus = "DRAFT" | "UNDER_REVIEW" | "EVALUATED";

export interface CreditApplication {
  id: string;
  producerId: string;
  requestedAmount: number;
  currency: "BOB";
  termMonths: number;
  purpose: string;
  financedCrop: string;
  estimatedInstallment: number;
  installmentFrequency: "MONTHLY";
  monthlyIncome: number;
  monthlyExpenses: number;
  currentDebt: number;
  status: ApplicationStatus;
  createdAt: string;
}

export interface Parcel {
  id: string;
  producerId: string;
  name: string;
  department: string;
  municipality: string;
  community: string;
  latitude: number;
  longitude: number;
  areaHectares: number;
  /** WGS84, GeoJSON [longitude, latitude]. Null means no geometry is available. */
  geometry: Polygon | MultiPolygon | null;
  mainCrop: string;
}

/** Amounts in BOB; yield in t/ha, production in t, sale price in BOB/t, per campaign. */
export interface ProductiveProfile extends SourceReference {
  producerId: string;
  crop: string;
  experienceYears: number;
  cultivatedAreaHectares: number;
  historicalYield: number;
  estimatedProduction: number;
  estimatedProductionCost: number;
  expectedSalePrice: number;
  expectedIncome: number;
  diversificationLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface CreditProfile extends SourceReference {
  producerId: string;
  previousCredits: number;
  paymentBehavior: "TIMELY" | "OCCASIONAL_ARREARS" | "REPEATED_ARREARS";
  historicalArrearsDays: number;
  currentDebt: number;
  debtLevel: Severity;
  /** Monthly amount in BOB available for a new installment, after existing commitments. */
  estimatedPaymentCapacity: number;
}

/** Totals in mm over periodStart..observedAt; temperature °C; soil moisture %. */
export interface ClimateObservation extends SourceReference {
  id: string;
  parcelId: string;
  precipitation: number | null;
  averageTemperature: number | null;
  soilMoisture: number | null;
  evapotranspiration: number | null;
  droughtRisk: Severity | null;
  periodStart: string;
  observedAt: string;
}

/** NDVI/NDWI [-1, 1]; anomalyPercentage [0, 100]. Missing values remain null. */
export interface SatelliteObservation extends SourceReference {
  id: string;
  parcelId: string;
  ndvi: number | null;
  ndwi: number | null;
  ndviTrend: "STABLE" | "INCREASING" | "DECREASING" | null;
  anomalyPercentage: number | null;
  observedAt: string;
}

export interface ProductiveAssessment extends SourceReference {
  producerId: string;
  parcelId: string;
  productivePotentialIndex: number;
  productiveVocationIndex: number;
  complexityManagementIndex: number;
  observedAt: string;
}
