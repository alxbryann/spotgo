import SearchBox from "@/components/home/SearchBox";
import HomeMap, { type HomeMapLot } from "@/components/home/HomeMap";
import { createClient } from "@/lib/supabase/server";
import type { ParkingLot } from "@/lib/database.types";
import { Badge, buttonClass } from "@/components/ui";
import { formatCurrency } from "@/lib/booking";
import Link from "next/link";

type HomeLot = Pick<ParkingLot, "id" | "name" | "lat" | "lng" | "price_per_hour" | "rating">;

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parking_lots")
    .select("id,name,lat,lng,price_per_hour,rating")
    .eq("is_active", true)
    .limit(30);
  const lots = (data ?? []) as HomeLot[];
  const featuredLot = lots[0];

  return (
    <div className="relative flex min-h-[calc(100dvh-64px)] flex-1 overflow-hidden bg-sunken">
      <div className="absolute inset-0">
        <HomeMap lots={lots as HomeMapLot[]} />
      </div>

      <section className="pointer-events-none relative z-10 flex w-full flex-col p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 lg:w-[480px] lg:p-0">
        <div className="pointer-events-auto rounded-[var(--radius-xl)] border border-subtle bg-card p-5 shadow-lg sm:p-6 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:rounded-none lg:border-y-0 lg:border-l-0 lg:p-10">
          <div>
            <p className="ds-caption text-muted">
              {lots.length} parqueaderos activos en Bogotá
            </p>
            <h1
              className="ds-display mt-3 max-w-md text-balance text-strong"
              style={{ font: "var(--text-display-2)", letterSpacing: "var(--tracking-display)" }}
            >
              Parquea cerca. Llega tranquilo.
            </h1>
            <p className="mt-3 hidden max-w-sm text-pretty text-[17px] leading-[1.55] text-muted sm:block">
              Compara cupos, distancia y precio antes de salir.
            </p>
          </div>

          <div className="mt-6 lg:mt-8">
            <SearchBox />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-subtle pt-5 lg:mt-8">
            <div>
              <p className="ds-caption text-muted">Disponibilidad en vivo</p>
              <p className="mt-1.5 text-[15px] font-bold text-strong">
                Cupos actualizados al momento
              </p>
            </div>
            <Badge tone="free" dot>
              Activo
            </Badge>
          </div>
        </div>

        {featuredLot && (
          <article className="pointer-events-auto mt-auto rounded-[var(--radius-lg)] border border-subtle bg-card p-4 shadow-lg lg:absolute lg:bottom-6 lg:left-[504px] lg:w-[380px]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2
                  className="truncate text-strong"
                  style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-tight)" }}
                >
                  {featuredLot.name}
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">Más cercano a tu vista</p>
              </div>
              {featuredLot.rating && (
                <span className="shrink-0 font-mono text-[13px] font-bold text-strong">
                  {featuredLot.rating.toFixed(1)}
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="font-mono text-[20px] font-bold text-strong">
                {formatCurrency(featuredLot.price_per_hour)}
                <span className="text-[13px] font-medium text-muted">/h</span>
              </span>
              <Link
                href={`/parqueadero/${featuredLot.id}`}
                className={buttonClass({ variant: "primary", size: "md" })}
              >
                Ver parqueadero
              </Link>
            </div>
          </article>
        )}
      </section>
    </div>
  );
}
