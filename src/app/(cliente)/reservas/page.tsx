import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import CancelReservationButton from "@/components/reservations/CancelReservationButton";
import { formatCurrency, formatDateTime, getDefaultRange } from "@/lib/booking";
import type { ReservationWithLot } from "@/lib/database.types";
import { VEHICLE_LABELS } from "@/lib/database.types";
import { type GuestReservationRow, toReservationWithLot } from "@/lib/guest-reservations";
import { readGuestToken } from "@/lib/guest-session";
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
    <article className="rounded-[var(--radius-lg)] border border-subtle bg-card p-5 shadow-xs transition-[transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ds-caption text-muted">{STATUS_LABELS[reservation.status]}</p>
          <h3 className="mt-1.5 text-strong" style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-tight)" }}>{reservation.parking_lots.name}</h3>
          <p className="mt-1 text-[13px] text-muted">{reservation.parking_lots.address}</p>
        </div>
        <p className="font-mono text-[13px] font-bold tracking-wider text-muted">{reservation.confirmation_code}</p>
      </div>
      <div className="mt-4 grid gap-2 border-y border-subtle py-4 text-[13px] sm:grid-cols-2">
        <p><span className="text-muted">Llegada:</span> <strong className="font-mono text-strong">{formatDateTime(reservation.start_time)}</strong></p>
        <p><span className="text-muted">Salida:</span> <strong className="font-mono text-strong">{formatDateTime(reservation.end_time)}</strong></p>
        <p><span className="text-muted">Vehículo:</span> <strong className="font-mono text-strong">{VEHICLE_LABELS[reservation.vehicle_type] ?? reservation.vehicle_type} · {reservation.vehicle_plate}</strong></p>
        <p><span className="text-muted">Total:</span> <strong className="font-mono text-strong">{formatCurrency(reservation.total_price)}</strong></p>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <Link href={`/reserva/${reservation.id}`} className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-inverse px-4 text-[13px] font-bold text-on-inverse shadow-xs transition-[filter,transform] duration-[var(--dur-fast)] hover:brightness-95 active:scale-[var(--press-scale)]">Ver detalle</Link>
        {canCancel && <CancelReservationButton reservationId={reservation.id} />}
      </div>
    </article>
  );
}

export default async function ReservationsPage() {
  const guestToken = await readGuestToken();
  const supabase = await createClient();
  const { data } = guestToken
    ? await supabase.rpc("list_guest_reservations", { p_guest_token: guestToken })
    : { data: [] };
  const reservations = ((data ?? []) as GuestReservationRow[]).map(toReservationWithLot);
  const now = new Date(getDefaultRange().start).getTime();
  const upcoming = reservations
    .filter((reservation) => (reservation.status === "confirmed" && new Date(reservation.end_time).getTime() >= now) || reservation.status === "active")
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const past = reservations.filter((reservation) => !upcoming.some((item) => item.id === reservation.id));

  return (
    <main className="min-h-screen px-5 py-7 md:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="ds-caption text-muted">Tu historial</p>
        <h1 className="ds-display mt-2 text-strong" style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-display)" }}>Mis reservas</h1>
        <p className="mt-2 text-[15px] text-muted">Reservas guardadas de forma privada en este navegador.</p>

        {reservations.length === 0 ? (
          <div className="mt-8 rounded-[var(--radius-xl)] border border-dashed border-default bg-card px-6 py-16 text-center">
            <CalendarCheck className="mx-auto size-8 text-faint" strokeWidth={2} aria-hidden />
            <h2 className="ds-display mt-4 text-strong" style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-display)" }}>Aún no tienes reservas</h2>
            <p className="mt-2 text-[15px] text-muted">Encuentra un parqueadero cerca de tu próximo destino.</p>
            <Link href="/buscar" className="mt-6 inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-brand px-[22px] text-[17px] font-bold text-on-brand shadow-xs transition-[filter,transform] duration-[var(--dur-fast)] hover:brightness-95 active:scale-[var(--press-scale)]">Buscar parqueadero</Link>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            <section>
              <h2 className="ds-display text-strong" style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-display)" }}>Próximas y activas <span className="text-muted">({upcoming.length})</span></h2>
              <div className="mt-4 space-y-4">{upcoming.length > 0 ? upcoming.map((reservation) => <ReservationCard key={reservation.id} reservation={reservation} />) : <p className="rounded-[var(--radius-lg)] border border-subtle bg-card p-5 text-[15px] text-muted">No tienes reservas próximas.</p>}</div>
            </section>
            <section>
              <h2 className="ds-display text-strong" style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-display)" }}>Pasadas y canceladas <span className="text-muted">({past.length})</span></h2>
              <div className="mt-4 space-y-4">{past.map((reservation) => <ReservationCard key={reservation.id} reservation={reservation} />)}</div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
