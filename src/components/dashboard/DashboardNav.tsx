"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarCheck, SquareParking, Gauge, Settings } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Resumen", Icon: LayoutDashboard },
  { href: "/dashboard/reservas", label: "Reservas", Icon: CalendarCheck },
  { href: "/dashboard/ocupacion", label: "Ocupación", Icon: SquareParking },
  { href: "/dashboard/metricas", label: "Métricas", Icon: Gauge },
  { href: "/dashboard/parqueadero", label: "Parqueadero", Icon: Settings },
];

export default function DashboardNav({
  orientation = "vertical",
}: {
  orientation?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();

  if (orientation === "horizontal") {
    return (
      <nav className="flex gap-1 overflow-x-auto border-b border-subtle bg-card px-5 py-2">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] px-3.5 py-2 text-[13px] font-bold transition-colors duration-[var(--dur-fast)] ${
                active ? "bg-sunken text-strong" : "text-muted hover:text-strong"
              }`}
            >
              <Icon className="size-4" strokeWidth={2} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-1 flex-col gap-0.5">
      {NAV.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-[15px] font-bold tracking-[var(--tracking-tight)] transition-colors duration-[var(--dur-fast)] ${
              active ? "bg-white/10 text-lime-400" : "text-white/65 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="size-[18px] shrink-0" strokeWidth={2} aria-hidden />
            <span className="flex-1">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
