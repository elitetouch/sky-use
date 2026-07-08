"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function PayButton({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  async function handlePay() {
    setError(null);
    setIsPaying(true);

    try {
      const response = await fetch(`/api/shipments/${shipmentId}/pay`, { method: "POST" });
      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Payment failed.");
        return;
      }

      router.refresh();
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <div className="mt-4">
      <Button variant="accent" className="w-full" onClick={handlePay} disabled={isPaying}>
        {isPaying ? "Paying…" : "Pay from Wallet"}
      </Button>
      {error ? <p className="mt-2 text-sm text-yellow">{error}</p> : null}
    </div>
  );
}
