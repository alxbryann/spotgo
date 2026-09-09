"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createReservation } from "@/app/actions/reservations";
import { calculatePrice, formatCurrency } from "@/lib/booking";
import type { ParkingLot } from "@/lib/database.types";
import { VEHICLE_LABELS } from "@/lib/database.types";

function toLocalInput(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function isWithinOpeningHours(lot: ParkingLot, start: Date, end: Date) {
  if (lot.is_24h || !lot.opens_at || !lot.closes_at) return true;
  const opening = minutes(lot.opens_at);
  const closing = minutes(lot.closes_at);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  if (opening <= closing) return startMinutes >= opening && endMinutes <= closing;
  return startMinutes >= opening || endMinutes <= closing;
}

function isInThePast(value: string) {
  return new Date(value).getTime() < Date.now() - 60_000;
}

export default function BookingForm({
  lot,
  initialStart,
  initialEnd,
  availableSpots,
}: {
  lot: ParkingLot;
  initialStart: string;
  initialEnd: string;
  availableSpots: number;
}) {
  const router = useRouter();
  const [start, setStart] = useState(toLocalInput(initialStart));
  const [end, setEnd] = useState(toLocalInput(initialEnd));
  const [vehicleType, setVehicleType] = useState(lot.vehicle_types[0] ?? "car");
  const [plate, setPlate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const startIso = start ? new Date(start).toISOString() : "";
  const endIso = end ? new Date(end).toISOString() : "";
  const rangeMatches = startIso === initialStart && endIso === initialEnd;

  const validationError = useMemo(() => {
    if (!start || !end) return "Selecciona la llegada y la salida.";
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate <= startDate) return "La salida debe ser posterior a la llegada.";
    if (!isWithinOpeningHours(lot, startDate, endDate)) return "El horario elegido está fuera del horario de atención.";
    if (!/^[A-Z0-9-]{5,8}$/i.test(plate.trim())) return "Ingresa una placa válida de 5 a 8 caracteres.";
    return null;
  }, [end, lot, plate, start]);

  const price = startIso && endIso
    ? calculatePrice(startIso, endIso, lot.price_per_hour, lot.price_per_day)
    : 0;

  function setDuration(hours: number) {
    const nextStart = new Date(start);
    const nextEnd = new Date(nextStart.getTime() + hours * 3_600_000);
    setEnd(toLocalInput(nextEnd.toISOString()));
    setError(null);
  }

  function refreshAvailability() {
    if (!startIso || !endIso || new Date(endIso) <= new Date(startIso)) return;
    router.replace(
      `/parqueadero/${lot.id}?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`,
      { scroll: false }
    );
  }

  function submit() {
    if (validationError) {
      setError(validationError);
      return;
    }
    if (isInThePast(start)) {
      setError("La llegada no puede estar en el pasado.");
      return;
    }
    if (!rangeMatches) {
      setError("Actualiza la disponibilidad antes de reservar.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createReservation({
        parkingLotId: lot.id,
        vehiclePlate: plate,
        vehicleType,
        startTime: startIso,
        endTime: endIso,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-subtle bg-card p-5 shadow-md lg:sticky lg:top-24">
      <p className="ds-caption text-muted">Reserva inmediata</p>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <span className="font-mono text-[28px] font-bold text-strong">{formatCurrency(lot.price_per_hour)}</span>
          <span className="text-[13px] text-muted">/h</span>
        </div>
        <span className={`ds-caption inline-flex h-6 items-center rounded-[var(--radius-pill)] px-2.5 ${availableSpots > 3 ? "bg-spot-free-soft text-green-700" : availableSpots > 0 ? "bg-spot-filling-soft text-amber-700" : "bg-spot-full-soft text-red-700"}`}>
          {availableSpots > 0 ? `${availableSpots} cupos` : "Sin cupos"}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[1, 2, 4, 12].map((hours) => (
          <button key={hours} type="button" onClick={() => setDuration(hours)} className="rounded-[var(--radius-pill)] bg-sunken px-3.5 py-1.5 text-[13px] font-bold text-body transition-colors duration-[var(--dur-fast)] hover:bg-gray-200 hover:text-strong">
            {hours === 12 ? "Todo el día" : `${hours}h`}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-[13px] font-bold text-strong">Llegada
          <input type="datetime-local" value={start} onChange={(event) => { setStart(event.target.value); setError(null); }} className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-default bg-card px-3.5 font-mono text-[13px] font-normal text-strong outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-focus)]" />
        </label>
        <label className="text-[13px] font-bold text-strong">Salida
          <input type="datetime-local" value={end} onChange={(event) => { setEnd(event.target.value); setError(null); }} className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-default bg-card px-3.5 font-mono text-[13px] font-normal text-strong outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-focus)]" />
        </label>
      </div>
      {!rangeMatches && (
        <button type="button" onClick={refreshAvailability} className="mt-3 h-10 w-full rounded-[var(--radius-md)] border border-blue-200 bg-blue-100 text-[13px] font-bold text-blue-700 transition-[filter] duration-[var(--dur-fast)] hover:brightness-95">
          Consultar disponibilidad para este horario
        </button>
      )}

      <label className="mt-4 block text-[13px] font-bold text-strong">Tipo de vehículo
        <select value={vehicleType} onChange={(event) => setVehicleType(event.target.value)} className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-default bg-card px-3.5 font-mono text-[13px] font-normal text-strong outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-focus)]">
          {lot.vehicle_types.map((type) => <option key={type} value={type}>{VEHICLE_LABELS[type] ?? type}</option>)}
        </select>
      </label>
      <label className="mt-4 block text-[13px] font-bold text-strong">Placa
        <input value={plate} onChange={(event) => setPlate(event.target.value.toUpperCase())} maxLength={8} placeholder="ABC123" autoComplete="off" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-default bg-card px-3.5 font-mono text-[17px] font-bold uppercase tracking-wider text-strong outline-none focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-focus)]" />
      </label>

      <div className="mt-5 flex items-center justify-between border-t border-subtle pt-4">
        <span className="ds-caption text-muted">Total estimado</span>
        <span className="font-mono text-[20px] font-bold text-strong">{formatCurrency(price)}</span>
      </div>
      {lot.price_per_day !== null && <p className="mt-1 text-right text-[13px] text-muted">Tarifa diaria desde {formatCurrency(lot.price_per_day)}</p>}
      {error && <p className="mt-3 rounded-[var(--radius-sm)] bg-red-100 px-3 py-2 text-[13px] font-medium text-red-700">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={isPending || (rangeMatches && availableSpots <= 0)}
        className="mt-4 flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-brand text-[17px] font-bold tracking-[var(--tracking-tight)] text-on-brand shadow-xs transition-[filter,transform] duration-[var(--dur-fast)] hover:brightness-95 active:scale-[var(--press-scale)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-brand)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:brightness-100"
      >
        {isPending ? "Confirmando…" : availableSpots <= 0 && rangeMatches ? "Sin disponibilidad" : "Reservar ahora"}
      </button>
      <p className="mt-3 text-center text-[13px] text-muted">Sin registro. Guardaremos esta reserva en este navegador.</p>
    </div>
  );
}
