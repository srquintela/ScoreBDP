import type { Polygon } from "geojson";

export interface KoboRawSubmission {
  _id: number;
  _uuid: string;
  start?: string;
  end?: string;
  Record_an_area?: string;
  _submission_time?: string;
  [key: string]: unknown;
}

export interface KoboSubmissionDTO {
  submissionId: string;
  submissionUuid: string;
  startedAt: string | null;
  submissionTime: string | null;
  hasGeoshape: boolean;
  rawGeoshape: string | null;
}

export interface KoboSubmissionsApiResponse {
  success: boolean;
  count: number;
  data: KoboSubmissionDTO[];
  captureUrl?: string;
  error?: string;
}

export interface ParsedKoboGeoshape {
  polygon: Polygon;
  centroid: {
    latitude: number;
    longitude: number;
  };
  areaHectares: number;
}
