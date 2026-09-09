import Link from "next/link";
import { Check, X } from "lucide-react";
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
    <main className="min-h-screen px-5 py-10 md:px-8">
      <div className="mx-auto max-w-3xl">
        <section className="overflow-hidden rounded-[var(--radius-xl)] border border-subtle bg-card shadow-md">
          <div className={`px-6 py-8 text-center ${reservation.status === "cancelled" ? "bg-inverse-soft" : "bg-inverse"} text-on-inverse`}>
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-white/10">
              {reservation.status === "cancelled" ? (
                <X className="size-6" strokeWidth={2.5} aria-hidden />
              ) : (
                <Check className="size-6 text-lime-400" strokeWidth={2.5} aria-hidden />
              )}
            </div>
            <p className="ds-caption mt-4 text-white/60">
              {reservation.status === "cancelled" ? "Reserva cancelada" : "Reserva confirmada"}
            </p>
            <p className="mt-3 font-mono text-[36px] font-bold tracking-[0.16em] sm:text-[44px]">
              {reservation.confirmation_code}
            </p>
            <p className="mt-3 text-[13px] text-white/60">Presenta este código al llegar</p>
          </div>

          <div className="p-6 sm:p-8">
            <h1 className="ds-display text-strong" style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-display)" }}>{reservation.parking_lots.name}</h1>
            <p className="mt-1.5 text-[15px] text-muted">{reservation.parking_lots.address}</p>

            <div className="mt-6 grid gap-5 rounded-[var(--radius-lg)] bg-page p-5 sm:grid-cols-2">
              <div><p className="ds-caption text-muted">Llegada</p><p className="mt-1.5 font-mono text-[13px] font-bold text-strong">{formatDateTime(reservation.start_time)}</p></div>
              <div><p className="ds-caption text-muted">Salida</p><p className="mt-1.5 font-mono text-[13px] font-bold text-strong">{formatDateTime(reservation.end_time)}</p></div>
              <div><p className="ds-caption text-muted">Vehículo</p><p className="mt-1.5 font-mono text-[13px] font-bold text-strong">{VEHICLE_LABELS[reservation.vehicle_type] ?? reservation.vehicle_type} · <span className="font-mono">{reservation.vehicle_plate}</span></p></div>
              <div><p className="ds-caption text-muted">Total</p><p className="mt-1.5 font-mono text-[20px] font-bold text-strong">{formatCurrency(reservation.total_price)}</p></div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-5 rounded-[var(--radius-lg)] border border-subtle bg-card p-5 sm:flex-row sm:text-left">
              <Image src={qrDataUrl} alt="Código QR de la reserva" width={150} height={150} unoptimized className="size-[150px] rounded-[var(--radius-md)]" />
              <div className="text-center sm:text-left">
                <p className="text-[17px] font-bold text-strong">QR de tu reserva</p>
                <p className="mt-1 text-[13px] leading-[1.55] text-muted">Preséntalo al llegar. Al escanearlo abre el ticket verificable de SpotGo.</p>
                <Link href={ticketPath} className="mt-3 inline-flex h-10 items-center rounded-[var(--radius-md)] bg-brand px-4 text-[13px] font-bold text-on-brand shadow-xs transition-[filter,transform] duration-[var(--dur-fast)] hover:brightness-95 active:scale-[var(--press-scale)]">Ver ticket</Link>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={routePath} className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-inverse px-4 text-[13px] font-bold text-on-inverse shadow-xs transition-[filter,transform] duration-[var(--dur-fast)] hover:brightness-95 active:scale-[var(--press-scale)]">Cómo llegar</Link>
              <Link href="/reservas" className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-default bg-card px-4 text-[13px] font-bold text-strong shadow-xs transition-[filter] duration-[var(--dur-fast)] hover:brightness-95">Ver mis reservas</Link>
              {canCancel && <CancelReservationButton reservationId={reservation.id} />}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
