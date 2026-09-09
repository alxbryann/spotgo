import { getCurrentCompanyId } from "@/lib/company";
import { createClient } from "@/lib/supabase/server";
import LotForm from "@/components/dashboard/LotForm";
import PageHeader from "@/components/dashboard/PageHeader";

export default async function Page() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId(supabase);
  const { data: lots } = companyId
    ? await supabase
        .from("parking_lots")
        .select("*")
        .eq("company_id", companyId)
        .order("name")
        .limit(1)
    : { data: [] };

  return (
    <>
      <PageHeader
        eyebrow="Configuración"
        title="Tu parqueadero"
        subtitle="Actualiza la información que ven los conductores."
      />
      <LotForm lot={lots?.[0]} />
    </>
  );
}
