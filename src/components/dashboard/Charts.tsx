"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/booking";

type Revenue = { day: string; revenue: number; reservations: number };
type Occupancy = { hour: number; occupancy: number };

const AXIS = {
  stroke: "var(--gray-400)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
};

const tooltipStyle = {
  background: "var(--surface-inverse)",
  border: "none",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-on-inverse)",
  font: "var(--text-body-sm)",
  padding: "8px 12px",
} as const;

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-subtle bg-card p-5 shadow-xs">
      <h2 className="ds-caption text-muted">{title}</h2>
      <div className="mt-4 h-60">{children}</div>
    </div>
  );
}

export default function Charts({
  revenue,
  occupancy,
}: {
  revenue: Revenue[];
  occupancy: Occupancy[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Ingresos por día">
        {revenue.length === 0 ? (
          <p className="flex h-full items-center justify-center text-[13px] text-muted">
            Sin ingresos registrados en el periodo
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenue} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid stroke="var(--gray-100)" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={AXIS} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={AXIS}
                width={48}
                tickFormatter={(value) => (Number(value) >= 1000 ? `${Math.round(Number(value) / 1000)}k` : String(value))}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "var(--gray-100)" }}
                formatter={(value) => [formatCurrency(Number(value)), "Ingresos"] as [string, string]}
              />
              <Bar dataKey="revenue" fill="var(--lime-500)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Ocupación por hora">
        {occupancy.length === 0 ? (
          <p className="flex h-full items-center justify-center text-[13px] text-muted">
            Sin datos de ocupación en el periodo
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={occupancy} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid stroke="var(--gray-100)" vertical={false} />
              <XAxis
                dataKey="hour"
                tickLine={false}
                axisLine={false}
                tick={AXIS}
                tickFormatter={(hour) => `${String(hour).padStart(2, "0")}:00`}
              />
              <YAxis tickLine={false} axisLine={false} tick={AXIS} width={40} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ stroke: "var(--gray-200)" }}
                labelFormatter={(hour) => `${String(hour).padStart(2, "0")}:00`}
                formatter={(value) => [Number(value).toFixed(1), "Vehículos"] as [string, string]}
              />
              <Line
                type="monotone"
                dataKey="occupancy"
                stroke="var(--blue-500)"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
