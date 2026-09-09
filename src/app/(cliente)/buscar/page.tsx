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
    <main className="min-h-screen bg-neutral-50 px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5">
          <p className="text-sm font-bold text-blue-600">CERCA DE TU DESTINO</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl">Parqueaderos en {address}</h1>
          <p className="mt-2 text-neutral-500">Compara disponibilidad, distancia y precio en tiempo real.</p>
        </div>
        <DateRangePicker start={start} end={end} />
        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
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
