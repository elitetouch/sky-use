"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatPhone } from "@/lib/phone";
import type { BusinessSetting } from "@/lib/types";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

export function BusinessSettingsManager({ initial }: { initial: BusinessSetting }) {
  const [rcNumber, setRcNumber] = useState(initial.rc_number ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [website, setWebsite] = useState(initial.website ?? "");
  const [phones, setPhones] = useState<string[]>(initial.phones.length > 0 ? initial.phones : [""]);

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updatePhone(index: number, value: string) {
    setPhones((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function addPhone() {
    setPhones((prev) => [...prev, ""]);
  }

  function removePhone(index: number) {
    setPhones((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rc_number: rcNumber || null,
          email: email || null,
          website: website || null,
          phones: phones.map((p) => p.trim()).filter((p) => p !== ""),
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Unable to save business details.");
        return;
      }

      setSaved(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-black/5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-navy">RC Number</label>
          <input value={rcNumber} onChange={(e) => setRcNumber(e.target.value)} placeholder="e.g. 2025885" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-navy">Business email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="info@skyfotsglobal.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-navy">Website</label>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="www.skyfotsglobal.com"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-navy">Phone numbers</label>
          <button
            type="button"
            onClick={addPhone}
            className="rounded-full border border-navy/20 px-3 py-1 text-xs font-semibold text-navy hover:bg-navy/5"
          >
            + Add phone
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {phones.map((phone, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={phone}
                onChange={(e) => updatePhone(index, e.target.value)}
                placeholder="08036141026"
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
              />
              <span className="w-44 shrink-0 text-xs text-body">
                {phone.trim() ? formatPhone(phone) : ""}
              </span>
              <button
                type="button"
                onClick={() => removePhone(index)}
                disabled={phones.length === 1}
                aria-label="Remove phone"
                className="rounded-lg px-2 py-1 text-sm font-semibold text-red hover:bg-red/5 disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-body/70">Shown on receipts as {formatPhone("08036141026")}.</p>
      </div>

      {error ? <p className="text-sm text-red">{error}</p> : null}
      {saved ? <p className="text-sm text-green-600">Saved.</p> : null}

      <Button type="submit" variant="accent" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save Business Details"}
      </Button>
    </form>
  );
}
