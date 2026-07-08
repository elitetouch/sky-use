import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { QuoteCalculator } from "./quote-calculator";

export const metadata: Metadata = {
  title: "Get a Quote",
};

export default function QuotePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex-1 bg-[#f5f5f5] py-16">
        <div className="mx-auto max-w-lg px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-red">Get a Quote</p>
          <h1 className="mt-2 text-3xl font-bold text-navy">How much will it cost?</h1>
          <p className="mt-2 text-body">Enter your package details for an instant estimate.</p>

          <div className="mt-8">
            <QuoteCalculator />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
