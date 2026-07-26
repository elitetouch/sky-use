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
  const [link, setLink] = useState("");
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
          link: link || undefined,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Unable to update status.");
        return;
      }

      setLocation("");
      setLink("");
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

      <input
        type="url"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="Link (optional, e.g. https://…)"
        className={selectClass}
      />

      {error ? <p className="text-sm text-red">{error}</p> : null}

      <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating…" : "Update Status"}
      </Button>
    </form>
  );
}
