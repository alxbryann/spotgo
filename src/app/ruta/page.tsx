import { notFound } from "next/navigation";
import RoutePlanner from "@/components/directions/RoutePlanner";

function coordinate(value: string | string[] | undefined, min: number, max: number) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function text(value: string | string[] | undefined, fallback: string) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.slice(0, 180) || fallback;
}

export default async function RoutePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const lat = coordinate(query.lat, -90, 90);
  const lng = coordinate(query.lng, -180, 180);
  if (lat === null || lng === null) notFound();

  return (
    <RoutePlanner
      destination={{ lat, lng }}
      name={text(query.name, "Parqueadero SpotGo")}
      address={text(query.address, "Bogotá")}
    />
  );
}
