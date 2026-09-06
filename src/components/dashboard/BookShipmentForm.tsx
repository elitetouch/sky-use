"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Address } from "@/lib/types";
import { formatNaira } from "@/lib/types";

type Quote = { price_kobo: number };
type Item = { description: string; quantity: string; value: string };

const STEPS = ["Route", "Package", "Review"] as const;
const EMPTY_ITEM: Item = { description: "", quantity: "1", value: "" };

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

function fullAddress(a: Address): string {
  return [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(", "), a.country]
    .filter(Boolean)
    .join(", ");
}

export function BookShipmentForm({ addresses }: { addresses: Address[] }) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [senderAddressId, setSenderAddressId] = useState(addresses[0]?.id ?? "");
  const [receiverAddressId, setReceiverAddressId] = useState(addresses[1]?.id ?? "");

  const [description, setDescription] = useState("");
  const [weightKg, setWeightKg] = useState("1");
  const [serviceLevel, setServiceLevel] = useState("standard");
  const [mode, setMode] = useState("local");
  const [items, setItems] = useState<Item[]>([{ ...EMPTY_ITEM }]);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const sender = addresses.find((a) => a.id === senderAddressId) ?? null;
  const receiver = addresses.find((a) => a.id === receiverAddressId) ?? null;
  const filledItems = items.filter((i) => i.description.trim() !== "");

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }
  function removeItem(index: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function next() {
    setError(null);
    if (step === 0) {
      if (!senderAddressId || !receiverAddressId) {
        setError("Choose both a sender and a receiver address.");
        return;
      }
      if (senderAddressId === receiverAddressId) {
        setError("Sender and receiver addresses must be different.");
        return;
      }
    }
    if (step === 1) {
      if (!weightKg || Number(weightKg) <= 0) {
        setError("Enter the package weight.");
        return;
      }
    }
    if (step === 1) {
      // Entering Review — fetch the instant price.
      void fetchQuote();
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function fetchQuote() {
    setIsQuoting(true);
    setQuote(null);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight_kg: Number(weightKg), service_level: serviceLevel, mode }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message ?? "Unable to calculate a price.");
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
          items: filledItems.map((it) => {
            const qty = Number(it.quantity);
            const label = qty > 1 ? `${it.description.trim()} ×${qty}` : it.description.trim();
            const value = Number(it.value);
            return { description: label, cost: Number.isFinite(value) && value > 0 ? value : undefined };
          }),
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
      {/* Stepper */}
      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i <= step ? "bg-navy text-white" : "bg-black/10 text-body"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-sm font-semibold ${i <= step ? "text-navy" : "text-body"}`}>{label}</span>
            {i < STEPS.length - 1 ? (
              <span className={`h-0.5 flex-1 ${i < step ? "bg-navy" : "bg-black/10"}`} />
            ) : null}
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-black/5 p-6">
        {/* Step 1 — Route */}
        {step === 0 ? (
          <div className="space-y-5">
            <AddressPicker
              title="Ship from"
              addresses={addresses}
              selectedId={senderAddressId}
              onSelect={setSenderAddressId}
            />
            <AddressPicker
              title="Ship to"
              addresses={addresses}
              selectedId={receiverAddressId}
              onSelect={setReceiverAddressId}
            />
            <Link href="/dashboard/addresses" className="inline-block text-sm font-semibold text-navy hover:text-red">
              + Manage addresses
            </Link>
          </div>
        ) : null}

        {/* Step 2 — Package */}
        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-navy">Package description (optional)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Documents, electronics…"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy">Weight (kg)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy">Service</label>
                <select value={serviceLevel} onChange={(e) => setServiceLevel(e.target.value)} className={inputClass}>
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy">Mode</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputClass}>
                  <option value="local">Local</option>
                  <option value="international">International</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-navy">What&apos;s inside? (optional)</label>
                <button type="button" onClick={addItem} className="text-xs font-semibold text-navy hover:text-red">
                  + Add item
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <input
                      value={item.description}
                      onChange={(e) => updateItem(i, { description: e.target.value })}
                      placeholder="Item (e.g. Shoes)"
                      className="col-span-6 rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                    />
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, { quantity: e.target.value })}
                      placeholder="Qty"
                      className="col-span-2 rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                    />
                    <input
                      type="number"
                      min="0"
                      value={item.value}
                      onChange={(e) => updateItem(i, { value: e.target.value })}
                      placeholder="Value ₦"
                      className="col-span-3 rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="col-span-1 text-red hover:text-red/70"
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Step 3 — Review */}
        {step === 2 ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-black/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Ship from</p>
                <p className="mt-1 text-sm font-semibold text-navy">{sender?.contact_name}</p>
                <p className="text-xs text-body">{sender ? fullAddress(sender) : ""}</p>
              </div>
              <div className="rounded-xl border border-black/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Ship to</p>
                <p className="mt-1 text-sm font-semibold text-navy">{receiver?.contact_name}</p>
                <p className="text-xs text-body">{receiver ? fullAddress(receiver) : ""}</p>
              </div>
            </div>

            <div className="rounded-xl border border-black/5 p-4 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-body">Weight</p>
                  <p className="font-semibold text-navy">{weightKg} kg</p>
                </div>
                <div>
                  <p className="text-body">Service</p>
                  <p className="font-semibold capitalize text-navy">{serviceLevel}</p>
                </div>
                <div>
                  <p className="text-body">Mode</p>
                  <p className="font-semibold capitalize text-navy">{mode}</p>
                </div>
              </div>
              {description ? <p className="mt-3 text-body">Description: <span className="text-navy">{description}</span></p> : null}
              {filledItems.length > 0 ? (
                <ul className="mt-3 divide-y divide-black/5">
                  {filledItems.map((it, i) => (
                    <li key={i} className="flex justify-between py-1.5">
                      <span className="text-navy">
                        {it.description}
                        {Number(it.quantity) > 1 ? ` ×${Number(it.quantity)}` : ""}
                      </span>
                      <span className="text-body">
                        {Number(it.value) > 0 ? formatNaira(Math.round(Number(it.value) * 100)) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="rounded-2xl bg-navy p-6 text-white">
              <p className="text-sm text-white/70">Total price</p>
              <p className="mt-1 text-4xl font-extrabold">
                {isQuoting ? "…" : quote ? formatNaira(quote.price_kobo) : "—"}
              </p>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red">{error}</p> : null}

        {/* Nav */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={back} disabled={isBooking}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" variant="primary" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              variant="accent"
              onClick={confirmBooking}
              disabled={isBooking || isQuoting || !quote}
            >
              {isBooking ? "Booking…" : "Confirm & Book"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddressPicker({
  title,
  addresses,
  selectedId,
  onSelect,
}: {
  title: string;
  addresses: Address[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-navy">{title}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {addresses.map((a) => {
          const selected = a.id === selectedId;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a.id)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                selected ? "border-navy bg-navy/[0.04]" : "border-black/10 hover:border-navy/40"
              }`}
            >
              <p className="text-sm font-semibold text-navy">
                {a.label ? `${a.label} — ` : ""}
                {a.contact_name}
              </p>
              <p className="text-xs text-body">
                {[a.city, a.state, a.country].filter(Boolean).join(", ")}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
