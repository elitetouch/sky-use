"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

const QUICK_AMOUNTS = [500000, 1000000, 5000000]; // kobo: ₦5,000 / ₦10,000 / ₦50,000

export function FundWalletForm() {
  const [amountNaira, setAmountNaira] = useState("5000");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_kobo: Math.round(Number(amountNaira) * 100) }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Unable to initialize funding.");
        return;
      }

      if (json.data?.authorization_url) {
        window.location.href = json.data.authorization_url;
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-black/5 p-6">
      <label className="block text-sm font-semibold text-navy">Amount to fund (NGN)</label>
      <input
        type="number"
        min="100"
        step="1"
        required
        value={amountNaira}
        onChange={(e) => setAmountNaira(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
      />

      <div className="mt-3 flex gap-2">
        {QUICK_AMOUNTS.map((kobo) => (
          <button
            key={kobo}
            type="button"
            onClick={() => setAmountNaira(String(kobo / 100))}
            className="rounded-full border border-navy/20 px-3 py-1 text-xs font-semibold text-navy hover:bg-navy hover:text-white"
          >
            ₦{(kobo / 100).toLocaleString()}
          </button>
        ))}
      </div>

      {error ? <p className="mt-3 text-sm text-red">{error}</p> : null}

      <Button type="submit" variant="accent" className="mt-4 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Redirecting to Paystack…" : "Fund Wallet"}
      </Button>
    </form>
  );
}
