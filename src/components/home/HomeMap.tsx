"use client";

import Link from "next/link";
import Map, { AttributionControl, GeolocateControl, Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE } from "@/lib/map-style";
import { formatCurrency } from "@/lib/booking";

const BOGOTA = { latitude: 4.6533, longitude: -74.0837, zoom: 13.3 };

export type HomeMapLot = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  price_per_hour: number;
};

export default function HomeMap({ lots = [] }: { lots?: HomeMapLot[] }) {
  return (
    <Map
      initialViewState={BOGOTA}
      mapStyle={MAP_STYLE}
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
    >
      <NavigationControl position="bottom-right" showCompass={false} visualizePitch={false} />
      <GeolocateControl
        position="bottom-right"
        positionOptions={{ enableHighAccuracy: true }}
        trackUserLocation
      />
      <AttributionControl position="bottom-right" compact />
      {lots.map((lot) => (
        <Marker key={lot.id} longitude={lot.lng} latitude={lot.lat} anchor="bottom">
          <div className="group relative">
            <Link
              href={`/parqueadero/${lot.id}`}
              className="spotgo-map-pin"
              aria-label={`${lot.name}, ${formatCurrency(lot.price_per_hour)} por hora`}
            >
              {formatCurrency(lot.price_per_hour)}
            </Link>
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2.5 -translate-x-1/2 rounded-[var(--radius-sm)] bg-inverse px-2.5 py-1.5 text-[13px] font-bold whitespace-nowrap text-on-inverse opacity-0 shadow-lg transition-opacity duration-[var(--dur-fast)] group-hover:opacity-100 group-focus-within:opacity-100"
            >
              {lot.name}
            </span>
          </div>
        </Marker>
      ))}
    </Map>
  );
}
