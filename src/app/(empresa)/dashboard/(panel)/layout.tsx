import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";
import { signOut } from "@/app/actions/auth";
import { Wordmark, buttonClass } from "@/components/ui";
import DashboardNav from "@/components/dashboard/DashboardNav";


export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/acceso");

  const companyId = await getCurrentCompanyId(supabase);
  const [{ data: lots }, { data: company }] = await Promise.all([
    companyId
      ? supabase.from("parking_lots").select("id,name").eq("company_id", companyId).order("name")
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    companyId
      ? supabase.from("companies").select("name").eq("id", companyId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const companyName = (company as { name: string } | null)?.name ?? "Tu empresa";
  const lotCount = lots?.length ?? 0;
  const initials = companyName.slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-page">
      {/* Rail sobre tinta: uno de los usos reservados del gray-950 */}
      <aside className="fixed inset-y-0 z-30 hidden w-[var(--sidebar-w)] flex-col gap-6 bg-inverse px-4 py-5 md:flex">
        <div className="flex flex-col gap-2.5 px-3 pt-1">
          <Link href="/dashboard" className="w-fit">
            <Wordmark size={21} onDark />
          </Link>
          <span className="ds-caption text-white/45">Operadores</span>
        </div>

        <DashboardNav />

        <div className="flex items-center gap-2.5 border-t border-[var(--border-inverse)] p-3">
          <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-brand text-[13px] font-bold text-on-brand">
            {initials}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-bold text-white">{companyName}</span>
            <span className="text-[13px] text-white/50">
              {lotCount} {lotCount === 1 ? "parqueadero" : "parqueaderos"}
            </span>
          </span>
        </div>

        <form action={signOut} className="px-3 pb-1">
          <button className="text-[13px] font-bold text-white/60 transition-colors duration-[var(--dur-fast)] hover:text-white">
            Cerrar sesión
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:ml-[var(--sidebar-w)]">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-subtle bg-card px-5 md:px-8">
          <div className="md:hidden">
            <Wordmark size={19} />
          </div>
          <span className="ds-caption hidden text-muted md:block">{companyName}</span>
          <div className="flex-1" />
          <form action={signOut} className="md:hidden">
            <button className="text-[13px] font-bold text-muted">Salir</button>
          </form>
        </header>

        <div className="md:hidden">
          <DashboardNav orientation="horizontal" />
        </div>

        <div className="flex-1 p-5 md:p-8">
          {lotCount ? (
            children
          ) : (
            <div className="rounded-[var(--radius-xl)] border border-subtle bg-card p-8 shadow-sm">
              <h1
                className="ds-display text-strong"
                style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-display)" }}
              >
                Crea tu primer parqueadero
              </h1>
              <p className="mt-2 text-[15px] text-muted">
                Necesitas un parqueadero para empezar a recibir reservas.
              </p>
              <Link
                href="/dashboard/parqueadero"
                className={`${buttonClass({ variant: "primary", size: "lg" })} mt-6`}
              >
                Configurar parqueadero
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
