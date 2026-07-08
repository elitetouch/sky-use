import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const OFFICES = [
  {
    city: "Lagos Office",
    address: "No 4 Shobogun Rofa Street, By Aviation Estate, Off Airport Road, Mafoluku, Oshodi",
  },
  {
    city: "Ibadan Office",
    address: "Suite C04 Agbeke KD Plaza, Opp. Yidi Praying Ground, Agodi-Gate, Ibadan",
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-navy text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Logo className="brightness-0 invert" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Reliable logistics &amp; transport solutions. Be globally connected across 185+ countries.
          </p>
          <p className="mt-4 text-sm">
            Call or WhatsApp:{" "}
            <a href="tel:+2348026148026" className="font-semibold text-white">
              +234-80-2614-8026
            </a>
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 md:col-span-2">
          {OFFICES.map((office) => (
            <div key={office.city}>
              <p className="font-semibold text-white">{office.city}</p>
              <p className="mt-2 text-sm leading-relaxed">{office.address}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} SkyFots Global Logistics. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/track" className="hover:text-white">
              Track &amp; Trace
            </Link>
            <Link href="/quote" className="hover:text-white">
              Get Quote
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
