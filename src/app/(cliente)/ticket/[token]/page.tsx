import Link from "next/link";
import { Check, X } from "lucide-react";
import { notFound } from "next/navigation";
import { formatDateTime } from "@/lib/booking";
import { VEHICLE_LABELS } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type TicketRow = {
  confirmation_code: string;
  status: "confirmed" | "active" | "completed" | "cancelled";
  start_time: string;
  end_time: string;
  vehicle_plate: string;
  vehicle_type: string;
  lot_name: string;
  lot_address: string;
};

const STATUS_LABELS: Record<TicketRow["status"], string> = {
  confirmed: "Reserva confirmada",
  active: "Reserva activa",
  completed: "Reserva completada",
  cancelled: "Reserva cancelada",
};

export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_reservation_ticket", { p_ticket_token: token });
  const ticket = Array.isArray(data) ? data[0] as TicketRow | undefined : undefined;
  if (!ticket) notFound();
  const cancelled = ticket.status === "cancelled";

  return (
    <main className="grid min-h-[calc(100dvh-64px)] place-items-center px-5 py-8">
      <section className="w-full max-w-md overflow-hidden rounded-[var(--radius-xl)] border border-subtle bg-card shadow-md">
        <div className={`px-6 py-8 text-center text-on-inverse ${cancelled ? "bg-inverse-soft" : "bg-inverse"}`}>
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-white/10">{cancelled ? <X className="size-6" strokeWidth={2.5} aria-hidden /> : <Check className="size-6 text-lime-400" strokeWidth={2.5} aria-hidden />}</div>
          <p className="ds-caption mt-4 text-white/60">{STATUS_LABELS[ticket.status]}</p>
          <p className="mt-3 font-mono text-[36px] font-bold tracking-[0.16em]">{ticket.confirmation_code}</p>
        </div>

        <div className="p-6">
          <p className="ds-caption text-muted">Parqueadero</p>
          <h1 className="ds-display mt-1.5 text-strong" style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-display)" }}>{ticket.lot_name}</h1>
          <p className="mt-1.5 text-[15px] text-muted">{ticket.lot_address}</p>

          <dl className="mt-6 grid gap-5 rounded-[var(--radius-lg)] bg-page p-5 sm:grid-cols-2">
            <div><dt className="ds-caption text-muted">Llegada</dt><dd className="mt-1.5 font-mono text-[13px] font-bold text-strong">{formatDateTime(ticket.start_time)}</dd></div>
            <div><dt className="ds-caption text-muted">Salida</dt><dd className="mt-1.5 font-mono text-[13px] font-bold text-strong">{formatDateTime(ticket.end_time)}</dd></div>
            <div className="sm:col-span-2"><dt className="ds-caption text-muted">Vehículo</dt><dd className="mt-1.5 font-mono text-[13px] font-bold text-strong">{VEHICLE_LABELS[ticket.vehicle_type] ?? ticket.vehicle_type} · <span className="font-mono">{ticket.vehicle_plate}</span></dd></div>
          </dl>

          <p className="mt-6 text-center text-[13px] text-muted">Este ticket fue emitido por SpotGo.</p>
          <Link href="/" className="mt-4 flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-default bg-card text-[15px] font-bold text-strong shadow-xs transition-[filter] duration-[var(--dur-fast)] hover:brightness-95">Ir a SpotGo</Link>
        </div>
      </section>
    </main>
  );
}
