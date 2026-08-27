"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelReservation } from "@/app/actions/reservations";

export default function CancelReservationButton({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function cancel() {
    if (!window.confirm("¿Quieres cancelar esta reserva?")) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelReservation(reservationId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <button type="button" onClick={cancel} disabled={isPending} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50">
        {isPending ? "Cancelando…" : "Cancelar reserva"}
      </button>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
