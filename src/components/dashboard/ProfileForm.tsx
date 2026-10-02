"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { VerifiedBadge } from "@/components/identity/VerifiedBadge";

export function ProfileForm({
  initialName,
  initialPhone,
  email,
  ninVerified,
}: {
  initialName: string;
  initialPhone: string;
  email: string;
  ninVerified: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Couldn't update your profile.");
        return;
      }
      setMessage("Profile updated.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-navy">Full name</label>
          {ninVerified ? <VerifiedBadge /> : null}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={ninVerified}
          required
          className="mt-1.5 w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm text-navy outline-none focus:border-navy disabled:bg-black/[0.04] disabled:text-body"
        />
        <p className="mt-1 text-xs text-body">
          {ninVerified
            ? "Your name is locked because your identity (NIN) has been verified."
            : "You can change your name until you verify your NIN."}
        </p>
      </div>

      <Field label="Phone" type="tel" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />

      <div>
        <label className="block text-sm font-semibold text-navy">Email</label>
        <input
          value={email}
          disabled
          className="mt-1.5 w-full rounded-lg border border-black/10 bg-black/[0.04] px-4 py-2.5 text-sm text-body outline-none"
        />
      </div>

      {error ? <p className="text-sm text-red">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
