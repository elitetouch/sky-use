"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { Office } from "@/lib/types";

type FormState = {
  name: string;
  address: string;
  terms_and_conditions: string;
  is_default: boolean;
};

const EMPTY_FORM: FormState = { name: "", address: "", terms_and_conditions: "", is_default: false };

export function OfficeManager({ initialOffices }: { initialOffices: Office[] }) {
  const router = useRouter();
  const [offices, setOffices] = useState(initialOffices);
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

  function startEdit(office: Office) {
    setEditingId(office.id);
    setForm({
      name: office.name,
      address: office.address,
      terms_and_conditions: office.terms_and_conditions ?? "",
      is_default: office.is_default,
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
      const url = editingId ? `/api/admin/offices/${editingId}` : "/api/admin/offices";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Unable to save office.");
        setErrors(json.errors ?? {});
        return;
      }

      if (editingId) {
        setOffices((prev) => prev.map((o) => (o.id === editingId ? json.data : o)));
      } else {
        setOffices((prev) => [...prev, json.data]);
      }

      setShowForm(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this office?")) return;

    const response = await fetch(`/api/admin/offices/${id}`, { method: "DELETE" });

    if (response.ok) {
      setOffices((prev) => prev.filter((o) => o.id !== id));
      router.refresh();
      return;
    }

    const json = await response.json();
    alert(json.message ?? "Unable to delete office.");
  }

  return (
    <div>
      {!showForm ? (
        <Button variant="accent" onClick={startCreate}>
          + Add Office
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-2xl border border-black/5 p-6">
          <Field
            label="Office name"
            name="name"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            error={errors.name?.[0]}
          />

          <div>
            <label className="block text-sm font-semibold text-navy">Address</label>
            <textarea
              required
              rows={2}
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
            />
            {errors.address ? <p className="mt-1 text-xs text-red">{errors.address[0]}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy">Terms &amp; Conditions (shown on receipts)</label>
            <textarea
              rows={8}
              value={form.terms_and_conditions}
              onChange={(e) => setForm((p) => ({ ...p, terms_and_conditions: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-navy">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm((p) => ({ ...p, is_default: e.target.checked }))}
            />
            Default office for new bookings
          </label>

          {error ? <p className="text-sm text-red">{error}</p> : null}

          <div className="flex gap-3">
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : editingId ? "Save Changes" : "Add Office"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {offices.map((office) => (
          <div key={office.id} className="rounded-2xl border border-black/5 p-6">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-navy">
                {office.name}{" "}
                {office.is_default ? (
                  <span className="ml-1 rounded-full bg-navy/10 px-2 py-0.5 text-xs font-semibold text-navy">
                    Default
                  </span>
                ) : null}
              </p>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-body">{office.address}</p>
            {office.terms_and_conditions ? (
              <p className="mt-3 line-clamp-3 whitespace-pre-line text-xs text-body/70">
                {office.terms_and_conditions}
              </p>
            ) : (
              <p className="mt-3 text-xs text-body/70">No terms set.</p>
            )}
            <div className="mt-4 flex gap-4 text-sm font-semibold">
              <button onClick={() => startEdit(office)} className="text-navy hover:text-red">
                Edit
              </button>
              <button onClick={() => handleDelete(office.id)} className="text-red hover:text-red-light">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
