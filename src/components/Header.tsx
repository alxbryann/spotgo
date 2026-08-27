import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AuthStatus from "@/components/AuthStatus";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-1.5 text-xl font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            P
          </span>
          Spot<span className="text-blue-600">Go</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/buscar" className="hidden text-neutral-600 hover:text-neutral-900 sm:block">
            Buscar parqueadero
          </Link>
          <Link href="/reservas" className="hidden text-neutral-600 hover:text-neutral-900 sm:block">
            Mis reservas
          </Link>
          <AuthStatus initialEmail={user?.email ?? null} />
        </nav>
      </div>
    </header>
  );
}
