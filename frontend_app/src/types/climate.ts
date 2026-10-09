import type { ClimateObservation } from "@/types/domain";
import type { Coordinates } from "@/lib/maps/geometry";
import type { climateConfig } from "@/config/climate";

export type ClimateVariable = (typeof climateConfig.dailyVariables)[number];
export interface ClimatePeriod {
  periodStart: string;
  periodEnd: string;
}
export interface ClimateQuery extends Coordinates, ClimatePeriod {}

/** Existing DEMO observations remain unchanged. Soil moisture is volumetric percent. */
export interface RealClimateObservation
  extends ClimateObservation, Coordinates {
  source: "Open-Meteo";
  sourceStatus: "REAL";
  droughtRisk: null;
  periodEnd: string;
  consultedAt: string;
  timezone: string;
  gridCoordinates: Coordinates;
  variables: ClimateVariable[];
  units: Record<ClimateVariable, string>;
  coverage: Record<ClimateVariable, number>;
  expectedDays: number;
  dryDays: number | null;
  dryDayThresholdMm: number;
  indicatorStatus: "DEMO";
}

export interface ParsedClimateData {
  dates: string[];
  series: Record<ClimateVariable, (number | null)[]>;
  units: Record<ClimateVariable, string>;
  gridCoordinates: Coordinates;
  timezone: string;
}
