import type { AgriculturalCapture } from "./agricultural-capture";
import { emptyApplication, emptySupplement } from "./validation";
import { blankParcel, blankProductive } from "./agricultural-capture";
export function createPilot(): AgriculturalCapture {
  return {
    version: 1,
    solicitudId: 1,
    savedAt: new Date().toISOString(),
    origin: "SYNTHETIC",
    purpose: "Insumos para una campaña demostrativa",
    period: "MONTHLY",
    application: {
      ...emptyApplication,
      ci: "DEMO-001",
      nombre: "Productora",
      primer_apellido: "Demostración",
      fechanac: "1990-01-01",
      genero: "Femenino",
      direccion: "Dirección ficticia para demostración",
      departamento: "La Paz",
      municipio: "Viacha",
      producto: "Papa",
      caedec: "DEMO-AGRO",
      monto: 25000,
      messiembra: "9",
    },
    financial: {
      ...emptySupplement,
      plazo: "12",
      cuota: "1000",
      ingresos: "5000",
      egresos: "2000",
      deuda: "10000",
      cuotasExistentes: "500",
    },
    parcel: {
      ...blankParcel,
      id: "demo-parcel-1",
      name: "Polígono sintético · sin propietario real",
      department: "La Paz",
      municipality: "Viacha",
      latitude: "-16.65",
      longitude: "-68.3",
      areaHectares: "2",
      mainCrop: "Papa",
      source: "DEMO",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-68.3007, -16.6507],
            [-68.2993, -16.6507],
            [-68.2993, -16.6493],
            [-68.3007, -16.6493],
            [-68.3007, -16.6507],
          ],
        ],
      },
    },
    productive: {
      ...blankProductive,
      crop: "Papa",
      experienceYears: "5",
      cultivatedAreaHectares: "2",
      historicalYield: "5",
      estimatedProduction: "10",
      estimatedProductionCost: "12000",
      expectedSalePrice: "3000",
      expectedIncome: "27000",
      diversificationLevel: "MEDIUM",
    },
    climate: null,
  };
}
