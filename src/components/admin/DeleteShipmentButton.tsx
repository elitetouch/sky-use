"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function DeleteShipmentButton({
  shipmentId,
  trackingNumber,
}: {
  shipmentId: string;
  trackingNumber: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function remove() {
    setError(null);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/shipments/${shipmentId}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        const json = await response.json().catch(() => ({}));
        setError(json.message ?? "Unable to delete this shipment.");
        return;
      }
      router.push("/admin/shipments");
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <Button type="button" variant="ghost" onClick={() => setConfirming(true)}>
        Delete
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-red/30 bg-red/5 p-4">
      <p className="text-sm text-navy">
        Delete <span className="font-semibold">{trackingNumber}</span>? It will be removed from lists
        but can be restored by an administrator.
      </p>
      {error ? <p className="mt-2 text-sm text-red">{error}</p> : null}
      <div className="mt-3 flex gap-2">
        <Button type="button" variant="accent" disabled={isDeleting} onClick={remove}>
          {isDeleting ? "Deleting…" : "Yes, delete"}
        </Button>
        <Button type="button" variant="ghost" disabled={isDeleting} onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
