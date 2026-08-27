import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lng = request.nextUrl.searchParams.get("lng");
  if (!lat || !lng) {
    return NextResponse.json({ label: null });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lng);
  url.searchParams.set("format", "jsonv2");

  const res = await fetch(url, {
    headers: { "User-Agent": "SpotGo/1.0 (parking booking app)" },
  });

  if (!res.ok) {
    return NextResponse.json({ label: null });
  }

  const data = (await res.json()) as { display_name?: string };
  return NextResponse.json({ label: data.display_name ?? null });
}
