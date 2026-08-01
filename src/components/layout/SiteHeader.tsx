import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { LinkButton } from "@/components/ui/Button";

const SITE = "https://skyfotsglobal.com";

const NAV_LINKS = [
  { href: "/", label: "Home", external: false },
  { href: `${SITE}/about`, label: "About", external: true },
  { href: `${SITE}/services`, label: "Our Service", external: true },
];

const POLICY_LINKS = [
  { href: `${SITE}/policy`, label: "Privacy Policy" },
  { href: `${SITE}/terms`, label: "Terms of Use" },
];

const SOCIALS = [
  {
    label: "WhatsApp",
    href: "https://wa.me/2348026148026",
    path: "M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.42 1.3-1.95 1.35-.5.05-.99.24-3.34-.7-2.82-1.11-4.62-3.98-4.76-4.17-.14-.19-1.14-1.52-1.14-2.9 0-1.38.72-2.06.98-2.34.24-.26.53-.33.7-.33.18 0 .35 0 .5.01.16.01.38-.06.59.45.24.58.82 2 .89 2.14.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.69-.8.87-1.08.18-.28.36-.23.6-.14.24.09 1.55.73 1.81.86.26.14.44.21.5.32.07.11.07.64-.17 1.32Z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/skyfotsglobal/",
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 3.68A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84Zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8Zm6.4-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z",
  },
  {
    label: "Facebook",
    href: "https://web.facebook.com/skyfotsglobal",
    path: "M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.53-1.5H16.7V3.6c-.28-.04-1.25-.12-2.38-.12-2.36 0-3.98 1.44-3.98 4.08v2.28H7.63V13h2.71v8h3.16Z",
  },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40">
      {/* Top bar */}
      <div className="bg-[#00032A] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 text-xs sm:px-6">
          <div className="flex items-center gap-5">
            <a href="tel:+2348026148026" className="flex items-center gap-1.5 font-semibold">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-red">
                <path d="M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.3 21 3 13.7 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1l-2.2 2.2Z" />
              </svg>
              +(234)80-2614-8026
            </a>
            <a href="mailto:info@skyfotsglobal.com" className="hidden items-center gap-1.5 font-semibold sm:flex">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-red">
                <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm8 7 8-5H4l8 5Zm0 2L4 8v10h16V8l-8 5Z" />
              </svg>
              info@skyfotsglobal.com
            </a>
          </div>

          <div className="hidden items-center gap-5 lg:flex">
            <span className="font-semibold">Mon – Fri: 9:00am – 5:00pm</span>
            <span className="font-semibold">Sat: 10:00am – 2:00pm</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Follow Us On:</span>
              <ul className="flex items-center gap-2">
                {SOCIALS.map((social) => (
                  <li key={social.label}>
                    <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-red transition hover:text-white">
                        <path d={social.path} />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo />

          <nav className="hidden items-center gap-7 xl:flex">
            {NAV_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-bold text-navy transition-colors hover:text-red"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-bold text-navy transition-colors hover:text-red"
                >
                  {link.label}
                </Link>
              ),
            )}

            <div className="group relative">
              <button className="flex items-center gap-1 text-sm font-bold text-navy transition-colors group-hover:text-red">
                Policy
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M7 10l5 5 5-5H7Z" />
                </svg>
              </button>
              <div className="absolute left-0 top-full hidden min-w-44 pt-3 group-hover:block">
                <div className="overflow-hidden rounded-lg border border-black/5 bg-white py-1 shadow-lg">
                  {POLICY_LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-2 text-sm font-semibold text-navy hover:bg-[#f5f5f5] hover:text-red"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <a
              href={`${SITE}/contact`}
              className="text-sm font-bold text-navy transition-colors hover:text-red"
            >
              Contact Us
            </a>
            <Link href="/track" className="text-sm font-bold text-navy transition-colors hover:text-red">
              Track &amp; Trace
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <LinkButton href="/quote" variant="accent" size="sm" className="hidden sm:inline-flex">
              Get Quote
            </LinkButton>
            <LinkButton href="/login" variant="accent" size="sm" className="hidden md:inline-flex">
              Book Shipment
            </LinkButton>
            <LinkButton href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Login
            </LinkButton>
            <LinkButton href="/register" variant="accent" size="sm">
              Signup
            </LinkButton>
          </div>
        </div>
      </div>
    </header>
  );
}
