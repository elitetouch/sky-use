"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateTime } from "@/lib/datetime";

type Draft = { id: string; summary: string | null; updated_at: string };

export function DraftsList({ drafts }: { drafts: Draft[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function remove(id: string) {
    if (!window.confirm("Delete this draft?")) return;
    setBusyId(id);
    try {
      await fetch(`/api/shipment-drafts/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (drafts.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-navy">Drafts</p>
      <div className="mt-2 space-y-2">
        {drafts.map((draft) => (
          <div key={draft.id} className="flex items-center justify-between rounded-xl border border-dashed border-black/15 bg-black/[0.02] p-4">
            <div>
              <p className="text-sm font-semibold text-navy">{draft.summary ?? "Draft shipment"}</p>
              <p className="text-xs text-body">Saved {formatDateTime(draft.updated_at)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/dashboard/shipments/new?draft=${draft.id}`} className="text-xs font-semibold text-navy hover:text-red">
                Resume
              </Link>
              <button
                type="button"
                onClick={() => remove(draft.id)}
                disabled={busyId === draft.id}
                className="text-xs font-semibold text-red hover:underline disabled:opacity-50"
              >
                {busyId === draft.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
