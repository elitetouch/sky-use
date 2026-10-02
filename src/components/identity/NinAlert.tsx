"use client";

import { NinFaceVerify } from "@/components/identity/NinFaceVerify";

/** Dashboard banner prompting customers who haven't verified their NIN. */
export function NinAlert() {
  return (
    <div className="mt-6 rounded-2xl border border-yellow/50 bg-yellow/10 p-5">
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 text-lg">⚠️</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-navy">Verify your identity to start shipping</p>
          <p className="mt-1 text-sm text-body">
            Verify your NIN with a quick live photo. You&apos;ll need this before you can book a shipment.
          </p>
          <div className="mt-3">
            <NinFaceVerify refreshOnVerify />
          </div>
        </div>
      </div>
    </div>
  );
}
