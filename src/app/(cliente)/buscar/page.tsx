import DateRangePicker from "@/components/search/DateRangePicker";
import SearchResults from "@/components/search/SearchResults";
import { parseRange } from "@/lib/booking";
import type { NearbyLot } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

const BOGOTA = { lat: 4.711, lng: -74.0721, address: "Bogotá" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const lat = Number(first(query.lat)) || BOGOTA.lat;
  const lng = Number(first(query.lng)) || BOGOTA.lng;
  const address = first(query.address) || BOGOTA.address;
  const { start, end } = parseRange(first(query.start), first(query.end));
  const supabase = await createClient();

  const RADII_M = [5000, 20000, 20_000_000];
  let lots: NearbyLot[] = [];
  let error: { message: string } | null = null;
  let usedRadius = RADII_M[0];
  for (const radius of RADII_M) {
    const res = await supabase.rpc("search_nearby_lots", {
      p_lat: lat,
      p_lng: lng,
      p_radius_m: radius,
      p_start: start,
      p_end: end,
    });
    if (res.error) {
      error = res.error;
      break;
    }
    lots = (res.data ?? []) as NearbyLot[];
    usedRadius = radius;
    if (lots.length > 0) break;
  }
  const isExpanded = lots.length > 0 && usedRadius > RADII_M[0];

  return (
    <main className="min-h-screen px-5 py-7 md:px-8">
      <div className="mx-auto max-w-[var(--max-content)]">
        <div className="mb-5">
          <p className="ds-caption text-muted">Cerca de tu destino</p>
          <h1
            className="ds-display mt-2 text-strong"
            style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-display)" }}
          >
            Parqueaderos en {address}
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            Compara disponibilidad, distancia y precio en vivo.
          </p>
        </div>
        <DateRangePicker start={start} end={end} />
        {error ? (
          <div className="mt-5 rounded-[var(--radius-lg)] border border-red-500/30 bg-red-100 p-5 text-[15px] font-medium text-red-700">
            No pudimos cargar los parqueaderos. Intenta de nuevo en unos minutos.
          </div>
        ) : (
          <SearchResults
            lots={lots}
            destination={{ lat, lng, address }}
            start={start}
            end={end}
            isExpanded={isExpanded}
          />
        )}
      </div>
    </main>
  );
}
