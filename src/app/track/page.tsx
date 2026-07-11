import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TrackLookup } from "./track-lookup";

export const metadata: Metadata = {
  title: "Track & Trace",
};

export default function TrackPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex-1 bg-[#f5f5f5] py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-red">Track &amp; Trace</p>
          <h1 className="mt-2 text-3xl font-bold text-navy">Where&apos;s my package?</h1>
          <p className="mt-2 text-body">Enter your tracking number to see the latest status.</p>

          <div className="mt-8">
            <Suspense>
              <TrackLookup />
            </Suspense>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
