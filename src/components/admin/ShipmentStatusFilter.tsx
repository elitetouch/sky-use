"use client";

import { useRouter } from "next/navigation";
import type { StatusTemplate } from "@/lib/types";

export function ShipmentStatusFilter({
  templates,
  selectedId,
}: {
  templates: StatusTemplate[];
  selectedId: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedId}
      onChange={(e) => {
        const id = e.target.value;
        router.push(id ? `/admin/shipments?status_template_id=${id}` : "/admin/shipments");
      }}
      className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
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
