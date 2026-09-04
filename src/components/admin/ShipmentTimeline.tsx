"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatDateTime, toLagosInputValue } from "@/lib/datetime";
import type { StatusEvent, StatusTemplate } from "@/lib/types";

const inputClass =
  "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

export function ShipmentTimeline({
  shipmentId,
  events,
  templates,
  canEdit,
}: {
  shipmentId: string;
  events: StatusEvent[];
  templates: StatusTemplate[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    status_template_id: "",
    location: "",
    note: "",
    link: "",
    occurred_at: "",
  });

  function startEdit(event: StatusEvent) {
    setError(null);
    setEditingId(event.id);
    setForm({
      status_template_id: event.status_template_id ?? "",
      location: event.location ?? "",
      note: event.note ?? "",
      link: event.link ?? "",
      occurred_at: toLagosInputValue(event.created_at),
    });
  }

  async function save(eventId: string) {
    setError(null);
    setBusyId(eventId);
    try {
      const response = await fetch(`/api/admin/shipments/${shipmentId}/status-events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status_template_id: form.status_template_id || null,
          location: form.location || null,
          note: form.note || null,
          link: form.link || null,
          occurred_at: form.occurred_at || null,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message ?? "Unable to update this entry.");
        return;
      }
      setEditingId(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(eventId: string) {
    if (!window.confirm("Delete this timeline entry? This can't be undone.")) return;
    setError(null);
    setBusyId(eventId);
    try {
      const response = await fetch(`/api/admin/shipments/${shipmentId}/status-events/${eventId}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) {
        const json = await response.json().catch(() => ({}));
        setError(json.message ?? "Unable to delete this entry.");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 p-6">
      <p className="text-sm font-semibold text-navy">Shipment Timeline</p>

      {error ? <p className="mt-3 text-sm text-red">{error}</p> : null}

      {events.length === 0 ? (
        <p className="mt-4 text-sm text-body">No timeline entries yet.</p>
      ) : (
        <ol className="mt-4 space-y-4 border-l-2 border-navy/10 pl-4">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-red" />

              {editingId === event.id ? (
                <div className="rounded-xl border border-black/10 bg-[#f5f5f7] p-3">
                  <label className="block text-xs font-semibold text-navy">Milestone</label>
                  <select
                    value={form.status_template_id}
                    onChange={(e) => setForm((f) => ({ ...f, status_template_id: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">— None —</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>

                  <label className="mt-2 block text-xs font-semibold text-navy">Date &amp; time</label>
                  <input
                    type="datetime-local"
                    value={form.occurred_at}
                    onChange={(e) => setForm((f) => ({ ...f, occurred_at: e.target.value }))}
                    className={inputClass}
                  />

                  <label className="mt-2 block text-xs font-semibold text-navy">Location</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Lagos Hub"
                    className={inputClass}
                  />

                  <label className="mt-2 block text-xs font-semibold text-navy">Note</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    rows={2}
                    className={`${inputClass} resize-y`}
                  />

                  <label className="mt-2 block text-xs font-semibold text-navy">Link (optional)</label>
                  <input
                    value={form.link}
                    onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                    placeholder="https://…"
                    className={inputClass}
                  />

                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => save(event.id)}
                      disabled={busyId === event.id}
                    >
                      {busyId === event.id ? "Saving…" : "Save"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setEditingId(null)} disabled={busyId === event.id}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="group">
                  <p className="text-sm font-semibold text-navy">{event.label}</p>
                  {event.location ? <p className="text-xs text-body">{event.location}</p> : null}
                  {event.note ? <p className="text-xs text-body">{event.note}</p> : null}
                  {event.link ? (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-block break-all text-xs font-semibold text-red hover:underline"
                    >
                      {event.link}
                    </a>
                  ) : null}
                  <p className="mt-1 text-xs text-body/70">{formatDateTime(event.created_at)}</p>

                  {canEdit ? (
                    <div className="mt-1 flex gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(event)}
                        className="text-xs font-semibold text-navy hover:text-red"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(event.id)}
                        disabled={busyId === event.id}
                        className="text-xs font-semibold text-red hover:underline disabled:opacity-50"
                      >
                        {busyId === event.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
