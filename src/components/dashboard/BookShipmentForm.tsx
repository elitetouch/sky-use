"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Address } from "@/lib/types";
import { formatNaira } from "@/lib/types";

type Quote = {
  price_kobo: number;
  base_fee_kobo: number;
  per_kg_kobo: number;
};

function addressLabel(address: Address): string {
  return `${address.label ? `${address.label} — ` : ""}${address.contact_name}, ${address.city}`;
}

export function BookShipmentForm({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [senderAddressId, setSenderAddressId] = useState(addresses[0]?.id ?? "");
  const [receiverAddressId, setReceiverAddressId] = useState(addresses[1]?.id ?? addresses[0]?.id ?? "");
  const [weightKg, setWeightKg] = useState("1");
  const [serviceLevel, setServiceLevel] = useState("standard");
  const [mode, setMode] = useState("local");
  const [description, setDescription] = useState("");

  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  async function getQuote(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setQuote(null);
    setIsQuoting(true);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight_kg: Number(weightKg), service_level: serviceLevel, mode }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Unable to calculate a quote.");
        return;
      }

      setQuote(json.data);
    } finally {
      setIsQuoting(false);
    }
  }

  async function confirmBooking() {
    setError(null);
    setIsBooking(true);

    try {
      const response = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_address_id: senderAddressId,
          receiver_address_id: receiverAddressId,
          weight_kg: Number(weightKg),
          service_level: serviceLevel,
          mode,
          description: description || undefined,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Unable to book this shipment.");
        return;
      }

      router.push(`/dashboard/shipments/${json.data.id}`);
      router.refresh();
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={getQuote} className="space-y-4 rounded-2xl border border-black/5 p-6">
        <div>
          <label className="block text-sm font-semibold text-navy">Sender address</label>
          <select
            value={senderAddressId}
            onChange={(e) => setSenderAddressId(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
          >
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {addressLabel(address)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy">Receiver address</label>
          <select
            value={receiverAddressId}
            onChange={(e) => setReceiverAddressId(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
          >
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {addressLabel(address)}
              </option>
            ))}
          </select>
        </div>

        {senderAddressId === receiverAddressId ? (
          <p className="text-xs text-red">Sender and receiver addresses should usually be different.</p>
        ) : null}

        <div>
          <label className="block text-sm font-semibold text-navy">Package description (optional)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Documents, electronics…"
            className="mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
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
          <div>
            <label className="block text-sm font-semibold text-navy">Service</label>
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

        <Button type="submit" variant="primary" className="w-full" disabled={isQuoting}>
          {isQuoting ? "Calculating…" : "Get Quote"}
        </Button>
      </form>

      {error ? <p className="text-sm text-red">{error}</p> : null}

      {quote ? (
        <div className="rounded-2xl bg-navy p-6 text-white">
          <p className="text-sm text-white/70">Total price</p>
          <p className="mt-1 text-4xl font-extrabold">{formatNaira(quote.price_kobo)}</p>
          <Button
            variant="accent"
            className="mt-6 w-full"
            onClick={confirmBooking}
            disabled={isBooking || senderAddressId === receiverAddressId}
          >
            {isBooking ? "Booking…" : "Confirm Booking"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
