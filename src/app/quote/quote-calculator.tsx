"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

type Quote = {
  price_kobo: number;
  base_fee_kobo: number;
  per_kg_kobo: number;
  weight_kg: number;
};

function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);
}

export function QuoteCalculator() {
  const [weightKg, setWeightKg] = useState("1");
  const [serviceLevel, setServiceLevel] = useState("standard");
  const [mode, setMode] = useState("local");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setQuote(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight_kg: Number(weightKg), service_level: serviceLevel, mode }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "We couldn't calculate a quote for that combination.");
        return;
      }

      setQuote(json.data);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-black/5 p-6">
        <div>
          <label className="block text-sm font-semibold text-navy">Weight (kg)</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            required
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-navy">Service Level</label>
            <select
              value={serviceLevel}
              onChange={(e) => setServiceLevel(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
            >
              <option value="standard">Standard</option>
              <option value="express">Express</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
            >
              <option value="local">Local</option>
              <option value="international">International</option>
            </select>
          </div>
        </div>

        <Button type="submit" variant="accent" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? "Calculating…" : "Calculate Price"}
        </Button>
      </form>

      {error ? <p className="mt-4 text-sm text-red">{error}</p> : null}

      {quote ? (
        <div className="mt-6 rounded-2xl bg-navy p-6 text-white">
          <p className="text-sm text-white/70">Estimated price</p>
          <p className="mt-1 text-4xl font-extrabold">{formatNaira(quote.price_kobo)}</p>
          <div className="mt-4 flex justify-between text-sm text-white/70">
            <span>Base fee: {formatNaira(quote.base_fee_kobo)}</span>
            <span>
              Per kg: {formatNaira(quote.per_kg_kobo)} &times; {quote.weight_kg}kg
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
