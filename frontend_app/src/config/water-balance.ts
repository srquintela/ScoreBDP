/** Provisional MVP ranges, pending specialist validation; not agronomic thresholds. */
export const waterBalanceDemoRule = {
  status: "DEMO",
  version: "water-ratio-demo-1",
  thresholds: { lowUpperExclusive: 0.5, intermediateUpperExclusive: 1 },
  labels: {
    LOW: "Relación baja",
    INTERMEDIATE: "Relación intermedia",
    HIGH: "Relación alta",
  },
} as const;
