"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { checkin, checkout } from "@/app/actions/company";
import { createClient } from "@/lib/supabase/client";
import { VEHICLE_LABELS } from "@/lib/database.types";
import { AvailabilityMeter, Badge, Button, inputClass } from "@/components/ui";

type Spot = { id: string; code: string; is_active: boolean };
type Active = { id: string; vehicle_plate: string; parking_spot_id: string | null };
type Found = { id: string; vehicle_plate: string; vehicle_type: string; confirmation_code: string };

export default function Desk({
  lotId,
  spots,
  active,
}: {
  lotId: string;
  spots: Spot[];
  active: Active[];
}) {
  const [code, setCode] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const activeSpots = spots.filter((spot) => spot.is_active);
  const occupied = activeSpots.filter((spot) =>
    active.some((item) => item.parking_spot_id === spot.id)
  ).length;

  async function find() {
    setError("");
    setNotice("");
    const { data, error: rpcError } = await createClient().rpc("lookup_reservation_for_desk", {
      p_lot_id: lotId,
      p_code: code,
    });
    const item = data?.[0] as Found | undefined;
    if (rpcError) setError(rpcError.message);
    else if (!item) setError("No encontramos una reserva con ese código.");
    setFound(item ?? null);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <section className="rounded-[var(--radius-lg)] border border-subtle bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <h2 className="ds-caption text-muted">Plazas</h2>
          <div className="flex items-center gap-3 text-[13px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-spot-free" /> Libre
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-spot-reserved" /> Ocupada
            </span>
          </div>
        </div>

        <div className="mt-4">
          <AvailabilityMeter free={activeSpots.length - occupied} total={activeSpots.length} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-8">
          {activeSpots.map((spot) => {
            const item = active.find((entry) => entry.parking_spot_id === spot.id);
            return (
              <div
                key={spot.id}
                className={`flex min-h-[86px] flex-col items-center justify-center gap-0.5 rounded-[var(--radius-sm)] px-2 py-2.5 text-center ${
                  item
                    ? "bg-spot-reserved-soft text-blue-700"
                    : "bg-spot-free-soft text-green-700"
                }`}
              >
                <span className="font-mono text-[13px] font-bold">{spot.code}</span>
                {item && (
                  <>
                    <span className="font-mono text-[11px] opacity-80">{item.vehicle_plate}</span>
                    <button
                      onClick={async () => {
                        const result = await checkout(item.id);
                        setError(result.error || "");
                        if (!result.error) setNotice(`Salida registrada en ${spot.code}.`);
                      }}
                      className="whitespace-nowrap text-[11px] font-bold underline underline-offset-2 transition-opacity hover:opacity-70"
                    >
                      Salida
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <aside className="h-fit rounded-[var(--radius-lg)] border border-subtle bg-card p-5 shadow-xs">
        <h2 className="ds-caption text-muted">Registrar ingreso</h2>

        <label className="mt-4 block text-[13px] font-bold text-strong">
          Código del ticket
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="A1B2C3D4"
            autoComplete="off"
            className={`mt-1.5 font-mono uppercase ${inputClass}`}
          />
        </label>

        <Button onClick={find} variant="inverse" block className="mt-3">
          <Search className="size-4" strokeWidth={2} aria-hidden />
          Buscar reserva
        </Button>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-[var(--radius-sm)] bg-red-100 px-3 py-2 text-[13px] font-medium text-red-700"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mt-3 rounded-[var(--radius-sm)] bg-spot-free-soft px-3 py-2 text-[13px] font-medium text-green-700"
          >
            {notice}
          </p>
        )}

        {found && (
          <Checkin
            reservation={found}
            spots={spots}
            active={active}
            setError={setError}
            setNotice={setNotice}
            setFound={setFound}
          />
        )}
      </aside>
    </div>
  );
}

function Checkin({
  reservation,
  spots,
  active,
  setError,
  setNotice,
  setFound,
}: {
  reservation: Found;
  spots: Spot[];
  active: Active[];
  setError: (value: string) => void;
  setNotice: (value: string) => void;
  setFound: (value: Found | null) => void;
}) {
  const [spot, setSpot] = useState("");
  const free = spots.filter(
    (item) => item.is_active && !active.some((entry) => entry.parking_spot_id === item.id)
  );

  return (
    <div className="mt-5 border-t border-subtle pt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[20px] font-bold uppercase text-strong">
            {reservation.vehicle_plate}
          </p>
          <p className="mt-0.5 text-[13px] text-muted">
            {VEHICLE_LABELS[reservation.vehicle_type] ?? reservation.vehicle_type}
          </p>
        </div>
        <Badge tone="reserved">{reservation.confirmation_code}</Badge>
      </div>

      <label className="mt-4 block text-[13px] font-bold text-strong">
        Plaza asignada
        <select
          value={spot}
          onChange={(event) => setSpot(event.target.value)}
          className={`mt-1.5 ${inputClass}`}
        >
          <option value="">Elige una plaza libre</option>
          {free.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code}
            </option>
          ))}
        </select>
      </label>

      <Button
        block
        className="mt-3"
        onClick={async () => {
          if (!spot) {
            setError("Elige una plaza.");
            return;
          }
          const result = await checkin(reservation.id, spot);
          setError(result.error || "");
          if (!result.error) {
            setNotice("Ingreso registrado.");
            setFound(null);
          }
        }}
      >
        Confirmar ingreso
      </Button>
    </div>
  );
}
