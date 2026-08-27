"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const QUICK_RANGES = [
  { label: "1 hora", hours: 1 },
  { label: "2 horas", hours: 2 },
  { label: "4 horas", hours: 4 },
  { label: "Todo el día", hours: 12 },
];

function toLocalInput(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function DateRangePicker({ start, end }: { start: string; end: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [startValue, setStartValue] = useState(toLocalInput(start));
  const [endValue, setEndValue] = useState(toLocalInput(end));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateRange(nextStart: Date, nextEnd: Date) {
    if (nextEnd <= nextStart) {
      setError("La salida debe ser posterior a la llegada.");
      return;
    }

    setError(null);
    setStartValue(toLocalInput(nextStart.toISOString()));
    setEndValue(toLocalInput(nextEnd.toISOString()));
    const params = new URLSearchParams(searchParams.toString());
    params.set("start", nextStart.toISOString());
    params.set("end", nextEnd.toISOString());
    startTransition(() => router.push(`/buscar?${params.toString()}`, { scroll: false }));
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Tu estadía</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_RANGES.map((range) => (
              <button
                key={range.hours}
                type="button"
                disabled={isPending}
                onClick={() => {
                  const nextStart = new Date();
                  nextStart.setSeconds(0, 0);
                  updateRange(nextStart, new Date(nextStart.getTime() + range.hours * 3_600_000));
                }}
                className="rounded-full border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-sm font-medium text-neutral-700">
            Llegada
            <input
              type="datetime-local"
              value={startValue}
              onChange={(event) => setStartValue(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-medium text-neutral-700">
            Salida
            <input
              type="datetime-local"
              value={endValue}
              onChange={(event) => setEndValue(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <button
            type="button"
            disabled={isPending || !startValue || !endValue}
            onClick={() => updateRange(new Date(startValue), new Date(endValue))}
            className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-600 disabled:opacity-50"
          >
            {isPending ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
    </section>
  );
}
