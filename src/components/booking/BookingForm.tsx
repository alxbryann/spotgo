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
  isAuthenticated,
}: {
  lot: ParkingLot;
  initialStart: string;
  initialEnd: string;
  availableSpots: number;
  isAuthenticated: boolean;
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
    if (!isAuthenticated) {
      const returnTo = `/parqueadero/${lot.id}?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`;
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
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
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-xl shadow-neutral-900/8 lg:sticky lg:top-24">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Reserva inmediata</p>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <span className="text-3xl font-black text-neutral-900">{formatCurrency(lot.price_per_hour)}</span>
          <span className="text-sm text-neutral-500"> / hora</span>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${availableSpots > 3 ? "bg-emerald-50 text-emerald-700" : availableSpots > 0 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
          {availableSpots > 0 ? `${availableSpots} cupos` : "Sin cupos"}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[1, 2, 4, 12].map((hours) => (
          <button key={hours} type="button" onClick={() => setDuration(hours)} className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-bold text-neutral-700 hover:bg-blue-50 hover:text-blue-700">
            {hours === 12 ? "Todo el día" : `${hours}h`}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-neutral-700">Llegada
          <input type="datetime-local" value={start} onChange={(event) => { setStart(event.target.value); setError(null); }} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 font-normal outline-none focus:border-blue-500" />
        </label>
        <label className="text-sm font-semibold text-neutral-700">Salida
          <input type="datetime-local" value={end} onChange={(event) => { setEnd(event.target.value); setError(null); }} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 font-normal outline-none focus:border-blue-500" />
        </label>
      </div>
      {!rangeMatches && (
        <button type="button" onClick={refreshAvailability} className="mt-3 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100">
          Consultar disponibilidad para este horario
        </button>
      )}

      <label className="mt-4 block text-sm font-semibold text-neutral-700">Tipo de vehículo
        <select value={vehicleType} onChange={(event) => setVehicleType(event.target.value)} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 font-normal outline-none focus:border-blue-500">
          {lot.vehicle_types.map((type) => <option key={type} value={type}>{VEHICLE_LABELS[type] ?? type}</option>)}
        </select>
      </label>
      <label className="mt-4 block text-sm font-semibold text-neutral-700">Placa
        <input value={plate} onChange={(event) => setPlate(event.target.value.toUpperCase())} maxLength={8} placeholder="ABC123" autoComplete="off" className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 font-mono text-lg uppercase tracking-wider outline-none focus:border-blue-500" />
      </label>

      <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
        <span className="text-sm font-medium text-neutral-500">Total estimado</span>
        <span className="text-2xl font-black text-neutral-900">{formatCurrency(price)}</span>
      </div>
      {lot.price_per_day !== null && <p className="mt-1 text-right text-xs text-neutral-500">Tarifa diaria desde {formatCurrency(lot.price_per_day)}</p>}
      {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={isPending || (rangeMatches && availableSpots <= 0)}
        className="mt-4 w-full rounded-xl bg-blue-600 px-5 py-3.5 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {isPending ? "Confirmando…" : !isAuthenticated ? "Ingresar para reservar" : availableSpots <= 0 && rangeMatches ? "Sin disponibilidad" : "Reservar ahora"}
      </button>
      <p className="mt-3 text-center text-xs text-neutral-500">Verificaremos el cupo nuevamente antes de confirmar.</p>
    </div>
  );
}
