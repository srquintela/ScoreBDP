export interface ReverseGeocodingDTO {
  success: boolean;
  department: string | null;
  municipality: string | null;
  source: "DERIVED";
  formattedAddress?: string | null;
  error?: string;
}
