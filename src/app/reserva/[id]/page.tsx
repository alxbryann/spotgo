import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import CancelReservationButton from "@/components/reservations/CancelReservationButton";
import { formatCurrency, formatDateTime } from "@/lib/booking";
import { VEHICLE_LABELS } from "@/lib/database.types";
import { type GuestReservationRow, toReservationWithLot } from "@/lib/guest-reservations";
import { readGuestToken } from "@/lib/guest-session";
import { createClient } from "@/lib/supabase/server";

export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guestToken = await readGuestToken();
  if (!guestToken) notFound();

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_guest_reservation", {
    p_id: id,
    p_guest_token: guestToken,
  });
  const row = Array.isArray(data) ? data[0] as GuestReservationRow | undefined : undefined;
  if (!row) notFound();
  const reservation = toReservationWithLot(row);
  const { data: ticketToken } = await supabase.rpc("get_guest_ticket_token", {
    p_id: id,
    p_guest_token: guestToken,
  });
  if (typeof ticketToken !== "string") notFound();
  const canCancel = reservation.status === "confirmed" && new Date(reservation.start_time) > new Date();
  const routeParams = new URLSearchParams({
    lat: String(reservation.parking_lots.lat),
    lng: String(reservation.parking_lots.lng),
    name: reservation.parking_lots.name,
    address: reservation.parking_lots.address,
  });
  const routePath = `/ruta?${routeParams}`;
  const ticketPath = `/ticket/${ticketToken}`;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3001";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const qrDataUrl = await QRCode.toDataURL(`${protocol}://${host}${ticketPath}`, {
    width: 220,
    margin: 1,
    color: { dark: "#020617", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

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

            <div className="mt-6 flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:text-left">
              <Image src={qrDataUrl} alt="Código QR de la reserva" width={150} height={150} unoptimized className="size-[150px] rounded-xl" />
              <div className="text-center sm:text-left">
                <p className="text-lg font-black text-slate-950">QR de tu reserva</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Preséntalo al llegar. Al escanearlo abre el ticket verificable de SpotGo.</p>
                <Link href={ticketPath} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-lime-700 px-4 text-sm font-extrabold text-white hover:bg-lime-800">Ver ticket</Link>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={routePath} className="rounded-xl bg-neutral-900 px-5 py-3 text-center text-sm font-black text-white hover:bg-neutral-700">Cómo llegar</Link>
              <Link href="/reservas" className="rounded-xl border border-neutral-200 px-5 py-3 text-center text-sm font-black text-neutral-700 hover:bg-neutral-50">Ver mis reservas</Link>
              {canCancel && <CancelReservationButton reservationId={reservation.id} />}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
