"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PricingRule } from "@/lib/types";

type CreateForm = {
  service_level: string;
  mode: string;
  base_fee_naira: string;
  per_kg_naira: string;
};

const EMPTY_FORM: CreateForm = { service_level: "standard", mode: "local", base_fee_naira: "", per_kg_naira: "" };

export function PricingRuleManager({ initialRules }: { initialRules: PricingRule[] }) {
  const router = useRouter();
  const [rules, setRules] = useState(initialRules);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [editValues, setEditValues] = useState<Record<string, { base: string; perKg: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function editValueFor(rule: PricingRule) {
    return editValues[rule.id] ?? { base: String(rule.base_fee_kobo / 100), perKg: String(rule.per_kg_kobo / 100) };
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/pricing-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_level: form.service_level,
          mode: form.mode,
          base_fee_kobo: Math.round(Number(form.base_fee_naira) * 100),
          per_kg_kobo: Math.round(Number(form.per_kg_naira) * 100),
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Unable to create pricing rule.");
        return;
      }

      setRules((prev) => [json.data, ...prev]);
      setShowForm(false);
      setForm(EMPTY_FORM);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(rule: PricingRule) {
    const values = editValueFor(rule);

    const response = await fetch(`/api/admin/pricing-rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base_fee_kobo: Math.round(Number(values.base) * 100),
        per_kg_kobo: Math.round(Number(values.perKg) * 100),
      }),
    });

    const json = await response.json();

    if (response.ok) {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? json.data : r)));
      router.refresh();
    }
  }

  async function toggleActive(rule: PricingRule) {
    const response = await fetch(`/api/admin/pricing-rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base_fee_kobo: rule.base_fee_kobo,
        per_kg_kobo: rule.per_kg_kobo,
        is_active: !rule.is_active,
      }),
    });

    const json = await response.json();

    if (response.ok) {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? json.data : r)));
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this pricing rule?")) return;

    const response = await fetch(`/api/admin/pricing-rules/${id}`, { method: "DELETE" });

    if (response.ok) {
      setRules((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    }
  }

  return (
    <div>
      {!showForm ? (
        <Button variant="accent" onClick={() => setShowForm(true)}>
          + Add Pricing Rule
        </Button>
      ) : (
        <form onSubmit={handleCreate} className="mt-4 space-y-4 rounded-2xl border border-black/5 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy">Service Level</label>
              <select
                value={form.service_level}
                onChange={(e) => setForm((p) => ({ ...p, service_level: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
              >
                <option value="standard">Standard</option>
                <option value="express">Express</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy">Mode</label>
              <select
                value={form.mode}
                onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
              >
                <option value="local">Local</option>
                <option value="international">International</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy">Base Fee (NGN)</label>
              <input
                type="number"
                min="0"
                required
                value={form.base_fee_naira}
                onChange={(e) => setForm((p) => ({ ...p, base_fee_naira: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy">Per Kg (NGN)</label>
              <input
                type="number"
                min="0"
                required
                value={form.per_kg_naira}
                onChange={(e) => setForm((p) => ({ ...p, per_kg_naira: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
              />
            </div>
          </div>

          {error ? <p className="text-sm text-red">{error}</p> : null}

          <div className="flex gap-3">
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Create Rule"}
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
              <th className="px-5 py-3">Service</th>
              <th className="px-5 py-3">Mode</th>
              <th className="px-5 py-3">Base Fee</th>
              <th className="px-5 py-3">Per Kg</th>
              <th className="px-5 py-3">Active</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rules.map((rule) => {
              const values = editValueFor(rule);
              return (
                <tr key={rule.id}>
                  <td className="px-5 py-4 font-semibold capitalize text-navy">{rule.service_level}</td>
                  <td className="px-5 py-4 capitalize text-body">{rule.mode}</td>
                  <td className="px-5 py-4">
                    <input
                      value={values.base}
                      onChange={(e) =>
                        setEditValues((prev) => ({ ...prev, [rule.id]: { ...values, base: e.target.value } }))
                      }
                      className="w-24 rounded-lg border border-black/10 px-2 py-1 text-sm text-navy outline-none focus:border-navy"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <input
                      value={values.perKg}
                      onChange={(e) =>
                        setEditValues((prev) => ({ ...prev, [rule.id]: { ...values, perKg: e.target.value } }))
                      }
                      className="w-24 rounded-lg border border-black/10 px-2 py-1 text-sm text-navy outline-none focus:border-navy"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleActive(rule)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        rule.is_active ? "bg-navy/10 text-navy" : "bg-red/10 text-red"
                      }`}
                    >
                      {rule.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-3 text-sm font-semibold">
                      <button onClick={() => handleUpdate(rule)} className="text-navy hover:text-red">
                        Save
                      </button>
                      <button onClick={() => handleDelete(rule.id)} className="text-red hover:text-red-light">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
