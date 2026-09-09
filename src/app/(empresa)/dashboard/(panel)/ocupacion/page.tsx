import { getCurrentCompanyId } from "@/lib/company";
import { createClient } from "@/lib/supabase/server";
import Desk from "@/components/dashboard/Desk";
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

  const [{ data: spots }, { data: active }] = await Promise.all([
    supabase
      .from("parking_spots")
      .select("id,code,is_active")
      .eq("parking_lot_id", lot.id)
      .order("code"),
    supabase
      .from("reservations")
      .select("id,vehicle_plate,parking_spot_id")
      .eq("parking_lot_id", lot.id)
      .eq("status", "active"),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={lot.name}
        title="Ocupación y mostrador"
        subtitle="Registra entradas y salidas con el código del ticket."
      />
      <Desk lotId={lot.id} spots={spots || []} active={active || []} />
    </>
  );
}
