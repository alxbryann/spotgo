import type { NextRequest } from "next/server";

function coordinate(value: string | null, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const fromLat = coordinate(query.get("fromLat"), -90, 90);
  const fromLng = coordinate(query.get("fromLng"), -180, 180);
  const toLat = coordinate(query.get("toLat"), -90, 90);
  const toLng = coordinate(query.get("toLng"), -180, 180);

  if (fromLat === null || fromLng === null || toLat === null || toLng === null) {
    return Response.json({ error: "Coordenadas inválidas." }, { status: 400 });
  }

  const endpoint = new URL(
    `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}`
  );
  endpoint.searchParams.set("overview", "full");
  endpoint.searchParams.set("geometries", "geojson");
  endpoint.searchParams.set("steps", "true");

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: { "User-Agent": "SpotGo/1.0" },
    });
    const data = await response.json();
    if (!response.ok || data.code !== "Ok" || !data.routes?.[0]) {
      return Response.json({ error: "No encontramos una ruta disponible." }, { status: 502 });
    }
    return Response.json(data.routes[0], {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch {
    return Response.json({ error: "El servicio de rutas no respondió." }, { status: 502 });
  }
}
