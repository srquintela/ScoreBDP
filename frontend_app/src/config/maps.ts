export const mapConfig = {
  boliviaCenter: [-16.5, -64.5] as [number, number],
  overviewZoom: 5,
  parcelZoom: 15,
  minZoom: 3,
  maxZoom: 19,
  tiles: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
} as const;
