import type { Parcel, Producer } from "@/types/domain";
import type { RealClimateObservation } from "@/types/climate";

export interface CreditApplicationDraft {
  requestedAmount: string;
  termMonths: string;
  purpose: string;
  financedCrop: string;
  estimatedInstallment: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  currentDebt: string;
}

export interface ParcelDraft {
  id: string | null;
  name: string;
  department: string;
  municipality: string;
  community: string;
  latitude: string;
  longitude: string;
  areaHectares: string;
  mainCrop: string;
  geometry: Parcel["geometry"];
  source?: "MANUAL" | "KOBO" | "DEMO";
  koboSubmissionId?: string | null;
}

export interface ProductiveProfileDraft {
  crop: string;
  experienceYears: string;
  cultivatedAreaHectares: string;
  historicalYield: string;
  estimatedProduction: string;
  estimatedProductionCost: string;
  expectedSalePrice: string;
  expectedIncome: string;
  diversificationLevel: "" | "LOW" | "MEDIUM" | "HIGH";
}

export interface EvaluationDraft {
  producer: Producer | null;
  creditApplication: CreditApplicationDraft;
  parcel: ParcelDraft;
  productiveProfile: ProductiveProfileDraft;
  climate?: RealClimateObservation | null;
  metadata: {
    startedAt: string;
    sourceStatus: "DEMO";
  };
}

export type EvaluationStep = 1 | 2 | 3 | 4 | 5;
export type EvaluationPhase = "FORM" | "ANALYSIS" | "REDIRECTING";
