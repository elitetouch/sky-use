import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LinkButton } from "@/components/ui/Button";

const SERVICES = [
  {
    title: "Local & International Shipping",
    description: "Book door-to-door delivery within Nigeria or across 185+ countries.",
  },
  {
    title: "Real-Time Tracking",
    description: "Follow every shipment from pickup to delivery with live status updates.",
  },
  {
    title: "Trusted Courier Network",
    description: "Fulfilled through vetted global couriers for fast, reliable delivery.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-navy text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:items-center md:py-28">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-yellow">
                Be Globally Connected
              </p>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
                We deliver your packages with <span className="text-red">unmatched speed</span> and
                efficiency.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-white/80">
                Reliable logistics &amp; transport solutions for individuals and businesses — book a
                shipment or track a package in seconds.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <LinkButton href="/register" variant="accent" size="lg">
                  Book a Shipment
                </LinkButton>
                <LinkButton
                  href="/track"
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-navy"
                >
                  Track a Package
                </LinkButton>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-red">What we offer</p>
            <h2 className="mt-2 text-3xl font-bold text-navy">
              Delivering the full range of logistics solutions
            </h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {SERVICES.map((service) => (
              <div key={service.title} className="rounded-2xl border border-black/5 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-navy">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-body">{service.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#f5f5f5]">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-navy">Get an instant quote</h2>
            <p className="max-w-xl text-body">
              Tell us about your package and destination — we&apos;ll calculate a price in seconds.
            </p>
            <LinkButton href="/quote" variant="primary" size="lg">
              Get Your Quote
            </LinkButton>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
