"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ShipmentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the server logs (with a digest) for diagnosis.
    console.error("Shipments route error:", error);
  }, [error]);

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-black/5 p-8 text-center">
      <h1 className="text-lg font-bold text-navy">Something went wrong</h1>
      <p className="mt-2 text-sm text-body">
        We couldn&apos;t open this page. You can try again, or start a fresh booking.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button type="button" variant="primary" onClick={reset}>
          Try again
        </Button>
        <Link
          href="/dashboard/shipments/new"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-navy hover:text-red"
        >
          Start a new booking
        </Link>
      </div>
    </div>
  );
}
