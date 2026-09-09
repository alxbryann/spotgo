import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function getCurrentCompanyId(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("company_members")
    .select("company_id")
    .limit(1)
    .maybeSingle();

  return data?.company_id ?? null;
}
