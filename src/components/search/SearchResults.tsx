"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { NearbyLot } from "@/lib/database.types";
import { AMENITY_LABELS } from "@/lib/database.types";
import { formatCurrency } from "@/lib/booking";

type SortOption = "distance" | "price" | "rating";

const MAP_STYLE = {
  version: 8 as const,
  sources: {
    carto: {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  layers: [{ id: "carto", type: "raster" as const, source: "carto" }],
};

function distanceLabel(distance: number) {
  return distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;
}

function availabilityStyle(spots: number) {
  if (spots <= 0) return "bg-red-50 text-red-700";
  if (spots <= 3) return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700";
}

export default function SearchResults({
  lots,
  destination,
  start,
  end,
  isExpanded = false,
}: {
  lots: NearbyLot[];
  destination: { lat: number; lng: number; address: string };
  start: string;
  end: string;
  isExpanded?: boolean;
}) {
  const [sort, setSort] = useState<SortOption>("distance");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedLot, setSelectedLot] = useState<string | null>(null);

  const filteredLots = useMemo(() => {
    const result = lots.filter((lot) =>
      selectedAmenities.every((amenity) => lot.amenities.includes(amenity))
    );
    return result.sort((a, b) => {
      if (sort === "price") return a.price_per_hour - b.price_per_hour;
      if (sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      return a.distance_m - b.distance_m;
    });
  }, [lots, selectedAmenities, sort]);

  const amenities = Array.from(new Set(lots.flatMap((lot) => lot.amenities)));

  return (
    <div className="mt-5">
      {isExpanded && filteredLots.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          No hay parqueaderos muy cerca de tu destino. Te mostramos las opciones disponibles más cercanas, aunque estén lejos.
        </div>
      )}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <span className="shrink-0 text-sm font-semibold text-neutral-500">Servicios</span>
          {amenities.map((amenity) => {
            const active = selectedAmenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() =>
                  setSelectedAmenities((current) =>
                    active ? current.filter((item) => item !== amenity) : [...current, amenity]
                  )
                }
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  active ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {AMENITY_LABELS[amenity] ?? amenity}
              </button>
            );
          })}
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm font-semibold text-neutral-600">
          Ordenar por
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-blue-500"
          >
            <option value="distance">Distancia</option>
            <option value="price">Menor precio</option>
            <option value="rating">Mejor calificación</option>
          </select>
        </label>
      </div>

      {filteredLots.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
          <span className="text-4xl">🅿️</span>
          <h2 className="mt-4 text-xl font-bold">No encontramos opciones con estos filtros</h2>
          <p className="mt-2 text-neutral-500">Prueba retirando servicios o ajustando el horario.</p>
        </div>
      ) : (
        <div className="grid min-h-[680px] overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg shadow-neutral-900/5 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
          <div className="relative h-[420px] bg-neutral-100 lg:sticky lg:top-[73px] lg:h-[680px]">
            <Map
              initialViewState={{
                longitude: destination.lng,
                latitude: destination.lat,
                zoom: 14,
              }}
              mapStyle={MAP_STYLE}
              style={{ width: "100%", height: "100%" }}
            >
              <NavigationControl position="top-right" />
              <Marker longitude={destination.lng} latitude={destination.lat} anchor="center">
                <div className="grid h-7 w-7 place-items-center rounded-full border-4 border-white bg-neutral-900 shadow-lg" title="Tu destino">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
              </Marker>
              {filteredLots.map((lot) => (
                <Marker key={lot.id} longitude={lot.lng} latitude={lot.lat} anchor="bottom">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLot(lot.id);
                      document.getElementById(`lot-${lot.id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    }}
                    className={`rounded-full border-2 border-white px-2.5 py-1 text-xs font-black shadow-lg transition hover:scale-110 ${
                      selectedLot === lot.id ? "bg-neutral-900 text-white" : "bg-blue-600 text-white"
                    }`}
                    title={lot.name}
                  >
                    {formatCurrency(lot.price_per_hour).replace("COP", "").trim()}
                  </button>
                </Marker>
              ))}
            </Map>
            <div className="pointer-events-none absolute bottom-4 left-4 max-w-xs rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-neutral-600 shadow-md backdrop-blur">
              Destino: {destination.address}
            </div>
          </div>

          <div className="max-h-none space-y-3 overflow-y-auto bg-neutral-50/70 p-3 lg:max-h-[680px] lg:p-4">
            <p className="px-1 text-sm font-semibold text-neutral-500">
              {filteredLots.length} {filteredLots.length === 1 ? "parqueadero disponible" : "parqueaderos disponibles"}
            </p>
            {filteredLots.map((lot) => (
              <article
                id={`lot-${lot.id}`}
                key={lot.id}
                onClick={() => setSelectedLot(lot.id)}
                className={`rounded-2xl border bg-white p-4 transition ${
                  selectedLot === lot.id
                    ? "border-blue-500 shadow-md shadow-blue-100"
                    : "border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-neutral-900">{lot.name}</h2>
                    <p className="mt-1 text-sm text-neutral-500">{distanceLabel(lot.distance_m)} · {lot.address}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-black text-neutral-900">{formatCurrency(lot.price_per_hour)}</p>
                    <p className="text-xs text-neutral-500">por hora</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${availabilityStyle(lot.available_spots)}`}>
                    {lot.available_spots > 0 ? `${lot.available_spots} cupos` : "Sin cupos"}
                  </span>
                  {lot.rating !== null && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">★ {lot.rating.toFixed(1)}</span>
                  )}
                  {lot.amenities.slice(0, 3).map((amenity) => (
                    <span key={amenity} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                      {AMENITY_LABELS[amenity] ?? amenity}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/parqueadero/${lot.id}?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`}
                  className={`mt-4 block rounded-xl px-4 py-2.5 text-center text-sm font-bold transition ${
                    lot.available_spots > 0
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "pointer-events-none bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {lot.available_spots > 0 ? "Ver y reservar" : "No disponible"}
                </Link>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
