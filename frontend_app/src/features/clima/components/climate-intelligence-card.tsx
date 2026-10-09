"use client";

import { useEffect, useRef, useState } from "react";
import { ThermometerSun } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { climateService } from "@/features/clima/service";
import { ClimateError } from "@/lib/climate/open-meteo-client";
import { getCoordinates } from "@/lib/maps/geometry";
import { ClimateResult } from "@/features/clima/components/climate-result";
import type { RealClimateObservation } from "@/types/climate";
import { climateConfig } from "@/config/climate";

interface Props {
  latitude?: number | string | null;
  longitude?: number | string | null;
  parcelId?: string | null;
  observation?: RealClimateObservation | null;
  onResult?: (result: RealClimateObservation) => void;
}
type State =
  | { status: "idle" | "loading" | "error" | "unavailable" }
  | { status: "success"; data: RealClimateObservation };

export function ClimateIntelligenceCard(props: Props) {
  const coordinates = getCoordinates(props.latitude, props.longitude);
  // Remounting for a new parcel/location prevents stale requests from attaching old evidence.
  return (
    <ClimateCardSession
      key={`${props.parcelId ?? "draft-parcel"}:${coordinates?.latitude}:${coordinates?.longitude}`}
      {...props}
    />
  );
}

function ClimateCardSession(props: Props) {
  const coordinates = getCoordinates(props.latitude, props.longitude);
  const parcelId = props.parcelId ?? "draft-parcel";
  const observation = props.observation;
  const matches =
    observation?.sourceStatus === "REAL" &&
    observation.latitude === coordinates?.latitude &&
    observation.longitude === coordinates?.longitude &&
    observation.parcelId === parcelId;
  const [state, setState] = useState<State>(
    matches
      ? { status: "success", data: observation }
      : { status: coordinates ? "idle" : "unavailable" },
  );
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  async function consult() {
    if (!coordinates || state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const data = await climateService.getObservation({
        ...coordinates,
        parcelId,
      });
      if (!active.current) return;
      setState({ status: "success", data });
      props.onResult?.(data);
    } catch (error) {
      if (!active.current) return;
      setState({
        status:
          error instanceof ClimateError && error.code === "UNAVAILABLE"
            ? "unavailable"
            : "error",
      });
    }
  }

  return (
    <Card
      className="min-w-0 p-5 sm:p-6"
      aria-label="Inteligencia climática"
      aria-busy={state.status === "loading"}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-section-title">Condiciones climáticas</h2>
          <p className="mt-1 text-helper text-muted-foreground">
            Histórico de Open-Meteo como información de apoyo.
          </p>
        </div>
        <ThermometerSun
          className="size-5 shrink-0 text-primary"
          aria-hidden="true"
        />
      </div>
      {state.status === "idle" && (
        <p className="mt-5 text-sm text-muted-foreground">
          Consulta los últimos {climateConfig.historyMonths} meses completos
          disponibles para las coordenadas seleccionadas. Solo se envía la
          ubicación y los parámetros meteorológicos.
        </p>
      )}
      {state.status === "loading" && (
        <p role="status" className="mt-5 text-sm text-muted-foreground">
          Consultando información histórica de Open-Meteo… Puedes continuar la
          captura.
        </p>
      )}
      {state.status === "error" && (
        <div role="alert" className="mt-5 text-sm">
          <p>
            No fue posible obtener la información climática en este momento.
          </p>
          <p className="mt-2 text-muted-foreground">
            Información climática no disponible. Puedes continuar sin esta
            consulta.
          </p>
        </div>
      )}
      {state.status === "unavailable" && (
        <p role="status" className="mt-5 text-sm text-muted-foreground">
          Información climática no disponible.{" "}
          {coordinates
            ? "La fuente no devolvió datos para el período solicitado."
            : "Selecciona una parcela o ingresa coordenadas válidas para consultar."}
        </p>
      )}
      {state.status === "success" && <ClimateResult observation={state.data} />}
      {state.status !== "success" && (
        <Button
          className="mt-5"
          type="button"
          variant="outline"
          disabled={!coordinates || state.status === "loading"}
          onClick={consult}
        >
          {state.status === "error" ||
          (state.status === "unavailable" && coordinates)
            ? "Reintentar"
            : state.status === "loading"
              ? "Consultando…"
              : "Consultar clima"}
        </Button>
      )}
    </Card>
  );
}
