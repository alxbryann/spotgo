export function getDefaultRange() {
  const start = new Date();
  start.setSeconds(0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function parseRange(start?: string, end?: string) {
  const fallback = getDefaultRange();
  const parsedStart = start ? new Date(start) : new Date(fallback.start);
  const parsedEnd = end ? new Date(end) : new Date(fallback.end);

  if (
    Number.isNaN(parsedStart.getTime()) ||
    Number.isNaN(parsedEnd.getTime()) ||
    parsedEnd <= parsedStart
  ) {
    return fallback;
  }

  return { start: parsedStart.toISOString(), end: parsedEnd.toISOString() };
}

export function calculatePrice(
  start: string,
  end: string,
  pricePerHour: number,
  pricePerDay: number | null
) {
  const hours = Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000);
  const hourlyTotal = Math.ceil(hours) * pricePerHour;

  if (hours >= 8 && pricePerDay !== null) {
    return Math.min(hourlyTotal, Math.ceil(hours / 24) * pricePerDay);
  }

  return hourlyTotal;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(value));
}
