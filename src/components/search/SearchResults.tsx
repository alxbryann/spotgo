"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { SquareParking, Star } from "lucide-react";
import type { NearbyLot } from "@/lib/database.types";
import { AMENITY_LABELS } from "@/lib/database.types";
import { formatCurrency } from "@/lib/booking";
import { MAP_STYLE } from "@/lib/map-style";
import { AvailabilityMeter, Badge, Tag, buttonClass, occupancyTone } from "@/components/ui";

type SortOption = "distance" | "price" | "rating";

function distanceLabel(distance: number) {
  return distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;
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
        <div className="mb-4 rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-100 px-4 py-3 text-[13px] font-semibold text-amber-700">
          No hay parqueaderos muy cerca de tu destino. Te mostramos las opciones disponibles más
          cercanas, aunque estén lejos.
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-subtle bg-card p-3 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <span className="ds-caption shrink-0 text-muted">Servicios</span>
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
                className={`shrink-0 rounded-[var(--radius-pill)] px-3 py-1.5 text-[13px] font-bold transition-colors duration-[var(--dur-fast)] ${
                  active
                    ? "bg-inverse text-on-inverse"
                    : "bg-sunken text-muted hover:bg-gray-200 hover:text-strong"
                }`}
              >
                {AMENITY_LABELS[amenity] ?? amenity}
              </button>
            );
          })}
        </div>
        <label className="flex shrink-0 items-center gap-2 text-[13px] font-bold text-muted">
          Ordenar por
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="rounded-[var(--radius-md)] border border-default bg-card px-3 py-2 text-[13px] font-bold text-strong outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-focus)]"
          >
            <option value="distance">Distancia</option>
            <option value="price">Menor precio</option>
            <option value="rating">Mejor calificación</option>
          </select>
        </label>
      </div>

      {filteredLots.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border border-dashed border-default bg-card px-6 py-16 text-center">
          <SquareParking className="mx-auto size-8 text-faint" strokeWidth={2} aria-hidden />
          <h2
            className="ds-display mt-4 text-strong"
            style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-display)" }}
          >
            No hay parqueaderos con esos filtros
          </h2>
          <p className="mt-2 text-[15px] text-muted">Retira algún servicio o ajusta el horario.</p>
        </div>
      ) : (
        <div className="grid min-h-[680px] overflow-hidden rounded-[var(--radius-xl)] border border-subtle bg-card shadow-md lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
          <div className="relative h-[420px] bg-sunken lg:sticky lg:top-16 lg:h-[680px]">
            <Map
              initialViewState={{
                longitude: destination.lng,
                latitude: destination.lat,
                zoom: 14,
              }}
              mapStyle={MAP_STYLE}
              style={{ width: "100%", height: "100%" }}
              reuseMaps={false}
            >
              <NavigationControl position="top-right" />
              <Marker longitude={destination.lng} latitude={destination.lat} anchor="center">
                <div
                  className="grid size-7 place-items-center rounded-full border-4 border-white bg-blue-500 shadow-md"
                  title="Tu destino"
                >
                  <span className="size-1.5 rounded-full bg-white" />
                </div>
              </Marker>
              {filteredLots.map((lot) => {
                const { color } = occupancyTone(lot.available_spots, lot.total_spots);
                return (
                  <Marker key={lot.id} longitude={lot.lng} latitude={lot.lat} anchor="bottom">
                    <div className="group relative">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLot(lot.id);
                          document
                            .getElementById(`lot-${lot.id}`)
                            ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        }}
                        aria-label={`${lot.name}, ${formatCurrency(lot.price_per_hour)} por hora`}
                        className="spotgo-map-pin"
                        data-selected={selectedLot === lot.id}
                        style={{ "--pin-dot": color } as React.CSSProperties}
                      >
                        {formatCurrency(lot.price_per_hour)}
                      </button>
                      <span
                        aria-hidden
                        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2.5 -translate-x-1/2 rounded-[var(--radius-sm)] bg-inverse px-2.5 py-1.5 text-[13px] font-bold whitespace-nowrap text-on-inverse opacity-0 shadow-lg transition-opacity duration-[var(--dur-fast)] group-hover:opacity-100 group-focus-within:opacity-100"
                      >
                        {lot.name}
                      </span>
                    </div>
                  </Marker>
                );
              })}
            </Map>
            <div className="pointer-events-none absolute bottom-4 left-4 max-w-xs rounded-[var(--radius-sm)] bg-card px-3 py-2 text-[13px] font-medium text-muted shadow-md">
              Destino: {destination.address}
            </div>
          </div>

          <div className="max-h-none space-y-3 overflow-y-auto bg-page p-3 lg:max-h-[680px] lg:p-4">
            <p className="ds-caption px-1 text-muted">
              {filteredLots.length}{" "}
              {filteredLots.length === 1 ? "parqueadero disponible" : "parqueaderos disponibles"}
            </p>
            {filteredLots.map((lot) => {
              const { tone, label } = occupancyTone(lot.available_spots, lot.total_spots);
              const selected = selectedLot === lot.id;
              const sinCupos = lot.available_spots <= 0;
              return (
                <article
                  id={`lot-${lot.id}`}
                  key={lot.id}
                  onClick={() => setSelectedLot(lot.id)}
                  className={`flex cursor-pointer flex-col gap-3 rounded-[var(--radius-lg)] bg-card p-4 transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-md ${
                    selected ? "border border-gray-950 shadow-md" : "border border-subtle shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2
                        className="truncate text-strong"
                        style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-tight)" }}
                      >
                        {lot.name}
                      </h2>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {lot.address} · {distanceLabel(lot.distance_m)}
                      </p>
                    </div>
                    <Badge tone={sinCupos ? "full" : tone} dot>
                      {sinCupos ? "Sin cupos" : label}
                    </Badge>
                  </div>

                  <AvailabilityMeter free={lot.available_spots} total={lot.total_spots} />

                  <div className="flex flex-wrap items-center gap-1.5">
                    {lot.rating !== null && (
                      <Tag>
                        <Star className="mr-1 inline size-3 fill-current align-[-1px]" strokeWidth={2} aria-hidden />
                        {lot.rating.toFixed(1)}
                      </Tag>
                    )}
                    {lot.amenities.slice(0, 3).map((amenity) => (
                      <Tag key={amenity}>{AMENITY_LABELS[amenity] ?? amenity}</Tag>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[20px] font-bold whitespace-nowrap text-strong">
                      {formatCurrency(lot.price_per_hour)}
                      <span className="text-[13px] font-medium text-muted">/h</span>
                    </span>
                    <Link
                      href={`/parqueadero/${lot.id}?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`}
                      className={
                        sinCupos
                          ? `${buttonClass({ variant: "secondary", size: "sm" })} pointer-events-none opacity-45`
                          : buttonClass({ variant: "primary", size: "sm" })
                      }
                    >
                      {sinCupos ? "No disponible" : "Ver y reservar"}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
