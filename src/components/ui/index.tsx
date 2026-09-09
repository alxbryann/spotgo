/**
 * Primitivos del SpotGo Design System.
 * Portados de ~/Desktop/SpotGo Design System/components/ a TSX.
 * Todo el estilo sale de los tokens en globals.css — sin valores sueltos.
 */
import type { ReactNode } from "react";

/* ---------------------------------------------------------------- Wordmark */

/** Marca tipográfica. No hay archivo de logo para SpotGo; la marca es tipo. */
export function Wordmark({ size = 22, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <span
      className="ds-display inline-flex items-baseline gap-px font-extrabold"
      style={{ fontSize: size, color: onDark ? "var(--text-on-inverse)" : "var(--text-strong)" }}
    >
      spot
      <span style={{ color: onDark ? "var(--lime-400)" : "var(--lime-600)" }}>go</span>
      <span
        className="ml-0.5 rounded-full"
        style={{ width: size * 0.16, height: size * 0.16, background: "var(--lime-500)" }}
      />
    </span>
  );
}

/* ------------------------------------------------------------------ Button */

type ButtonVariant = "primary" | "inverse" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 gap-1.5 text-[13px] rounded-[var(--radius-sm)]",
  md: "h-10 px-4 gap-2 text-[15px] rounded-[var(--radius-md)]",
  lg: "h-12 px-[22px] gap-2.5 text-[17px] rounded-[var(--radius-md)]",
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-on-brand border border-transparent shadow-xs",
  inverse: "bg-inverse text-on-inverse border border-transparent shadow-xs",
  secondary: "bg-card text-strong border border-default shadow-xs",
  ghost: "bg-transparent text-body border border-transparent",
  danger: "bg-red-500 text-white border border-transparent shadow-xs",
};

const buttonBase =
  "inline-flex items-center justify-center font-bold tracking-[var(--tracking-tight)] " +
  "transition-[transform,filter,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)] " +
  "hover:brightness-95 active:scale-[var(--press-scale)] " +
  "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] " +
  "disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100";

export function buttonClass({
  variant = "primary",
  size = "md",
  block = false,
}: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean } = {}) {
  return [buttonBase, buttonSizes[size], buttonVariants[variant], block ? "flex w-full" : ""]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  className = "",
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${buttonClass({ variant, size, block })} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------- Card */

export function Card({
  className = "",
  children,
  interactive = false,
  selected = false,
}: {
  className?: string;
  children: ReactNode;
  interactive?: boolean;
  selected?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[var(--radius-lg)] bg-card p-5 shadow-sm",
        selected ? "border border-gray-950" : "border border-subtle",
        interactive
          ? "cursor-pointer transition-[transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-md"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------- Badge */

export type BadgeTone = "neutral" | "brand" | "free" | "filling" | "full" | "reserved" | "inverse";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-sunken text-body",
  brand: "bg-lime-200 text-gray-950",
  free: "bg-spot-free-soft text-green-700",
  filling: "bg-spot-filling-soft text-amber-700",
  full: "bg-spot-full-soft text-red-700",
  reserved: "bg-spot-reserved-soft text-blue-700",
  inverse: "bg-inverse text-on-inverse",
};

export function Badge({
  tone = "neutral",
  dot = false,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`ds-caption inline-flex h-6 shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 ${badgeTones[tone]}`}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* --------------------------------------------------------------------- Tag */

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="ds-caption rounded-[var(--radius-pill)] bg-sunken px-2.5 py-1 text-muted">
      {children}
    </span>
  );
}

/* ------------------------------------------------------- AvailabilityMeter */

/**
 * Umbrales de dominio, no decorativos: <75% libre, 75–94% llenándose, >=95% lleno.
 * Todo componente que muestre ocupación usa estos umbrales.
 */
export function occupancyTone(free: number, total: number) {
  const pct = total > 0 ? Math.min(100, Math.round(((total - free) / total) * 100)) : 0;
  if (pct >= 95) return { pct, tone: "full" as const, label: "Lleno", color: "var(--spot-full)" };
  if (pct >= 75)
    return { pct, tone: "filling" as const, label: "Llenándose", color: "var(--spot-filling)" };
  return { pct, tone: "free" as const, label: "Disponible", color: "var(--spot-free)" };
}

export function AvailabilityMeter({
  free,
  total,
  showLabel = true,
  height = 8,
}: {
  free: number;
  total: number;
  showLabel?: boolean;
  height?: number;
}) {
  const { pct, color } = occupancyTone(free, total);
  return (
    <div className="flex w-full flex-col gap-1.5">
      {showLabel && (
        <div className="flex justify-between text-[13px]">
          <span className="font-bold text-strong">{free} libres</span>
          <span className="text-muted">{pct}% ocupado</span>
        </div>
      )}
      <div
        className="overflow-hidden rounded-full bg-sunken"
        style={{ height }}
        role="img"
        aria-label={`${pct}% ocupado, ${free} plazas libres de ${total}`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-out)]"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- StatTile */

export function StatTile({
  label,
  value,
  unit,
  caption,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  caption?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-subtle bg-card p-5 shadow-xs">
      <span className="ds-caption text-muted">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span
          className="ds-display text-strong"
          style={{ font: "var(--text-display-2)", letterSpacing: "var(--tracking-display)" }}
        >
          {value}
        </span>
        {unit && <span className="text-[15px] text-muted">{unit}</span>}
      </div>
      {caption && <span className="text-[13px] text-faint">{caption}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------- Input */

export const inputClass =
  "h-11 w-full rounded-[var(--radius-md)] border border-default bg-card px-3.5 text-[15px] " +
  "text-strong placeholder:text-faint transition-shadow duration-[var(--dur-fast)] " +
  "focus:border-[var(--border-focus)] focus:outline-none focus:shadow-[var(--shadow-focus)]";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-bold text-strong">{label}</span>
      {children}
      {hint && <span className="text-[13px] text-muted">{hint}</span>}
    </label>
  );
}
