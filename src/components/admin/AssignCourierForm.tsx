"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

const COURIERS = [
  { value: "internal", label: "Skyfot Fleet" },
  { value: "dhl", label: "DHL Express" },
  { value: "ups", label: "UPS" },
  { value: "terminal", label: "Terminal (DHL · UPS · FedEx)" },
];

export function AssignCourierForm({
  shipmentId,
  currentCourier,
  currentTrackingNumbers,
}: {
  shipmentId: string;
  currentCourier: string | null;
  currentTrackingNumbers: string[];
}) {
  const router = useRouter();
  const [courier, setCourier] = useState(currentCourier ?? "internal");
  const [trackingNumbers, setTrackingNumbers] = useState<string[]>(
    currentTrackingNumbers.length > 0 ? currentTrackingNumbers : [""],
  );
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
          courier_tracking_numbers: trackingNumbers.map((t) => t.trim()).filter((t) => t !== ""),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-black/5 p-6">
      <p className="text-sm font-semibold text-navy">Assign Courier</p>

      <select
        value={courier}
        onChange={(e) => setCourier(e.target.value)}
        className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
      >
        {COURIERS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      {courier !== "internal" ? (
        <div className="space-y-2">
          {trackingNumbers.map((tn, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={tn}
                onChange={(e) => setTrackingNumbers((prev) => prev.map((t, idx) => (idx === i ? e.target.value : t)))}
                placeholder="Courier tracking / waybill number"
                className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
              />
              {trackingNumbers.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setTrackingNumbers((prev) => prev.filter((_, idx) => idx !== i))}
                  className="shrink-0 text-red hover:text-red/70"
                  aria-label="Remove tracking number"
                >
                  ✕
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setTrackingNumbers((prev) => [...prev, ""])}
            className="text-xs font-semibold text-navy hover:text-red"
          >
            + Add another tracking number
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red">{error}</p> : null}

      <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Assigning…" : "Assign Courier"}
      </Button>
    </form>
  );
}
