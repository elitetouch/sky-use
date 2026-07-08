import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { LinkButton } from "@/components/ui/Button";

const NAV_LINKS = [
  { href: "/track", label: "Track & Trace" },
  { href: "/quote", label: "Get Quote" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-navy transition-colors hover:text-red"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LinkButton href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Login
          </LinkButton>
          <LinkButton href="/register" variant="accent" size="sm">
            Book Shipment
          </LinkButton>
        </div>
      </div>
    </header>
  );
}
