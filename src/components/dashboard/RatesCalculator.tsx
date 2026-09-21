"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatNaira } from "@/lib/types";

type ServiceRate = {
  service_level: string;
  label: string;
  delivery: string;
  price_kobo: number | null;
  available: boolean;
  unavailable_reason: string | null;
};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

export function RatesCalculator() {
  const [country, setCountry] = useState("");
  const [weight, setWeight] = useState("1");
  const [rates, setRates] = useState<ServiceRate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getQuote() {
    if (!country.trim()) {
      setError("Enter a destination country.");
      return;
    }
    setError(null);
    setLoading(true);
    setRates(null);
    try {
      const response = await fetch("/api/quotes/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination_country: country.trim(), weight_kg: Number(weight) || 1 }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message ?? "Couldn't fetch rates.");
        return;
      }
      setRates(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 max-w-2xl space-y-6">
      <div className="rounded-2xl border border-black/5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-navy">Destination country</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. United Kingdom" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy">Weight (kg)</label>
            <input type="number" min="0.1" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputClass} />
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-red">{error}</p> : null}
        <Button type="button" variant="accent" className="mt-4 w-full" onClick={getQuote} disabled={loading}>
          {loading ? "Calculating…" : "Get Quote"}
        </Button>
      </div>

      {rates ? (
        <div className="space-y-2">
          {rates.map((r) => (
            <div key={r.service_level} className={`flex items-center justify-between rounded-xl border p-4 ${r.available ? "border-black/10" : "border-black/5 bg-black/[0.02]"}`}>
              <div>
                <p className="text-sm font-semibold text-navy">{r.label}</p>
                <p className="text-xs text-body">{r.available ? `Delivery: ${r.delivery}` : r.unavailable_reason ?? "Not available"}</p>
              </div>
              {r.available && r.price_kobo !== null ? (
                <span className="text-base font-extrabold text-navy">{formatNaira(r.price_kobo)}</span>
              ) : (
                <span className="text-xs font-semibold text-body">Unavailable</span>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
