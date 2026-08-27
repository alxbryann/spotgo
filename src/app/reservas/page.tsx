import Link from "next/link";
import { redirect } from "next/navigation";
import CancelReservationButton from "@/components/reservations/CancelReservationButton";
import { formatCurrency, formatDateTime, getDefaultRange } from "@/lib/booking";
import type { ReservationWithLot } from "@/lib/database.types";
import { VEHICLE_LABELS } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS = {
  confirmed: "Confirmada",
  active: "Activa",
  completed: "Completada",
  cancelled: "Cancelada",
};

function ReservationCard({ reservation }: { reservation: ReservationWithLot }) {
  const canCancel = reservation.status === "confirmed" && new Date(reservation.start_time) > new Date();
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-600">{STATUS_LABELS[reservation.status]}</p>
          <h3 className="mt-1 text-lg font-black text-neutral-900">{reservation.parking_lots.name}</h3>
          <p className="mt-1 text-sm text-neutral-500">{reservation.parking_lots.address}</p>
        </div>
        <p className="font-mono text-sm font-black tracking-wider text-neutral-500">{reservation.confirmation_code}</p>
      </div>
      <div className="mt-4 grid gap-2 border-y border-neutral-100 py-4 text-sm sm:grid-cols-2">
        <p><span className="text-neutral-600">Llegada:</span> <strong className="text-neutral-900">{formatDateTime(reservation.start_time)}</strong></p>
        <p><span className="text-neutral-600">Salida:</span> <strong className="text-neutral-900">{formatDateTime(reservation.end_time)}</strong></p>
        <p><span className="text-neutral-600">Vehículo:</span> <strong className="text-neutral-900">{VEHICLE_LABELS[reservation.vehicle_type] ?? reservation.vehicle_type} · {reservation.vehicle_plate}</strong></p>
        <p><span className="text-neutral-600">Total:</span> <strong className="text-neutral-900">{formatCurrency(reservation.total_price)}</strong></p>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <Link href={`/reserva/${reservation.id}`} className="rounded-xl bg-neutral-900 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-neutral-700">Ver detalle</Link>
        {canCancel && <CancelReservationButton reservationId={reservation.id} />}
      </div>
    </article>
  );
}

export default async function ReservationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?returnTo=${encodeURIComponent("/reservas")}`);

  const { data } = await supabase
    .from("reservations")
    .select("*, parking_lots(id,name,address,lat,lng,image_url)")
    .eq("user_id", user.id)
    .order("start_time", { ascending: false });
  const reservations = (data ?? []) as ReservationWithLot[];
  const now = new Date(getDefaultRange().start).getTime();
  const upcoming = reservations
    .filter((reservation) => (reservation.status === "confirmed" && new Date(reservation.end_time).getTime() >= now) || reservation.status === "active")
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const past = reservations.filter((reservation) => !upcoming.some((item) => item.id === reservation.id));

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-black text-blue-600">TU HISTORIAL</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-neutral-900">Mis reservas</h1>
        <p className="mt-2 text-neutral-500">Todo lo que necesitas para tus próximas llegadas.</p>

        {reservations.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
            <span className="text-4xl">🚙</span>
            <h2 className="mt-4 text-xl font-black">Aún no tienes reservas</h2>
            <p className="mt-2 text-neutral-500">Encuentra un parqueadero cerca de tu próximo destino.</p>
            <Link href="/buscar" className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700">Buscar parqueadero</Link>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            <section>
              <h2 className="text-xl font-black">Próximas / Activas <span className="text-neutral-500">({upcoming.length})</span></h2>
              <div className="mt-4 space-y-4">{upcoming.length > 0 ? upcoming.map((reservation) => <ReservationCard key={reservation.id} reservation={reservation} />) : <p className="rounded-2xl bg-white p-5 text-neutral-500">No tienes reservas próximas.</p>}</div>
            </section>
            <section>
              <h2 className="text-xl font-black">Pasadas / Canceladas <span className="text-neutral-500">({past.length})</span></h2>
              <div className="mt-4 space-y-4">{past.map((reservation) => <ReservationCard key={reservation.id} reservation={reservation} />)}</div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
