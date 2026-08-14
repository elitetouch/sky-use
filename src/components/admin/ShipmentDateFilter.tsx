"use client";

import { useRouter, useSearchParams } from "next/navigation";

const PRESETS = new Set(["today", "week", "month"]);

const SELECT_CLASS =
  "w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

export function ShipmentDateFilter({ selected }: { selected: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const preset = PRESETS.has(selected) ? selected : "";
  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(selected) ? selected : "";

  function apply(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("date", value);
    } else {
      params.delete("date");
    }
    params.delete("page");
    router.push(`/admin/shipments?${params.toString()}`);
  }

  return (
    <div className="flex gap-2">
      <select value={preset} onChange={(e) => apply(e.target.value)} className={SELECT_CLASS}>
        <option value="">All time</option>
        <option value="today">Today</option>
        <option value="week">This week</option>
        <option value="month">This month</option>
      </select>
      <input
        type="date"
        value={dateValue}
        onChange={(e) => apply(e.target.value)}
        className={SELECT_CLASS}
        aria-label="Filter by a specific date"
      />
    </div>
  );
}
