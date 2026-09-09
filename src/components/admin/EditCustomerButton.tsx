"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { User } from "@/lib/types";

const inputClass =
  "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

export function EditCustomerButton({ customer }: { customer: User }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: customer.name,
    email: customer.email,
    phone: customer.phone ?? "",
    status: customer.status,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          status: form.status,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message ?? "Unable to update customer.");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-navy hover:text-red"
      >
        Edit
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !saving && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-navy">Edit customer</h2>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-navy">Full name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy">Phone</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy">Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {error ? <p className="mt-3 text-sm text-red">{error}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" variant="accent" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
