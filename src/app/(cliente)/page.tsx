import SearchBox from "@/components/home/SearchBox";
import HomeMap, { type HomeMapLot } from "@/components/home/HomeMap";
import { createClient } from "@/lib/supabase/server";
import type { ParkingLot } from "@/lib/database.types";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parking_lots")
    .select("id,name,lat,lng,price_per_hour,rating")
    .eq("is_active", true)
    .limit(30);
  const lots = (data ?? []) as Pick<ParkingLot, "id" | "name" | "lat" | "lng" | "price_per_hour" | "rating">[];
  const featuredLot = lots[0];

  return (
    <div className="relative flex min-h-[calc(100dvh-65px)] flex-1 overflow-hidden bg-slate-200">
      <div className="absolute inset-0"><HomeMap lots={lots as HomeMapLot[]} /></div>

      <section className="pointer-events-none relative z-10 flex w-full flex-col p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:p-5 lg:w-[480px] lg:p-0">
        <div className="pointer-events-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-lg sm:p-5 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:rounded-none lg:border-y-0 lg:border-l-0 lg:p-10">
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase text-lime-700">{lots.length} parqueaderos activos en Bogotá</p>
            <h1 className="max-w-md text-balance text-3xl font-black leading-tight text-slate-950 lg:text-5xl">
              Parquea cerca. Llega tranquilo.
            </h1>
            <p className="mt-3 hidden max-w-sm text-pretty text-base leading-6 text-slate-600 sm:block">
              Compara cupos, distancia y precio antes de salir.
            </p>
          </div>

          <div className="mt-4 lg:mt-8">
            <SearchBox />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 lg:mt-8">
            <div>
              <p className="text-xs font-bold uppercase text-slate-600">Disponibilidad en vivo</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">Actualizada desde Supabase</p>
            </div>
            <span className="flex items-center gap-2 rounded-full bg-lime-100 px-3 py-2 text-xs font-extrabold text-lime-900">
              <span className="size-2 rounded-full bg-lime-700" aria-hidden="true" /> Activo
            </span>
          </div>
        </div>

        {featuredLot && (
          <article className="pointer-events-auto mt-auto rounded-3xl border border-slate-200 bg-white p-3 shadow-lg lg:absolute lg:bottom-6 lg:left-[504px] lg:w-[380px]">
            <div className="flex items-center gap-3">
              <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-slate-950 text-2xl font-black text-white" aria-hidden="true">P</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="truncate text-base font-extrabold text-slate-950">{featuredLot.name}</h2>
                  {featuredLot.rating && <span className="shrink-0 text-sm font-bold text-amber-700">★ {featuredLot.rating}</span>}
                </div>
                <p className="mt-1 text-sm font-medium text-slate-600">Desde <span className="tabular-nums font-extrabold text-slate-950">${featuredLot.price_per_hour.toLocaleString("es-CO")}</span> / hora</p>
                <p className="mt-1 text-xs font-semibold text-lime-800">Disponible ahora</p>
              </div>
            </div>
            <Link href={`/parqueadero/${featuredLot.id}`} className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-extrabold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950">
              Ver parqueadero
            </Link>
          </article>
        )}
      </section>
    </div>
  );
}
