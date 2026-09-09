import { getCurrentCompanyId } from "@/lib/company";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/booking";
import { VEHICLE_LABELS, type ReservationStatus } from "@/lib/database.types";
import { Badge, type BadgeTone } from "@/components/ui";
import PageHeader from "@/components/dashboard/PageHeader";

const STATUS: Record<ReservationStatus, { label: string; tone: BadgeTone }> = {
  confirmed: { label: "Confirmada", tone: "reserved" },
  active: { label: "En curso", tone: "brand" },
  completed: { label: "Completada", tone: "free" },
  cancelled: { label: "Cancelada", tone: "full" },
};

const COLUMNS = ["Vehículo", "Código", "Entrada", "Estado", "Valor"];

export default async function Page() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId(supabase);
  const { data: lots } = companyId
    ? await supabase
        .from("parking_lots")
        .select("id,name")
        .eq("company_id", companyId)
        .order("name")
        .limit(1)
    : { data: [] };

  const lot = lots?.[0];
  if (!lot) return null;

  const { data: rows } = await supabase
    .from("reservations")
    .select("id,vehicle_plate,vehicle_type,status,start_time,end_time,total_price,confirmation_code")
    .eq("parking_lot_id", lot.id)
    .order("start_time", { ascending: false })
    .limit(100);

  return (
    <>
      <PageHeader
        eyebrow={lot.name}
        title="Reservas"
        subtitle="Las 100 más recientes, de la más próxima a la más antigua."
      />

      {!rows?.length ? (
        <div className="rounded-[var(--radius-xl)] border border-dashed border-default bg-card px-6 py-16 text-center">
          <p className="text-[15px] text-muted">Todavía no hay reservas en este parqueadero.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-subtle bg-card shadow-xs">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-subtle">
                {COLUMNS.map((column) => (
                  <th key={column} className="ds-caption px-5 py-3.5 text-muted">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = STATUS[r.status as ReservationStatus];
                return (
                  <tr
                    key={r.id}
                    className="border-b border-subtle last:border-0 transition-colors duration-[var(--dur-fast)] hover:bg-page"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-[13px] font-bold uppercase text-strong">
                        {r.vehicle_plate}
                      </span>
                      <span className="block text-[13px] text-muted">
                        {VEHICLE_LABELS[r.vehicle_type] ?? r.vehicle_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-[13px] text-body">
                      {r.confirmation_code}
                    </td>
                    <td className="px-5 py-4 font-mono text-[13px] text-body">
                      {formatDateTime(r.start_time)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={status?.tone ?? "neutral"}>{status?.label ?? r.status}</Badge>
                    </td>
                    <td className="px-5 py-4 font-mono text-[13px] font-bold text-strong">
                      {formatCurrency(r.total_price)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
