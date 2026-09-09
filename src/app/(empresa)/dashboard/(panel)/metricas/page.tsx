import { getCurrentCompanyId } from "@/lib/company";
import { createClient } from "@/lib/supabase/server";
import Charts from "@/components/dashboard/Charts";
import PageHeader from "@/components/dashboard/PageHeader";

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

  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);

  const [{ data: revenue }, { data: occupancy }] = await Promise.all([
    supabase.rpc("lot_revenue_series", {
      p_lot_id: lot.id,
      p_from: from.toISOString(),
      p_to: to.toISOString(),
    }),
    supabase.rpc("lot_occupancy_by_hour", {
      p_lot_id: lot.id,
      p_from: from.toISOString(),
      p_to: to.toISOString(),
    }),
  ]);

  return (
    <>
      <PageHeader eyebrow={lot.name} title="Métricas" subtitle="Últimos 30 días." />
      <Charts revenue={revenue || []} occupancy={occupancy || []} />
    </>
  );
}
