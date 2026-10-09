"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import { MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatHectares } from "@/lib/formatters";
import {
  getCoordinates,
  isParcelGeometry,
  parseCoordinate,
} from "@/lib/maps/geometry";
import type { ParcelMapProps } from "@/components/maps/parcel-map-types";

const LeafletMap = dynamic(
  () => import("@/components/maps/parcel-map-client"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-80 items-center justify-center bg-muted text-sm text-muted-foreground sm:h-96"
        role="status"
      >
        Cargando mapa de parcela…
      </div>
    ),
  },
);

class MapBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div
          className="flex h-80 flex-col items-center justify-center gap-3 bg-muted p-6 text-center sm:h-96"
          role="alert"
        >
          <MapPinned
            className="size-6 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm">
            No se pudo mostrar el mapa. Los datos de la parcela siguen
            disponibles.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => this.setState({ failed: false })}
          >
            Reintentar mapa
          </Button>
        </div>
      );
    return this.props.children;
  }
}

export function ParcelMap(props: ParcelMapProps) {
  const coordinates = getCoordinates(props.latitude, props.longitude);
  const invalidGeometry =
    props.geometry != null && !isParcelGeometry(props.geometry);
  const area = parseCoordinate(props.areaHectares);
  return (
    <section
      aria-label="Mapa de parcela"
      className="min-w-0 overflow-hidden rounded-lg border border-border bg-card"
    >
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">
          {props.name || "Mapa de parcela"}
        </p>
        <p className="mt-1 text-helper text-muted-foreground">
          {props.mode === "EDITABLE"
            ? "Haz clic en el mapa o arrastra el marcador. También puedes ingresar las coordenadas en los campos."
            : "Ubicación y delimitación registradas de la parcela."}
        </p>
        {!coordinates && (
          <p className="mt-2 text-helper text-muted-foreground" role="status">
            Sin coordenadas válidas. Vista general de Bolivia.
          </p>
        )}
        {invalidGeometry && (
          <p className="mt-2 text-helper text-warning" role="status">
            La geometría no es válida y no se puede dibujar. Las coordenadas
            siguen disponibles.
          </p>
        )}
      </div>
      <MapBoundary>
        <LeafletMap
          {...props}
          geometry={invalidGeometry ? null : props.geometry}
        />
      </MapBoundary>
      <div
        className="flex flex-wrap justify-between gap-2 border-t border-border px-4 py-3 text-helper text-muted-foreground"
        aria-live="polite"
      >
        <span>
          {coordinates
            ? `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`
            : "Ubicación pendiente"}
        </span>
        <span>
          Superficie registrada:{" "}
          {area !== null && area > 0 ? formatHectares(area) : "No disponible"}
        </span>
      </div>
    </section>
  );
}
