"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteCustomerButton({
  customerId,
  customerName,
}: {
  customerId: string;
  customerName: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete ${customerName}? They'll be removed from the list and can no longer sign in. Their shipment history is kept.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        const json = await response.json().catch(() => ({}));
        window.alert(json.message ?? "Unable to delete this customer.");
        return;
      }
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={isDeleting}
      className="text-sm font-semibold text-red hover:underline disabled:opacity-50"
    >
      {isDeleting ? "Deleting…" : "Delete"}
    </button>
  );
}
