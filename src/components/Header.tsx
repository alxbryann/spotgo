import Link from "next/link";
import { Wordmark, buttonClass } from "@/components/ui";

const links = [
  { href: "/buscar", label: "Buscar" },
  { href: "/reservas", label: "Mis reservas" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-6 border-b border-subtle bg-card px-5 md:px-8">
      <Link
        href="/"
        className="flex items-center rounded-[var(--radius-sm)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
      >
        <Wordmark size={22} />
      </Link>
      <nav aria-label="Navegación principal" className="flex items-center gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-[var(--radius-pill)] px-3.5 py-2 text-[15px] font-bold text-muted transition-colors duration-[var(--dur-fast)] hover:bg-sunken hover:text-strong focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] sm:px-4"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1" />
      <Link href="/dashboard" className={`${buttonClass({ variant: "secondary", size: "sm" })} hidden sm:inline-flex`}>
        Soy un parqueadero
      </Link>
    </header>
  );
}
