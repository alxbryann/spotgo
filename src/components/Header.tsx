import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5">
        <Link href="/" className="flex min-h-11 items-center gap-2 text-xl font-black text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950">
          <span className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-white">
            P
          </span>
          <span>Spot<span className="text-lime-700">Go</span></span>
        </Link>
        <nav aria-label="Navegación principal" className="flex items-center gap-2 text-sm font-bold sm:gap-4">
          <Link href="/buscar" className="hidden min-h-11 items-center text-slate-700 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 sm:flex">
            Buscar parqueadero
          </Link>
          <Link href="/reservas" className="flex min-h-11 items-center rounded-xl border border-slate-300 px-3 text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 sm:px-4">
            Mis reservas
          </Link>
        </nav>
      </div>
    </header>
  );
}
