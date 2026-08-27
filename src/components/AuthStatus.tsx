"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthStatus({ initialEmail }: { initialEmail: string | null }) {
  const router = useRouter();

  if (!initialEmail) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-neutral-900 px-4 py-1.5 text-white hover:bg-neutral-700"
      >
        Ingresar
      </Link>
    );
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-neutral-500 md:inline">{initialEmail}</span>
      <button
        onClick={signOut}
        className="rounded-full border border-neutral-300 px-4 py-1.5 hover:bg-neutral-100"
      >
        Salir
      </button>
    </div>
  );
}
