"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/datetime";

export function PaymentStatusForm({
  shipmentId,
  paidAt,
  paymentMethod,
  paymentMethodLabel,
}: {
  shipmentId: string;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentMethodLabel: string | null;
}) {
  const router = useRouter();
  const isPaid = Boolean(paidAt);

  const [method, setMethod] = useState(paymentMethod ?? "cash");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(paid: boolean) {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/shipments/${shipmentId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paid ? { paid: true, payment_method: method } : { paid: false }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message ?? "Unable to update payment.");
        return;
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 p-6">
      <p className="text-sm font-semibold text-navy">Payment</p>

      {isPaid ? (
        <div className="mt-3">
          <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            Paid{paymentMethodLabel ? ` · ${paymentMethodLabel}` : ""}
          </span>
          <p className="mt-2 text-xs text-body">
            Recorded {formatDateTime(paidAt!)}
          </p>
          <Button
            type="button"
            variant="ghost"
            className="mt-3"
            disabled={isSubmitting}
            onClick={() => submit(false)}
          >
            {isSubmitting ? "Updating…" : "Mark as unpaid"}
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            Pending
          </span>
          <div>
            <label className="block text-sm font-semibold text-navy">Payment method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Bank Transfer</option>
            </select>
          </div>
          <Button type="button" variant="accent" disabled={isSubmitting} onClick={() => submit(true)}>
            {isSubmitting ? "Saving…" : "Mark as paid"}
          </Button>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-red">{error}</p> : null}
    </div>
  );
}
