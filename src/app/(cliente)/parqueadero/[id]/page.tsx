import { notFound } from "next/navigation";
import { Check, MapPin, SquareParking, Star } from "lucide-react";
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
  const [{ data: lotData }, { data: spotsData }] = await Promise.all([
    supabase.from("parking_lots").select("*").eq("id", id).eq("is_active", true).single(),
    supabase.rpc("get_available_spots", { p_lot_id: id, p_start: start, p_end: end }),
  ]);
  const lot = lotData as ParkingLot | null;
  if (!lot) notFound();

  const schedule = lot.is_24h
    ? "Abierto 24 horas"
    : `${lot.opens_at?.slice(0, 5) ?? "—"}–${lot.closes_at?.slice(0, 5) ?? "—"}`;

  return (
    <main className="min-h-screen px-5 py-7 md:px-8">
      <div className="mx-auto max-w-[var(--max-content)]">
        <div className="mb-6">
          <p className="ds-caption text-muted">Parqueadero verificado</p>
          <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1
                className="ds-display text-strong"
                style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-display)" }}
              >
                {lot.name}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-[15px] text-muted">
                <MapPin className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                {lot.address}
              </p>
            </div>
            {lot.rating !== null && (
              <span className="flex w-fit items-center gap-1.5 font-mono text-[20px] font-bold text-strong">
                <Star className="size-4 fill-current" strokeWidth={2} aria-hidden />
                {lot.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-5">
            {/* Placeholder declarado: aún no hay fotos reales de los parqueaderos. */}
            <div className="flex min-h-64 flex-col justify-end rounded-[var(--radius-xl)] border border-subtle bg-sunken p-6">
              <div className="flex items-center gap-2 text-faint">
                <SquareParking className="size-5" strokeWidth={2} aria-hidden />
                <span className="ds-caption">Foto pendiente de definir con el equipo</span>
              </div>
              <p className="mt-5 text-[17px] leading-[1.55] text-body">
                {lot.description || "Reserva tu cupo con anticipación y llega sin dar vueltas."}
              </p>
            </div>

            <section className="rounded-[var(--radius-lg)] border border-subtle bg-card p-6 shadow-sm">
              <h2
                className="ds-display text-strong"
                style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-display)" }}
              >
                Lo que ofrece este lugar
              </h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {lot.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2.5 rounded-[var(--radius-md)] bg-page px-4 py-3 text-[15px] font-medium text-body"
                  >
                    <Check className="size-4 shrink-0 text-spot-free" strokeWidth={2.5} aria-hidden />
                    {AMENITY_LABELS[amenity] ?? amenity}
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[var(--radius-lg)] border border-subtle bg-card p-5 shadow-xs">
                <p className="ds-caption text-muted">Horario</p>
                <p className="mt-2.5 font-mono text-[20px] font-bold text-strong">{schedule}</p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-subtle bg-card p-5 shadow-xs">
                <p className="ds-caption text-muted">Vehículos admitidos</p>
                <p className="mt-2.5 text-[17px] font-bold text-strong">
                  {lot.vehicle_types.map((type) => VEHICLE_LABELS[type] ?? type).join(" · ")}
                </p>
              </div>
            </section>
          </div>

          <BookingForm
            lot={lot}
            initialStart={start}
            initialEnd={end}
            availableSpots={getAvailableSpots(spotsData)}
          />
        </div>
      </div>
    </main>
  );
}
