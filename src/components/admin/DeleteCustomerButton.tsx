"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDialog } from "@/components/ui/DialogProvider";

export function DeleteCustomerButton({
  customerId,
  customerName,
}: {
  customerId: string;
  customerName: string;
}) {
  const router = useRouter();
  const dialog = useDialog();
  const [isDeleting, setIsDeleting] = useState(false);

  async function remove() {
    const ok = await dialog.confirm({
      title: `Delete ${customerName}?`,
      message: "They'll be removed from the customer list and can no longer sign in. Their shipment history is kept.",
      confirmLabel: "Delete customer",
      tone: "danger",
    });
    if (!ok) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        const json = await response.json().catch(() => ({}));
        await dialog.alert({ title: "Couldn't delete customer", message: json.message ?? "Unable to delete this customer.", tone: "danger" });
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
