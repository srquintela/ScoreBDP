"use client";

import { useEffect, useRef, useState } from "react";
import { divIcon, geoJSON, type Marker as LeafletMarker } from "leaflet";
import {
  GeoJSON,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styles from "@/components/maps/parcel-map.module.css";
import { mapConfig } from "@/config/maps";
import { getMapView, selectCoordinates } from "@/lib/maps/geometry";
import type { ParcelMapProps } from "@/components/maps/parcel-map-types";
import { Button } from "@/components/ui/button";

const markerIcon = divIcon({
  className: styles.marker,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});
const parcelStyle = {
  color: "var(--primary)",
  fillColor: "var(--primary)",
  weight: 2,
  fillOpacity: 0.15,
};

function MapSync(props: ParcelMapProps) {
  const map = useMap();
  const previousGeometry = useRef<string | undefined>(undefined);
  const view = getMapView(props.latitude, props.longitude);
  const geometryKey = JSON.stringify(props.geometry ?? null);
  const [lat, lng] = view.center;
  const hasCoordinates = view.coordinates !== null;
  useEffect(() => {
    const geometryChanged = previousGeometry.current !== geometryKey;
    previousGeometry.current = geometryKey;
    if (hasCoordinates && props.geometry && geometryChanged) {
      const bounds = geoJSON(props.geometry).getBounds().extend([lat, lng]);
      map.fitBounds(bounds, {
        padding: [24, 24],
        maxZoom: mapConfig.parcelZoom,
        animate: false,
      });
    } else {
      map.setView(
        [lat, lng],
        hasCoordinates
          ? Math.max(map.getZoom(), mapConfig.parcelZoom)
          : mapConfig.overviewZoom,
        { animate: false },
      );
    }
  }, [map, lat, lng, geometryKey, props.geometry, hasCoordinates]);

  useEffect(() => {
    const observer = new ResizeObserver(() =>
      map.invalidateSize({ pan: false }),
    );
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  useMapEvents({
    click(event) {
      if (props.mode !== "EDITABLE") return;
      const coordinates = selectCoordinates(event.latlng.lat, event.latlng.lng);
      if (coordinates) props.onLocationChange(coordinates);
    },
  });
  return null;
}

export default function ParcelMapClient(props: ParcelMapProps) {
  const view = getMapView(props.latitude, props.longitude);
  const [tileStatus, setTileStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [tileAttempt, setTileAttempt] = useState(0);
  useEffect(() => {
    if (tileStatus !== "loading") return;
    const timeout = setTimeout(() => setTileStatus("error"), 10000);
    return () => clearTimeout(timeout);
  }, [tileStatus, tileAttempt]);
  return (
    <>
      {tileStatus === "loading" && (
        <p
          role="status"
          className="bg-muted px-4 py-2 text-helper text-muted-foreground"
        >
          Cargando cartografía OpenStreetMap…
        </p>
      )}
      {tileStatus === "error" && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 bg-muted px-4 py-2 text-helper"
        >
          <span>
            La cartografía no está disponible o se cargó parcialmente. Puedes
            usar los campos de coordenadas.
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setTileStatus("loading");
              setTileAttempt((value) => value + 1);
            }}
          >
            Reintentar cartografía
          </Button>
        </div>
      )}
      <MapContainer
        center={view.center}
        zoom={view.zoom}
        minZoom={mapConfig.minZoom}
        maxZoom={mapConfig.maxZoom}
        scrollWheelZoom={false}
        className={styles.viewport}
      >
        <TileLayer
          key={tileAttempt}
          url={mapConfig.tiles.url}
          attribution={mapConfig.tiles.attribution}
          maxZoom={mapConfig.maxZoom}
          eventHandlers={{
            tileload: () =>
              setTileStatus((status) =>
                status === "loading" ? "ready" : status,
              ),
            tileerror: () => setTileStatus("error"),
          }}
        />
        <MapSync {...props} />
        {props.geometry && (
          <GeoJSON
            key={JSON.stringify(props.geometry)}
            data={props.geometry}
            style={parcelStyle}
          />
        )}
        {view.coordinates && (
          <Marker
            position={view.center}
            icon={markerIcon}
            draggable={props.mode === "EDITABLE"}
            title={
              props.mode === "EDITABLE"
                ? "Ubicación de parcela; arrastra para mover"
                : "Ubicación de parcela"
            }
            alt="Ubicación de parcela"
            eventHandlers={{
              dragend(event) {
                if (props.mode !== "EDITABLE") return;
                const position = (event.target as LeafletMarker).getLatLng();
                const coordinates = selectCoordinates(
                  position.lat,
                  position.lng,
                );
                if (coordinates) props.onLocationChange(coordinates);
              },
            }}
          >
            <Tooltip>{props.name || "Parcela productiva"}</Tooltip>
          </Marker>
        )}
      </MapContainer>
    </>
  );
}
