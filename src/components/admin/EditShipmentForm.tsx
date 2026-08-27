"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AddressFieldset, EMPTY_ADDRESS, type AddressForm } from "@/components/admin/AddressFieldset";
import type { AdminShipment, Address } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import { SERVICE_OPTIONS } from "@/lib/services";
import { DELIVERY_WINDOWS } from "@/lib/delivery";

type LineItem = { description: string; amount: string };

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
    postal_code: address.postal_code ?? "",
    country: address.country || "Nigeria",
  };
}

export function EditShipmentForm({ shipment }: { shipment: AdminShipment }) {
  const router = useRouter();

  const [serviceLevel, setServiceLevel] = useState(shipment.service_level);
  const [carrier, setCarrier] = useState(shipment.carrier ?? "");
  const [terminalShipmentId, setTerminalShipmentId] = useState(shipment.terminal_shipment_id ?? "");
  const [estimatedDate, setEstimatedDate] = useState(shipment.estimated_delivery_date ?? "");
  const [estimatedWindow, setEstimatedWindow] = useState(
    shipment.estimated_delivery_window ?? "By End of Day",
  );
  const [totalWeight, setTotalWeight] = useState(shipment.weight_kg ?? "");
  const [note, setNote] = useState(shipment.description ?? "");
  const [declaredValue, setDeclaredValue] = useState(nairaField(shipment.declared_value_kobo));

  const [items, setItems] = useState<LineItem[]>(
    shipment.items && shipment.items.length > 0
      ? shipment.items.map((item) => ({
          description: item.description,
          amount: item.cost_kobo ? String(item.cost_kobo / 100) : "",
        }))
      : [{ description: "", amount: "" }],
  );

  const [handling, setHandling] = useState(nairaField(shipment.handling_kobo));
  const [freight, setFreight] = useState(nairaField(shipment.freight_kobo));
  const [insurance, setInsurance] = useState(nairaField(shipment.insurance_kobo));

  const [sender, setSender] = useState<AddressForm>(addressToForm(shipment.sender_address));
  const [receiver, setReceiver] = useState<AddressForm>(addressToForm(shipment.receiver_address));

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Item amounts are recorded per line but are NOT part of the total.
  const totalAmount = toNumber(handling) + toNumber(freight) + toNumber(insurance);

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
      weight_kg: Number(totalWeight),
      carrier: carrier || undefined,
      terminal_shipment_id: terminalShipmentId.trim() || null,
      estimated_delivery_date: estimatedDate || null,
      estimated_delivery_window: estimatedDate ? estimatedWindow || null : null,
      declared_value: declaredValue ? Number(declaredValue) : undefined,
      description: note || undefined,
      items: validItems.map((item) => ({
        description: item.description.trim(),
        cost: toNumber(item.amount),
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
        postal_code: sender.postal_code || undefined,
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
        postal_code: receiver.postal_code || undefined,
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
              {SERVICE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy">Carrier</label>
            <input value={carrier} onChange={(e) => setCarrier(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy">Total Weight (kg)</label>
            <input
              type="number"
              min="0.1"
              step="0.01"
              required
              value={totalWeight}
              onChange={(e) => setTotalWeight(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-navy">Terminal tracking number (optional)</label>
          <input
            value={terminalShipmentId}
            onChange={(e) => setTerminalShipmentId(e.target.value)}
            placeholder="e.g. SH-16380611554"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-body">
            Terminal Africa shipment ID for DHL/UPS/FedEx. Live tracking is pulled from Terminal and stays
            masked behind the SkyFots tracking number.
          </p>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-navy">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className={`${inputClass} resize-y`}
          />
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

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-navy">Estimated delivery date</label>
            <input
              type="date"
              value={estimatedDate}
              onChange={(e) => setEstimatedDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy">Delivery window</label>
            <select
              value={estimatedWindow}
              onChange={(e) => setEstimatedWindow(e.target.value)}
              disabled={!estimatedDate}
              className={`${inputClass} disabled:opacity-50`}
            >
              {DELIVERY_WINDOWS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 border-t border-black/5 pt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-navy">Items</p>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, { description: "", amount: "" }])}
              className="rounded-full border border-navy/20 px-3 py-1 text-xs font-semibold text-navy hover:bg-navy/5"
            >
              + Add item
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-end">
                <div className="sm:col-span-8">
                  {index === 0 ? <label className="block text-xs font-semibold text-body">Description</label> : null}
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                    placeholder="Item description"
                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                  />
                </div>
                <div className="sm:col-span-3">
                  {index === 0 ? (
                    <label className="block text-xs font-semibold text-body">Amount (₦, optional)</label>
                  ) : null}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) => updateItem(index, { amount: e.target.value })}
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
          <div className="flex justify-between text-base">
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
