"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type GeocodeResult = { label: string; lat: number; lng: number };

export default function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function goTo(place: GeocodeResult) {
    router.push(
      `/buscar?lat=${place.lat}&lng=${place.lng}&address=${encodeURIComponent(place.label)}`
    );
  }

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        router.push(
          `/buscar?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&address=${encodeURIComponent(
            "Mi ubicación actual"
          )}`
        );
      },
      () => {
        setLocating(false);
        setError("No pudimos obtener tu ubicación. Intenta escribir la dirección.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg shadow-neutral-900/5">
        <svg
          className="ml-2 h-5 w-5 shrink-0 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="¿A dónde vas? Escribe una dirección o lugar..."
          className="min-w-0 flex-1 border-none py-3 text-base outline-none placeholder:text-neutral-400"
        />
        <button
          onClick={useMyLocation}
          disabled={locating}
          className="shrink-0 rounded-xl bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-50"
        >
          {locating ? "Ubicando…" : "Mi ubicación"}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {query.trim().length >= 3 && (results.length > 0 || loading) && (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
          {loading && <div className="px-4 py-3 text-sm text-neutral-500">Buscando…</div>}
          {!loading &&
            results.map((r, i) => (
              <button
                key={i}
                onClick={() => goTo(r)}
                className="block w-full border-b border-neutral-100 px-4 py-3 text-left text-sm last:border-none hover:bg-neutral-50"
              >
                {r.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
