import Link from "next/link";
import { getCurrentCompanyId } from "@/lib/company";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/booking";
import { AvailabilityMeter, StatTile, buttonClass } from "@/components/ui";
import PageHeader from "@/components/dashboard/PageHeader";

type Summary = { occupied: number; pending: number; revenue: number; cancelled: number };

export default async function Page() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId(supabase);
  const { data: lots } = companyId
    ? await supabase
        .from("parking_lots")
        .select("id,name,total_spots")
        .eq("company_id", companyId)
        .order("name")
        .limit(1)
    : { data: [] };

  const lot = lots?.[0];
  if (!lot) return null;

  const { data: summary } = await supabase.rpc("lot_dashboard_summary", { p_lot_id: lot.id });
  const k = (summary?.[0] ?? {}) as Partial<Summary>;
  const occupied = k.occupied ?? 0;
  const free = Math.max(0, lot.total_spots - occupied);

  return (
    <>
      <PageHeader eyebrow={lot.name} title="El turno de hoy" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Ocupadas" value={occupied} caption={`de ${lot.total_spots} plazas`} />
        <StatTile label="Llegadas pendientes" value={k.pending ?? 0} caption="Confirmadas para hoy" />
        <StatTile label="Ingresos" value={formatCurrency(k.revenue ?? 0)} caption="Entradas de hoy" />
        <StatTile label="Cancelaciones" value={k.cancelled ?? 0} caption="En el día" />
      </div>

      <div className="mt-4 rounded-[var(--radius-lg)] border border-subtle bg-card p-5 shadow-xs">
        <p className="ds-caption mb-3 text-muted">Ocupación ahora</p>
        <AvailabilityMeter free={free} total={lot.total_spots} />
      </div>

      <Link
        href="/dashboard/ocupacion"
        className={`${buttonClass({ variant: "primary", size: "lg" })} mt-7`}
      >
        Abrir mostrador de ingresos
      </Link>
    </>
  );
}
