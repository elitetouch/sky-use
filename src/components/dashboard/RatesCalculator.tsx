"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatNaira } from "@/lib/types";
import { LocationFields, EMPTY_LOCATION, type LocationValue } from "@/components/dashboard/LocationFields";

type ServiceRate = {
  service_level: string;
  label: string;
  delivery: string;
  price_kobo: number | null;
  available: boolean;
  unavailable_reason: string | null;
};

const CURRENCIES = ["NGN", "USD", "GBP", "EUR", "GHS", "KES", "ZAR", "CAD", "AUD", "CNY", "AED"];

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

export function RatesCalculator() {
  const [from, setFrom] = useState<LocationValue>({ ...EMPTY_LOCATION, countryCode: "NG", countryName: "Nigeria" });
  const [to, setTo] = useState<LocationValue>({ ...EMPTY_LOCATION });
  const [currency, setCurrency] = useState("NGN");
  const [weight, setWeight] = useState("1");
  const [rates, setRates] = useState<ServiceRate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getQuote() {
    if (!to.countryName) {
      setError("Choose the destination country.");
      return;
    }
    setError(null);
    setLoading(true);
    setRates(null);
    try {
      const response = await fetch("/api/quotes/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination_country: to.countryName,
          weight_kg: Number(weight) || 1,
          mode: to.countryName.toLowerCase() === "nigeria" ? "local" : "international",
        }),
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
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-black/5 p-6">
        <p className="text-sm font-semibold text-navy">Where are you shipping from?</p>
        <div className="mt-2">
          <LocationFields value={from} onChange={setFrom} />
        </div>

        <p className="mt-5 text-sm font-semibold text-navy">Where are you shipping to?</p>
        <div className="mt-2">
          <LocationFields value={to} onChange={setTo} />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-navy">Select currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy">Estimated weight (kg)</label>
            <input type="number" min="0.1" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputClass} />
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-red">{error}</p> : null}

        <Button type="button" variant="accent" className="mt-5 w-full" onClick={getQuote} disabled={loading}>
          {loading ? "Calculating…" : "Get Quote"}
        </Button>
      </div>

      {rates ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy">
            Rates to {to.city ? `${to.city}, ` : ""}
            {to.stateName ? `${to.stateName}, ` : ""}
            {to.countryName}
          </p>
          {rates.map((r) => (
            <div key={r.service_level} className={`flex items-center justify-between rounded-xl border p-4 ${r.available ? "border-black/10" : "border-black/5 bg-black/[0.02]"}`}>
              <div>
                <p className="text-sm font-semibold text-navy">{r.label}</p>
                <p className="text-xs text-body">Delivery: {r.delivery}</p>
              </div>
              {r.available && r.price_kobo !== null ? (
                <span className="text-base font-extrabold text-navy">{formatNaira(r.price_kobo)}</span>
              ) : (
                <span className="text-xs font-semibold text-body">Price not available</span>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
