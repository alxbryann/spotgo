"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map, { AttributionControl, Layer, Marker, NavigationControl, Source, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE } from "@/lib/map-style";

type Position = { lat: number; lng: number };
type RouteData = {
  distance: number;
  duration: number;
  geometry: { type: "LineString"; coordinates: [number, number][] };
};

function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export default function RoutePlanner({
  destination,
  name,
  address,
}: {
  destination: Position;
  name: string;
  address: string;
}) {
  const mapRef = useRef<MapRef>(null);
  const requestedInitialRoute = useRef(false);
  const [origin, setOrigin] = useState<Position | null>(null);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoute = useCallback(async (position: Position) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        fromLat: String(position.lat),
        fromLng: String(position.lng),
        toLat: String(destination.lat),
        toLng: String(destination.lng),
      });
      const response = await fetch(`/api/directions?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setRoute(data as RouteData);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos calcular la ruta.");
    } finally {
      setLoading(false);
    }
  }, [destination.lat, destination.lng]);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Este navegador no permite obtener tu ubicación.");
      setLoading(false);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = { lat: coords.latitude, lng: coords.longitude };
        setOrigin(next);
        void loadRoute(next);
      },
      () => {
        setError("Activa la ubicación para trazar la ruta desde donde estás.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 }
    );
  }, [loadRoute]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const next = { lat: coords.latitude, lng: coords.longitude };
        setOrigin(next);
        if (!requestedInitialRoute.current) {
          requestedInitialRoute.current = true;
          void loadRoute(next);
        }
      },
      () => {
        setError("Activa la ubicación para trazar la ruta desde donde estás.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [loadRoute]);

  useEffect(() => {
    if (!route?.geometry.coordinates.length) return;
    const lngs = route.geometry.coordinates.map(([lng]) => lng);
    const lats = route.geometry.coordinates.map(([, lat]) => lat);
    mapRef.current?.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: { top: 90, right: 45, bottom: 250, left: 45 }, duration: 700 }
    );
  }, [route]);

  return (
    <div className="relative min-h-[calc(100dvh-65px)] overflow-hidden bg-slate-200">
      <div className="absolute inset-0">
        <Map
          ref={mapRef}
          initialViewState={{ longitude: destination.lng, latitude: destination.lat, zoom: 14 }}
          mapStyle={MAP_STYLE}
          attributionControl={false}
        >
          <NavigationControl position="top-right" showCompass={false} visualizePitch={false} />
          <AttributionControl position="bottom-right" compact />
          {route && (
            <Source id="route" type="geojson" data={{ type: "Feature", properties: {}, geometry: route.geometry }}>
              <Layer id="route-shadow" type="line" paint={{ "line-color": "#ffffff", "line-width": 10, "line-opacity": 0.9 }} />
              <Layer id="route-line" type="line" paint={{ "line-color": "#4d7c0f", "line-width": 6 }} />
            </Source>
          )}
          {origin && (
            <Marker longitude={origin.lng} latitude={origin.lat} anchor="center">
              <span className="block size-5 rounded-full border-4 border-white bg-blue-600 shadow-md" aria-label="Tu ubicación" />
            </Marker>
          )}
          <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
            <span className="spotgo-map-pin" aria-label={name}><span>P</span></span>
          </Marker>
        </Map>
      </div>

      <div className="pointer-events-none relative z-10 flex min-h-[calc(100dvh-65px)] flex-col p-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto w-fit rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-md">
          Ruta en SpotGo
        </div>

        <section className="pointer-events-auto mt-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-extrabold uppercase text-lime-700">Tu destino</p>
            {origin && <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600"><span className="size-2 rounded-full bg-blue-600" aria-hidden="true" /> Ubicación en vivo</span>}
          </div>
          <h1 className="mt-1 text-balance text-xl font-black text-slate-950">{name}</h1>
          <p className="mt-1 text-sm text-slate-600">{address}</p>

          {route && (
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-100 p-4">
              <div><p className="text-xs font-bold uppercase text-slate-600">Llegas en</p><p className="mt-1 tabular-nums text-2xl font-black text-slate-950">{formatDuration(route.duration)}</p></div>
              <div><p className="text-xs font-bold uppercase text-slate-600">Distancia</p><p className="mt-1 tabular-nums text-2xl font-black text-slate-950">{formatDistance(route.distance)}</p></div>
            </div>
          )}

          {loading && <p role="status" className="mt-4 text-sm font-semibold text-slate-700">Calculando la mejor ruta…</p>}
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

          <button
            type="button"
            onClick={locate}
            disabled={loading}
            className="mt-4 min-h-12 w-full rounded-xl bg-slate-950 px-5 font-extrabold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {route ? "Actualizar desde mi ubicación" : "Usar mi ubicación"}
          </button>
        </section>
      </div>
    </div>
  );
}
