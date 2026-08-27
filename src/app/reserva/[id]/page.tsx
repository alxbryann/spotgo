import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CancelReservationButton from "@/components/reservations/CancelReservationButton";
import { formatCurrency, formatDateTime } from "@/lib/booking";
import type { ReservationWithLot } from "@/lib/database.types";
import { VEHICLE_LABELS } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?returnTo=${encodeURIComponent(`/reserva/${id}`)}`);

  const { data } = await supabase
    .from("reservations")
    .select("*, parking_lots(id,name,address,lat,lng,image_url)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  const reservation = data as ReservationWithLot | null;
  if (!reservation) notFound();
  const canCancel = reservation.status === "confirmed" && new Date(reservation.start_time) > new Date();

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/8">
          <div className={`px-6 py-8 text-center text-white ${reservation.status === "cancelled" ? "bg-neutral-700" : "bg-gradient-to-br from-blue-700 to-sky-500"}`}>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/20 text-2xl backdrop-blur">{reservation.status === "cancelled" ? "×" : "✓"}</div>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em]">{reservation.status === "cancelled" ? "Reserva cancelada" : "Reserva confirmada"}</p>
            <p className="mt-3 font-mono text-4xl font-black tracking-[0.16em] sm:text-5xl">{reservation.confirmation_code}</p>
            <p className="mt-3 text-sm text-blue-50">Presenta este código al llegar</p>
          </div>

          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-black text-neutral-900">{reservation.parking_lots.name}</h1>
            <p className="mt-1 text-neutral-500">{reservation.parking_lots.address}</p>

            <div className="mt-6 grid gap-4 rounded-2xl bg-neutral-50 p-5 sm:grid-cols-2">
              <div><p className="text-xs font-bold uppercase tracking-wider text-neutral-600">Llegada</p><p className="mt-1 font-bold text-neutral-900">{formatDateTime(reservation.start_time)}</p></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-neutral-600">Salida</p><p className="mt-1 font-bold text-neutral-900">{formatDateTime(reservation.end_time)}</p></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-neutral-600">Vehículo</p><p className="mt-1 font-bold text-neutral-900">{VEHICLE_LABELS[reservation.vehicle_type] ?? reservation.vehicle_type} · <span className="font-mono">{reservation.vehicle_plate}</span></p></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-neutral-600">Total</p><p className="mt-1 text-xl font-black text-neutral-900">{formatCurrency(reservation.total_price)}</p></div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${reservation.parking_lots.lat},${reservation.parking_lots.lng}`} target="_blank" rel="noreferrer" className="rounded-xl bg-neutral-900 px-5 py-3 text-center text-sm font-black text-white hover:bg-neutral-700">Cómo llegar ↗</a>
              <Link href="/reservas" className="rounded-xl border border-neutral-200 px-5 py-3 text-center text-sm font-black text-neutral-700 hover:bg-neutral-50">Ver mis reservas</Link>
              {canCancel && <CancelReservationButton reservationId={reservation.id} />}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
