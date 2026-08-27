import { notFound } from "next/navigation";
import BookingForm from "@/components/booking/BookingForm";
import { parseRange } from "@/lib/booking";
import type { ParkingLot } from "@/lib/database.types";
import { AMENITY_LABELS, VEHICLE_LABELS } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

function getAvailableSpots(data: unknown) {
  if (typeof data === "number") return data;
  if (Array.isArray(data) && data.length > 0) {
    const value = data[0];
    return typeof value === "number" ? value : Number(Object.values(value)[0]);
  }
  return data && typeof data === "object" ? Number(Object.values(data)[0]) : 0;
}

export default async function ParkingLotPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { start, end } = parseRange(query.start, query.end);
  const supabase = await createClient();
  const [{ data: lotData }, { data: spotsData }, { data: authData }] = await Promise.all([
    supabase.from("parking_lots").select("*").eq("id", id).eq("is_active", true).single(),
    supabase.rpc("get_available_spots", { p_lot_id: id, p_start: start, p_end: end }),
    supabase.auth.getUser(),
  ]);
  const lot = lotData as ParkingLot | null;
  if (!lot) notFound();

  const schedule = lot.is_24h
    ? "Abierto 24 horas"
    : `${lot.opens_at?.slice(0, 5) ?? "—"} a ${lot.closes_at?.slice(0, 5) ?? "—"}`;

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">PARQUEADERO VERIFICADO</p>
          <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-neutral-900 sm:text-4xl">{lot.name}</h1>
              <p className="mt-2 text-neutral-500">📍 {lot.address}</p>
            </div>
            {lot.rating !== null && <div className="w-fit rounded-xl bg-amber-50 px-4 py-2 font-black text-amber-700">★ {lot.rating.toFixed(1)}</div>}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-5">
            <div className="relative min-h-64 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-700 to-sky-400 p-8 text-white shadow-lg">
              <div className="absolute -right-12 -top-16 text-[220px] font-black leading-none text-white/10">P</div>
              <div className="relative flex h-full max-w-xl flex-col justify-end">
                <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">{schedule}</span>
                <p className="mt-6 text-xl font-bold">Un lugar seguro cerca de tu destino.</p>
                <p className="mt-2 text-sm text-blue-100">{lot.description || "Reserva tu cupo con anticipación y llega sin dar vueltas."}</p>
              </div>
            </div>

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Lo que ofrece este lugar</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {lot.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-blue-700">✓</span>
                    {AMENITY_LABELS[amenity] ?? amenity}
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-neutral-500">Horario</p>
                <p className="mt-2 text-lg font-black">{schedule}</p>
              </div>
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-neutral-500">Vehículos admitidos</p>
                <p className="mt-2 text-lg font-black">{lot.vehicle_types.map((type) => VEHICLE_LABELS[type] ?? type).join(" · ")}</p>
              </div>
            </section>
          </div>

          <BookingForm
            lot={lot}
            initialStart={start}
            initialEnd={end}
            availableSpots={getAvailableSpots(spotsData)}
            isAuthenticated={Boolean(authData.user)}
          />
        </div>
      </div>
    </main>
  );
}
