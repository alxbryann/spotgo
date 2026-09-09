"use client";

import { useRouter } from "next/navigation";
import { Search, LocateFixed } from "lucide-react";
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
      <div className="flex min-h-14 items-center gap-2 rounded-[var(--radius-md)] border border-default bg-card p-1.5 shadow-xs focus-within:border-[var(--border-focus)] focus-within:shadow-[var(--shadow-focus)]">
        <Search className="ml-2 size-4 shrink-0 text-muted" strokeWidth={2} aria-hidden />
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
          className="min-w-0 flex-1 border-none bg-transparent py-3 text-[15px] font-medium text-strong outline-none placeholder:text-faint"
        />
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          aria-label={locating ? "Obteniendo tu ubicación" : "Usar mi ubicación"}
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-inverse px-3.5 text-[13px] font-bold text-on-inverse transition-[filter,transform] duration-[var(--dur-fast)] hover:brightness-95 active:scale-[var(--press-scale)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-45"
        >
          <LocateFixed className="size-4" strokeWidth={2} aria-hidden />
          <span className="hidden sm:inline">{locating ? "Ubicando…" : "Mi ubicación"}</span>
        </button>
      </div>

      {error && <p role="alert" className="mt-2 text-[13px] font-medium text-red-700">{error}</p>}

      {query.trim().length >= 3 && (results.length > 0 || loading || searched) && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[var(--radius-lg)] border border-subtle bg-card shadow-lg">
          {loading && <div role="status" className="px-4 py-3 text-[13px] font-medium text-muted">Buscando lugares…</div>}
          {!loading && searched && results.length === 0 && <div role="status" className="px-4 py-4 text-[13px] text-body">No encontramos ese lugar. Prueba con una dirección más específica.</div>}
          {!loading &&
            results.map((r, i) => (
              <button
                type="button"
                key={i}
                onClick={() => goTo(r)}
                className="block min-h-11 w-full border-b border-subtle px-4 py-3 text-left text-[15px] font-medium text-body transition-colors duration-[var(--dur-fast)] last:border-none hover:bg-page focus-visible:bg-page focus-visible:outline-none"
              >
                {r.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
