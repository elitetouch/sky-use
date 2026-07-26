"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { StatusTemplate } from "@/lib/types";

type FormState = {
  title: string;
  description: string;
  is_active: boolean;
  is_delivered: boolean;
};

const EMPTY_FORM: FormState = { title: "", description: "", is_active: true, is_delivered: false };

export function StatusTemplateManager({ initialTemplates }: { initialTemplates: StatusTemplate[] }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setError(null);
    setShowForm(true);
  }

  function startEdit(template: StatusTemplate) {
    setEditingId(template.id);
    setForm({
      title: template.title,
      description: template.description ?? "",
      is_active: template.is_active,
      is_delivered: template.is_delivered,
    });
    setErrors({});
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrors({});
    setError(null);
    setIsSubmitting(true);

    try {
      const url = editingId ? `/api/admin/status-templates/${editingId}` : "/api/admin/status-templates";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Unable to save milestone.");
        setErrors(json.errors ?? {});
        return;
      }

      if (editingId) {
        setTemplates((prev) => prev.map((t) => (t.id === editingId ? json.data : t)));
      } else {
        setTemplates((prev) => [...prev, json.data]);
      }

      setShowForm(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this milestone?")) return;

    const response = await fetch(`/api/admin/status-templates/${id}`, { method: "DELETE" });

    if (response.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
      return;
    }

    const json = await response.json();
    alert(json.message ?? "Unable to delete milestone.");
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

  return (
    <div>
      {!showForm ? (
        <Button variant="accent" onClick={startCreate}>
          + Add Milestone
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-2xl border border-black/5 p-6">
          <Field
            label="Title"
            name="title"
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            error={errors.title?.[0]}
          />

          <div>
            <label className="block text-sm font-semibold text-navy">Default note (prefills the update form)</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              />
              Active (selectable when updating status)
            </label>
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={form.is_delivered}
                onChange={(e) => setForm((p) => ({ ...p, is_delivered: e.target.checked }))}
              />
              Counts as delivered
            </label>
          </div>

          {error ? <p className="text-sm text-red">{error}</p> : null}

          <div className="flex gap-3">
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : editingId ? "Save Changes" : "Add Milestone"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f5f5f5] text-xs uppercase tracking-wide text-body">
            <tr>
              <th className="px-5 py-3">#</th>
              <th className="px-5 py-3">Milestone</th>
              <th className="px-5 py-3">Default Note</th>
              <th className="px-5 py-3">Active</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {templates.map((template, index) => (
              <tr key={template.id} className="align-top">
                <td className="px-5 py-4 text-body">{index + 1}</td>
                <td className="px-5 py-4 font-semibold text-navy">
                  {template.title}
                  {template.is_delivered ? (
                    <span className="ml-2 rounded-full bg-navy/10 px-2 py-0.5 text-xs font-semibold text-navy">
                      Delivered
                    </span>
                  ) : null}
                </td>
                <td className="px-5 py-4 text-body">{template.description}</td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      template.is_active ? "bg-navy/10 text-navy" : "bg-red/10 text-red"
                    }`}
                  >
                    {template.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-3 text-sm font-semibold">
                    <button onClick={() => startEdit(template)} className="text-navy hover:text-red">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(template.id)} className="text-red hover:text-red-light">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
