"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { StatusTemplate } from "@/lib/types";

export function UpdateStatusForm({
  shipmentId,
  currentTemplateId,
  templates,
}: {
  shipmentId: string;
  currentTemplateId: string | null;
  templates: StatusTemplate[];
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(currentTemplateId ?? templates[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [noteEdited, setNoteEdited] = useState(false);
  const [location, setLocation] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [trackingNumbers, setTrackingNumbers] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function selectTemplate(id: string) {
    setTemplateId(id);
    // Prefill the note from the chosen milestone's default, unless the admin
    // has already typed their own note.
    if (!noteEdited) {
      const template = templates.find((t) => t.id === id);
      setNote(template?.description ?? "");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/shipments/${shipmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status_template_id: templateId,
          note: note || undefined,
          location: location || undefined,
          links: links.map((l) => l.trim()).filter((l) => l !== ""),
          tracking_numbers: trackingNumbers.map((t) => t.trim()).filter((t) => t !== ""),
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Unable to update status.");
        return;
      }

      setLocation("");
      setLinks([""]);
      setTrackingNumbers([""]);
      setNote("");
      setNoteEdited(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectClass =
    "w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-black/5 p-6">
      <p className="text-sm font-semibold text-navy">Update Status</p>

      <select value={templateId} onChange={(e) => selectTemplate(e.target.value)} className={selectClass}>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.title}
          </option>
        ))}
      </select>

      <textarea
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setNoteEdited(true);
        }}
        rows={3}
        placeholder="Note (prefilled from the milestone — edit if needed)"
        className={selectClass}
      />

      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location (optional)"
        className={selectClass}
      />

      <div className="space-y-2">
        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="url"
              value={link}
              onChange={(e) => setLinks((prev) => prev.map((l, idx) => (idx === i ? e.target.value : l)))}
              placeholder="Link (optional, e.g. https://…)"
              className={selectClass}
            />
            {links.length > 1 ? (
              <button
                type="button"
                onClick={() => setLinks((prev) => prev.filter((_, idx) => idx !== i))}
                className="shrink-0 text-red hover:text-red/70"
                aria-label="Remove link"
              >
                ✕
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLinks((prev) => [...prev, ""])}
          className="text-xs font-semibold text-navy hover:text-red"
        >
          + Add another link
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-body">Tracking number(s)</p>
        {trackingNumbers.map((tn, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={tn}
              onChange={(e) =>
                setTrackingNumbers((prev) => prev.map((t, idx) => (idx === i ? e.target.value : t)))
              }
              placeholder="Tracking number (optional)"
              className={selectClass}
            />
            {trackingNumbers.length > 1 ? (
              <button
                type="button"
                onClick={() => setTrackingNumbers((prev) => prev.filter((_, idx) => idx !== i))}
                className="shrink-0 text-red hover:text-red/70"
                aria-label="Remove tracking number"
              >
                ✕
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setTrackingNumbers((prev) => [...prev, ""])}
          className="text-xs font-semibold text-navy hover:text-red"
        >
          + Add another tracking number
        </button>
      </div>

      {error ? <p className="text-sm text-red">{error}</p> : null}

      <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating…" : "Update Status"}
      </Button>
    </form>
  );
}
