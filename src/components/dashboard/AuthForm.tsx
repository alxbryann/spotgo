"use client";

import { useState } from "react";
import { signIn, signUp } from "@/app/actions/auth";
import { Button, inputClass } from "@/components/ui";

export default function AuthForm({ register = false }: { register?: boolean }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setError("");
    setPending(true);
    const result = register
      ? await signUp({
          name: String(formData.get("name")),
          nit: String(formData.get("nit")),
          phone: String(formData.get("phone")),
          email: String(formData.get("email")),
          password: String(formData.get("password")),
        })
      : await signIn({
          email: String(formData.get("email")),
          password: String(formData.get("password")),
        });
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form
      action={submit}
      className="space-y-4 rounded-[var(--radius-lg)] border border-subtle bg-card p-6 shadow-sm"
    >
      {register && (
        <>
          <label className="block text-[13px] font-bold text-strong">
            Empresa
            <input name="name" required className={`mt-1.5 ${inputClass}`} />
          </label>
          <label className="block text-[13px] font-bold text-strong">
            NIT
            <input name="nit" className={`mt-1.5 font-mono ${inputClass}`} />
          </label>
          <label className="block text-[13px] font-bold text-strong">
            Teléfono
            <input name="phone" className={`mt-1.5 font-mono ${inputClass}`} />
          </label>
        </>
      )}
      <label className="block text-[13px] font-bold text-strong">
        Correo
        <input name="email" type="email" required className={`mt-1.5 ${inputClass}`} />
      </label>
      <label className="block text-[13px] font-bold text-strong">
        Contraseña
        <input
          name="password"
          type="password"
          minLength={8}
          required
          className={`mt-1.5 ${inputClass}`}
        />
        <span className="mt-1.5 block text-[13px] font-medium text-muted">Mínimo 8 caracteres</span>
      </label>

      {error && (
        <p role="alert" className="rounded-[var(--radius-sm)] bg-red-100 px-3 py-2 text-[13px] font-medium text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? "Un momento…" : register ? "Crear empresa" : "Entrar al panel"}
      </Button>
    </form>
  );
}
