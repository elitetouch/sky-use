"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

const COURIERS = [
  { value: "internal", label: "Skyfot Fleet" },
  { value: "dhl", label: "DHL Express" },
  { value: "ups", label: "UPS" },
  { value: "terminal", label: "Terminal (DHL · UPS · FedEx)" },
  { value: "air_cargo", label: "Air Cargo" },
  { value: "sea_cargo", label: "Sea Cargo" },
];

// Only these couriers carry an external waybill used for live tracking.
const TRACKED_COURIERS = ["dhl", "ups", "terminal"];

export function AssignCourierForm({
  shipmentId,
  currentCourier,
  currentTrackingNumber,
}: {
  shipmentId: string;
  currentCourier: string | null;
  currentTrackingNumber: string | null;
}) {
  const router = useRouter();
  const [courier, setCourier] = useState(currentCourier ?? "internal");
  const [trackingNumber, setTrackingNumber] = useState(currentTrackingNumber ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/shipments/${shipmentId}/assign-courier`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courier,
          courier_tracking_number: trackingNumber.trim() || undefined,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Unable to assign courier.");
        return;
      }

      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-black/5 p-6">
      <p className="text-sm font-semibold text-navy">Assign Courier</p>

      <select value={courier} onChange={(e) => setCourier(e.target.value)} className={inputClass}>
        {COURIERS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      {TRACKED_COURIERS.includes(courier) ? (
        <div>
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Courier tracking / waybill number"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-body">Used for live tracking from the courier (DHL · UPS · FedEx).</p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red">{error}</p> : null}

      <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Assigning…" : "Assign Courier"}
      </Button>
    </form>
  );
}
