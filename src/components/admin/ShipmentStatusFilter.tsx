"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { StatusTemplate } from "@/lib/types";

const SELECT_CLASS =
  "w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

export function ShipmentStatusFilter({
  templates,
  selectedId,
}: {
  templates: StatusTemplate[];
  selectedId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      value={selectedId}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) {
          params.set("status_template_id", e.target.value);
        } else {
          params.delete("status_template_id");
        }
        params.delete("page");
        router.push(`/admin/shipments?${params.toString()}`);
      }}
      className={SELECT_CLASS}
    >
      <option value="">All milestones</option>
      {templates.map((template) => (
        <option key={template.id} value={template.id}>
          {template.title}
        </option>
      ))}
    </select>
  );
}
