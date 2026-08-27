"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const query = use(searchParams);
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message === "User already registered" ? "Ya existe una cuenta con este correo." : "No pudimos crear tu cuenta. Revisa los datos e intenta de nuevo.");
        return;
      }
      if (!data.session) {
        setMessage("Cuenta creada. Revisa tu correo para confirmar el registro y luego inicia sesión.");
        setMode("login");
        return;
      }
    } else {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (loginError) {
        setError("Correo o contraseña incorrectos.");
        return;
      }
    }

    const returnTo = query.returnTo?.startsWith("/") && !query.returnTo.startsWith("//") ? query.returnTo : "/";
    router.push(returnTo);
    router.refresh();
  }

  return (
    <main className="grid min-h-[calc(100vh-65px)] bg-neutral-950 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.55),transparent_42%),radial-gradient(circle_at_85%_75%,rgba(14,165,233,0.28),transparent_35%)]" />
        <div className="relative">
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]">Muévete sin vueltas</span>
        </div>
        <div className="relative max-w-xl">
          <p className="text-5xl font-black leading-tight tracking-tight">Tu cupo te espera antes de que llegues.</p>
          <p className="mt-5 max-w-md text-lg text-neutral-300">Reserva parqueadero en Bogotá, guarda tus datos y administra cada trayecto desde un solo lugar.</p>
        </div>
        <p className="relative text-sm text-neutral-500">SpotGo · Parquea más fácil</p>
      </section>

      <section className="flex items-center justify-center bg-neutral-50 px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl shadow-black/10 sm:p-8">
          <Link href="/" className="inline-flex items-center gap-2 font-black text-neutral-900">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white">P</span>
            SpotGo
          </Link>
          <h1 className="mt-8 text-3xl font-black tracking-tight">{mode === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}</h1>
          <p className="mt-2 text-sm text-neutral-500">{mode === "login" ? "Ingresa para reservar y ver tus parqueaderos." : "Solo necesitas un correo y una contraseña."}</p>

          <div className="mt-6 grid grid-cols-2 rounded-xl bg-neutral-100 p-1">
            <button type="button" onClick={() => { setMode("login"); setError(null); }} className={`rounded-lg px-3 py-2 text-sm font-bold transition ${mode === "login" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}>Iniciar sesión</button>
            <button type="button" onClick={() => { setMode("signup"); setError(null); }} className={`rounded-lg px-3 py-2 text-sm font-bold transition ${mode === "signup" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}>Crear cuenta</button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-neutral-700">Correo electrónico
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" autoComplete="email" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="block text-sm font-semibold text-neutral-700">Contraseña
              <input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" autoComplete={mode === "login" ? "current-password" : "new-password"} className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100" />
            </label>
            {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>}
            {message && <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">{message}</p>}
            <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-black text-white transition hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Procesando…" : mode === "login" ? "Iniciar sesión" : "Crear mi cuenta"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
