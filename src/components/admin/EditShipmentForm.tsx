"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AddressFieldset, EMPTY_ADDRESS, type AddressForm } from "@/components/admin/AddressFieldset";
import type { AdminShipment, Address } from "@/lib/types";
import { formatNaira } from "@/lib/types";

type LineItem = { description: string; weight: string; cost: string };

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function nairaField(kobo: number | null | undefined): string {
  return kobo && kobo > 0 ? String(kobo / 100) : "";
}

function addressToForm(address: Address | undefined): AddressForm {
  if (!address) return { ...EMPTY_ADDRESS };
  return {
    label: address.label ?? "",
    contact_name: address.contact_name,
    phone: address.phone,
    email: address.email ?? "",
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    country: address.country || "Nigeria",
  };
}

export function EditShipmentForm({ shipment }: { shipment: AdminShipment }) {
  const router = useRouter();

  const [serviceLevel, setServiceLevel] = useState(shipment.service_level);
  const [mode, setMode] = useState(shipment.mode);
  const [carrier, setCarrier] = useState(shipment.carrier ?? "");
  const [description, setDescription] = useState(shipment.description ?? "");
  const [declaredValue, setDeclaredValue] = useState(nairaField(shipment.declared_value_kobo));

  const [items, setItems] = useState<LineItem[]>(
    shipment.items && shipment.items.length > 0
      ? shipment.items.map((item) => ({
          description: item.description,
          weight: item.weight_kg,
          cost: String(item.cost_kobo / 100),
        }))
      : [{ description: "", weight: "", cost: "" }],
  );

  const [handling, setHandling] = useState(nairaField(shipment.handling_kobo));
  const [freight, setFreight] = useState(nairaField(shipment.freight_kobo));
  const [insurance, setInsurance] = useState(nairaField(shipment.insurance_kobo));

  const [sender, setSender] = useState<AddressForm>(addressToForm(shipment.sender_address));
  const [receiver, setReceiver] = useState<AddressForm>(addressToForm(shipment.receiver_address));

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalWeight = items.reduce((sum, item) => sum + toNumber(item.weight), 0);
  const totalAmount =
    items.reduce((sum, item) => sum + toNumber(item.cost), 0) +
    toNumber(handling) +
    toNumber(freight) +
    toNumber(insurance);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const validItems = items.filter((item) => item.description.trim() !== "");
    if (validItems.length === 0) {
      setError("Add at least one item with a description.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      service_level: serviceLevel,
      mode,
      carrier: carrier || undefined,
      declared_value: declaredValue ? Number(declaredValue) : undefined,
      description: description || undefined,
      items: validItems.map((item) => ({
        description: item.description.trim(),
        weight_kg: toNumber(item.weight),
        cost: toNumber(item.cost),
      })),
      handling: handling ? Number(handling) : undefined,
      freight: freight ? Number(freight) : undefined,
      insurance: insurance ? Number(insurance) : undefined,
      sender_address: {
        contact_name: sender.contact_name,
        phone: sender.phone,
        email: sender.email || undefined,
        line1: sender.line1,
        line2: sender.line2 || undefined,
        city: sender.city,
        state: sender.state,
        country: sender.country || undefined,
      },
      receiver_address: {
        contact_name: receiver.contact_name,
        phone: receiver.phone,
        email: receiver.email || undefined,
        line1: receiver.line1,
        line2: receiver.line2 || undefined,
        city: receiver.city,
        state: receiver.state,
        country: receiver.country || undefined,
      },
    };

    try {
      const response = await fetch(`/api/admin/shipments/${shipment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message ?? "Unable to update this shipment.");
        return;
      }
      router.push(`/admin/shipments/${shipment.id}`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AddressFieldset title="Sender" value={sender} onChange={setSender} />
      <AddressFieldset title="Receiver" value={receiver} onChange={setReceiver} />

      <div className="rounded-2xl border border-black/5 p-6">
        <p className="text-sm font-semibold text-navy">Package &amp; Invoice</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
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
          <div>
            <label className="block text-sm font-semibold text-navy">Carrier</label>
            <input value={carrier} onChange={(e) => setCarrier(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-navy">Declared value (₦)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={declaredValue}
              onChange={(e) => setDeclaredValue(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-navy">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`${inputClass} resize-y`}
          />
        </div>

        <div className="mt-6 border-t border-black/5 pt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-navy">Items</p>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, { description: "", weight: "", cost: "" }])}
              className="rounded-full border border-navy/20 px-3 py-1 text-xs font-semibold text-navy hover:bg-navy/5"
            >
              + Add item
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-end">
                <div className="sm:col-span-6">
                  {index === 0 ? <label className="block text-xs font-semibold text-body">Description</label> : null}
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                    placeholder="Item description"
                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                  />
                </div>
                <div className="sm:col-span-2">
                  {index === 0 ? <label className="block text-xs font-semibold text-body">Weight (kg)</label> : null}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.weight}
                    onChange={(e) => updateItem(index, { weight: e.target.value })}
                    placeholder="0"
                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                  />
                </div>
                <div className="sm:col-span-3">
                  {index === 0 ? <label className="block text-xs font-semibold text-body">Cost (₦)</label> : null}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.cost}
                    onChange={(e) => updateItem(index, { cost: e.target.value })}
                    placeholder="0"
                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                  />
                </div>
                <div className="sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))}
                    disabled={items.length === 1}
                    aria-label="Remove item"
                    className="w-full rounded-lg px-2 py-2 text-sm font-semibold text-red hover:bg-red/5 disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-navy">Freight Charge (₦)</label>
            <input type="number" min="0" step="0.01" value={freight} onChange={(e) => setFreight(e.target.value)} placeholder="0" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy">Handling Charge (₦)</label>
            <input type="number" min="0" step="0.01" value={handling} onChange={(e) => setHandling(e.target.value)} placeholder="0" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy">Insurance Charge (₦)</label>
            <input type="number" min="0" step="0.01" value={insurance} onChange={(e) => setInsurance(e.target.value)} placeholder="0" className={inputClass} />
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-[#f5f5f7] p-4 text-sm">
          <div className="flex justify-between text-body">
            <span>Total weight</span>
            <span className="font-semibold text-navy">{totalWeight.toFixed(2)} kg</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-black/10 pt-2 text-base">
            <span className="font-semibold text-navy">Total amount</span>
            <span className="font-extrabold text-navy">{formatNaira(Math.round(totalAmount * 100))}</span>
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-red">{error}</p> : null}

      <div className="flex gap-3">
        <Button type="submit" variant="accent" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save Changes"}
        </Button>
        <Link
          href={`/admin/shipments/${shipment.id}`}
          className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold text-navy hover:bg-navy/5"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
