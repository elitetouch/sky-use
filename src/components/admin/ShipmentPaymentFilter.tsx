"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ShipmentPaymentFilter({ selected }: { selected: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      value={selected}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) {
          params.set("payment", e.target.value);
        } else {
          params.delete("payment");
        }
        router.push(`/admin/shipments?${params.toString()}`);
      }}
      className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
    >
      <option value="">All payments</option>
      <option value="paid">Paid</option>
      <option value="pending">Pending</option>
    </select>
  );
}
