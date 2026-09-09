"use client";

import { useState } from "react";
import { saveLot, addSpots } from "@/app/actions/company";
import { Button, Field, inputClass } from "@/components/ui";

type Lot = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  price_per_hour: number;
  price_per_day: number | null;
  description: string | null;
  is_24h: boolean;
  opens_at: string | null;
  closes_at: string | null;
};

const FIELDS: { label: string; name: string; hint?: string; mono?: boolean }[] = [
  { label: "Nombre", name: "name" },
  { label: "Dirección", name: "address" },
  { label: "Latitud", name: "lat", mono: true },
  { label: "Longitud", name: "lng", mono: true },
  { label: "Tarifa por hora", name: "price_per_hour", hint: "En pesos colombianos", mono: true },
  { label: "Tarifa diaria", name: "price_per_day", hint: "Opcional", mono: true },
];

export default function LotForm({ lot }: { lot?: Lot }) {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [spotCount, setSpotCount] = useState(10);

  const defaults: Record<string, string> = {
    name: lot?.name ?? "",
    address: lot?.address ?? "",
    lat: String(lot?.lat ?? 4.65),
    lng: String(lot?.lng ?? -74.08),
    price_per_hour: String(lot?.price_per_hour ?? 5000),
    price_per_day: lot?.price_per_day != null ? String(lot.price_per_day) : "",
  };

  async function submit(formData: FormData) {
    const result = await saveLot(Object.fromEntries(formData));
    setIsError(Boolean(result.error));
    setMessage(result.error || "Cambios guardados.");
  }

  return (
    <div className="max-w-3xl space-y-4">
      <form
        action={submit}
        className="space-y-5 rounded-[var(--radius-lg)] border border-subtle bg-card p-6 shadow-sm"
      >
        <input name="id" type="hidden" defaultValue={lot?.id} />
        <input name="is_active" type="hidden" value="true" />

        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <Field key={field.name} label={field.label} hint={field.hint}>
              <input
                name={field.name}
                required={field.name !== "price_per_day"}
                defaultValue={defaults[field.name]}
                className={field.mono ? `font-mono ${inputClass}` : inputClass}
              />
            </Field>
          ))}
        </div>

        <Field label="Descripción">
          <textarea
            name="description"
            rows={3}
            defaultValue={lot?.description || ""}
            className="w-full rounded-[var(--radius-md)] border border-default bg-card p-3.5 text-[15px] text-strong outline-none transition-shadow focus:border-[var(--border-focus)] focus:shadow-[var(--shadow-focus)]"
          />
        </Field>

        <label className="flex items-center gap-2.5 text-[13px] font-bold text-strong">
          <input
            type="checkbox"
            name="is_24h"
            defaultChecked={lot?.is_24h}
            className="size-4 accent-[var(--lime-500)]"
          />
          Abierto 24 horas
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Abre">
            <input
              name="opens_at"
              type="time"
              defaultValue={lot?.opens_at?.slice(0, 5) || "08:00"}
              className={`font-mono ${inputClass}`}
            />
          </Field>
          <Field label="Cierra">
            <input
              name="closes_at"
              type="time"
              defaultValue={lot?.closes_at?.slice(0, 5) || "20:00"}
              className={`font-mono ${inputClass}`}
            />
          </Field>
        </div>

        <Button type="submit" size="lg">
          Guardar parqueadero
        </Button>
      </form>

      {lot && (
        <div className="rounded-[var(--radius-lg)] border border-subtle bg-card p-6 shadow-sm">
          <h2 className="ds-caption text-muted">Plazas</h2>
          <p className="mt-2 text-[15px] text-muted">
            Se crean con códigos correlativos a continuación de las existentes.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Field label="Cuántas añadir">
              <input
                type="number"
                min={1}
                max={500}
                value={spotCount}
                onChange={(event) => setSpotCount(Number(event.target.value))}
                className={`w-32 font-mono ${inputClass}`}
              />
            </Field>
            <Button
              variant="secondary"
              size="lg"
              onClick={async () => {
                if (spotCount < 1) {
                  setIsError(true);
                  setMessage("Indica cuántas plazas añadir.");
                  return;
                }
                const result = await addSpots(lot.id, spotCount);
                setIsError(Boolean(result.error));
                setMessage(result.error || `${spotCount} plazas añadidas.`);
              }}
            >
              Añadir plazas
            </Button>
          </div>
        </div>
      )}

      {message && (
        <p
          role="status"
          className={`rounded-[var(--radius-sm)] px-3 py-2 text-[13px] font-medium ${
            isError ? "bg-red-100 text-red-700" : "bg-spot-free-soft text-green-700"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
