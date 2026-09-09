import Link from "next/link";
import AuthForm from "@/components/dashboard/AuthForm";
import { Wordmark } from "@/components/ui";

export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-5">
      <Wordmark size={24} />
      <p className="ds-caption mt-5 text-muted">SpotGo empresas</p>
      <h1
        className="ds-display mt-2 text-strong"
        style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-display)" }}
      >
        Empieza a operar
      </h1>
      <p className="mb-6 mt-2 text-[15px] text-muted">
        Crea tu cuenta y registra el primer parqueadero.
      </p>
      <AuthForm register />
      <p className="mt-5 text-center text-[13px]">
        <Link className="font-bold text-link hover:underline" href="/dashboard/acceso">
          Ya tengo una cuenta
        </Link>
      </p>
    </main>
  );
}
