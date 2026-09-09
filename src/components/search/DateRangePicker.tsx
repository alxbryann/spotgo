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
    <section className="rounded-[var(--radius-lg)] border border-subtle bg-card p-4 shadow-xs">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="ds-caption text-muted">Tu estadía</p>
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
                className="rounded-[var(--radius-pill)] border border-default px-3.5 py-2 text-[13px] font-bold text-body transition-colors duration-[var(--dur-fast)] hover:bg-sunken hover:text-strong focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-45"
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-[13px] font-bold text-strong">
            Llegada
            <input
              type="datetime-local"
              value={startValue}
              onChange={(event) => setStartValue(event.target.value)}
              className="mt-1.5 block h-11 w-full rounded-[var(--radius-md)] border border-default bg-card px-3.5 font-mono text-[13px] text-strong outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-focus)]"
            />
          </label>
          <label className="text-[13px] font-bold text-strong">
            Salida
            <input
              type="datetime-local"
              value={endValue}
              onChange={(event) => setEndValue(event.target.value)}
              className="mt-1.5 block h-11 w-full rounded-[var(--radius-md)] border border-default bg-card px-3.5 font-mono text-[13px] text-strong outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-focus)]"
            />
          </label>
          <button
            type="button"
            disabled={isPending || !startValue || !endValue}
            onClick={() => updateRange(new Date(startValue), new Date(endValue))}
            className="h-11 rounded-[var(--radius-md)] bg-inverse px-5 text-[13px] font-bold text-on-inverse transition-[filter,transform] duration-[var(--dur-fast)] hover:brightness-95 active:scale-[var(--press-scale)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-45"
          >
            {isPending ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-[13px] font-medium text-red-700">{error}</p>}
    </section>
  );
}
