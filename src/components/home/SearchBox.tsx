"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type GeocodeResult = { label: string; lat: number; lng: number };

export default function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
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
        setSearched(true);
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
    <div id="buscar" className="relative w-full max-w-xl scroll-mt-5">
      <label htmlFor="spotgo-destination" className="sr-only">¿A dónde vas?</label>
      <div className="flex min-h-14 items-center gap-2 rounded-2xl border border-slate-300 bg-white p-1.5 shadow-sm focus-within:border-lime-700 focus-within:ring-2 focus-within:ring-lime-700/20">
        <svg
          className="ml-2 size-5 shrink-0 text-slate-600"
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
          id="spotgo-destination"
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            if (value.trim().length < 3) {
              setSearched(false);
              setResults([]);
            }
          }}
          placeholder="¿A dónde vas?"
          autoComplete="street-address"
          className="min-w-0 flex-1 border-none bg-transparent py-3 text-base font-medium text-slate-950 outline-none placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          aria-label={locating ? "Obteniendo tu ubicación" : "Usar mi ubicación"}
          className="flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 px-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:opacity-50"
        >
          <svg className="size-5 sm:mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="3" strokeWidth="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3" strokeWidth="2" strokeLinecap="round"/></svg>
          <span className="hidden sm:inline">{locating ? "Ubicando…" : "Mi ubicación"}</span>
        </button>
      </div>

      {error && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{error}</p>}

      {query.trim().length >= 3 && (results.length > 0 || loading || searched) && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {loading && <div role="status" className="px-4 py-3 text-sm font-medium text-slate-600">Buscando lugares…</div>}
          {!loading && searched && results.length === 0 && <div role="status" className="px-4 py-4 text-sm text-slate-700">No encontramos ese lugar. Prueba con una dirección más específica.</div>}
          {!loading &&
            results.map((r, i) => (
              <button
                type="button"
                key={i}
                onClick={() => goTo(r)}
                className="block min-h-11 w-full border-b border-slate-100 px-4 py-3 text-left text-sm font-medium text-slate-800 last:border-none hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
              >
                {r.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
