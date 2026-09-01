import Link from "next/link";
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
    <main className="grid min-h-[calc(100dvh-65px)] place-items-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className={`px-6 py-8 text-center text-white ${cancelled ? "bg-slate-700" : "bg-lime-700"}`}>
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-white text-2xl font-black text-slate-950">{cancelled ? "×" : "✓"}</div>
          <p className="mt-4 text-sm font-extrabold uppercase">{STATUS_LABELS[ticket.status]}</p>
          <p className="mt-3 font-mono text-4xl font-black">{ticket.confirmation_code}</p>
        </div>

        <div className="p-6">
          <p className="text-xs font-extrabold uppercase text-slate-600">Parqueadero</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">{ticket.lot_name}</h1>
          <p className="mt-1 text-sm text-slate-600">{ticket.lot_address}</p>

          <dl className="mt-6 grid gap-4 rounded-2xl bg-slate-100 p-4 sm:grid-cols-2">
            <div><dt className="text-xs font-bold uppercase text-slate-600">Llegada</dt><dd className="mt-1 font-bold text-slate-950">{formatDateTime(ticket.start_time)}</dd></div>
            <div><dt className="text-xs font-bold uppercase text-slate-600">Salida</dt><dd className="mt-1 font-bold text-slate-950">{formatDateTime(ticket.end_time)}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs font-bold uppercase text-slate-600">Vehículo</dt><dd className="mt-1 font-bold text-slate-950">{VEHICLE_LABELS[ticket.vehicle_type] ?? ticket.vehicle_type} · <span className="font-mono">{ticket.vehicle_plate}</span></dd></div>
          </dl>

          <p className="mt-5 text-center text-sm font-semibold text-slate-700">Este ticket fue emitido por SpotGo.</p>
          <Link href="/" className="mt-4 flex min-h-11 items-center justify-center rounded-xl border border-slate-300 font-bold text-slate-800 hover:bg-slate-100">Ir a SpotGo</Link>
        </div>
      </section>
    </main>
  );
}
