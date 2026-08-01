import Link from "next/link";

const SITE = "https://skyfotsglobal.com";

const PRODUCT_LINKS = [
  { label: "Get Quote", href: "/quote", external: false },
  { label: "Track Shipment", href: "/track", external: false },
  { label: "Book Shipment", href: "/login", external: false },
];

const COMPANY_LINKS = [
  { label: "About Us", href: `${SITE}/about` },
  { label: "Services", href: `${SITE}/services` },
  { label: "Contact Us", href: `${SITE}/contact` },
  { label: "Terms of Use", href: `${SITE}/terms` },
  { label: "Privacy Policy", href: `${SITE}/policy` },
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

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-[#00032A] text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/img/logo/logo 4d.jpg"
            alt="SkyFots Global Logistics"
            className="h-14 w-auto"
            width={867}
            height={223}
          />
          <p className="mt-5 max-w-xs text-sm leading-relaxed">Be Globally Connected...</p>
          <ul className="mt-5 flex gap-3">
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-red text-white transition hover:opacity-90"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d={social.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h4 className="text-base font-semibold text-white">Product</h4>
          <ul className="mt-4 space-y-3 text-sm">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h4 className="text-base font-semibold text-white">Company</h4>
          <ul className="mt-4 space-y-3 text-sm">
            {COMPANY_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="hover:text-white">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h4 className="text-base font-semibold text-white">Information</h4>
          <div className="mt-4 flex gap-2 text-sm leading-relaxed">
            <svg viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-red">
              <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
            </svg>
            <p>
              <span className="font-semibold text-white">Lagos Office</span>
              <br />4 Shobogun Rofa Street
              <br />By Aviation Estate,
              <br />Off Airport Rd, Mafoluku
              <br />Oshodi, Lagos
              <br />
              <br />
              <span className="font-semibold text-white">Ibadan Office</span>
              <br />Suite C04 Agbeke KD Plaza Opp. Yidi Praying Ground,
              <br />Agodi-Gate Ibadan
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-5 text-center text-xs sm:px-6">
          <p>
            Copyright{" "}
            <Link href="/" className="font-semibold text-white hover:underline">
              Skyfots Global Logistics
            </Link>{" "}
            &copy;{new Date().getFullYear()} | All Right Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
