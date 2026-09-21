import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackLookup } from "@/app/track/track-lookup";

export const metadata: Metadata = {
  title: "Track Shipment",
};

export default function DashboardTrackPage() {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-red">Track &amp; Trace</p>
      <h1 className="mt-1 text-2xl font-bold text-navy">Where&apos;s my package?</h1>
      <p className="mt-1 text-body">Enter a tracking number to see the latest status.</p>

      <div className="mt-6 max-w-2xl">
        <Suspense fallback={null}>
          <TrackLookup />
        </Suspense>
      </div>
    </div>
  );
}
