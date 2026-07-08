"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { Address } from "@/lib/types";

type FormState = {
  label: string;
  contact_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  is_default: boolean;
};

const EMPTY_FORM: FormState = {
  label: "",
  contact_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  is_default: false,
};

export function AddressManager({ initialAddresses }: { initialAddresses: Address[] }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowForm(true);
  }

  function startEdit(address: Address) {
    setEditingId(address.id);
    setForm({
      label: address.label ?? "",
      contact_name: address.contact_name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      is_default: address.is_default,
    });
    setErrors({});
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const url = editingId ? `/api/addresses/${editingId}` : "/api/addresses";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await response.json();

      if (!response.ok) {
        setErrors(json.errors ?? {});
        return;
      }

      if (editingId) {
        setAddresses((prev) => prev.map((a) => (a.id === editingId ? json.data : a)));
      } else {
        setAddresses((prev) => [json.data, ...prev]);
      }

      setShowForm(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this address?")) return;

    const response = await fetch(`/api/addresses/${id}`, { method: "DELETE" });

    if (response.ok) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
    }
  }

  function update(field: keyof FormState) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({
        ...prev,
        [field]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
      }));
  }

  return (
    <div>
      {!showForm ? (
        <Button variant="accent" onClick={startCreate}>
          + Add Address
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-2xl border border-black/5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Label (optional)"
              name="label"
              value={form.label}
              onChange={update("label")}
              placeholder="Home, Office…"
            />
            <Field
              label="Contact name"
              name="contact_name"
              required
              value={form.contact_name}
              onChange={update("contact_name")}
              error={errors.contact_name?.[0]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Phone"
              name="phone"
              required
              value={form.phone}
              onChange={update("phone")}
              error={errors.phone?.[0]}
            />
            <Field
              label="City"
              name="city"
              required
              value={form.city}
              onChange={update("city")}
              error={errors.city?.[0]}
            />
          </div>
          <Field
            label="Address line 1"
            name="line1"
            required
            value={form.line1}
            onChange={update("line1")}
            error={errors.line1?.[0]}
          />
          <Field label="Address line 2 (optional)" name="line2" value={form.line2} onChange={update("line2")} />
          <Field
            label="State"
            name="state"
            required
            value={form.state}
            onChange={update("state")}
            error={errors.state?.[0]}
          />

          <label className="flex items-center gap-2 text-sm text-navy">
            <input type="checkbox" checked={form.is_default} onChange={update("is_default")} />
            Set as default address
          </label>

          <div className="flex gap-3">
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : editingId ? "Save Changes" : "Add Address"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {addresses.map((address) => (
          <div key={address.id} className="rounded-2xl border border-black/5 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-navy">
                  {address.label || "Address"}{" "}
                  {address.is_default ? (
                    <span className="ml-1 rounded-full bg-navy/10 px-2 py-0.5 text-xs font-semibold text-navy">
                      Default
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-body">{address.contact_name}</p>
                <p className="text-sm text-body">{address.phone}</p>
                <p className="mt-2 text-sm text-body">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-sm font-semibold">
              <button onClick={() => startEdit(address)} className="text-navy hover:text-red">
                Edit
              </button>
              <button onClick={() => handleDelete(address.id)} className="text-red hover:text-red-light">
                Delete
              </button>
            </div>
          </div>
        ))}

        {addresses.length === 0 && !showForm ? (
          <p className="text-sm text-body">No addresses yet. Add one to start booking shipments.</p>
        ) : null}
      </div>
    </div>
  );
}
