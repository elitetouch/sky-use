"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VerifiedBadge } from "./VerifiedBadge";

/**
 * NIN entry + Verify button. On success it shows the Verified badge. Pass an
 * `addressId` to attach the result to a saved address; omit it for the
 * customer's own identity. Verification is cache-first on the API, so a NIN
 * that's already verified comes back instantly without re-charging Prembly.
 */
export function NinVerify({
  addressId,
  userId,
  name,
  verified: initialVerified = false,
  refreshOnVerify = false,
  onVerified,
}: {
  addressId?: string;
  /** An existing customer to store the verification on (admin only). */
  userId?: string;
  /** Explicit name to match the NIN against (e.g. the sender's typed name). */
  name?: string;
  verified?: boolean;
  refreshOnVerify?: boolean;
  onVerified?: (name: string) => void;
}) {
  const router = useRouter();
  const [verified, setVerified] = useState(initialVerified);
  const [nin, setNin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (verified) {
    return <VerifiedBadge />;
  }

  async function verify() {
    setError(null);
    const value = nin.trim();
    if (!/^\d{11}$/.test(value)) {
      setError("Enter the 11-digit NIN.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/identity/nin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nin: value,
          address_id: addressId,
          user_id: userId || undefined,
          name: name || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "We couldn't verify that NIN.");
        return;
      }
      setVerified(true);
      onVerified?.(json.data?.name ?? "");
      if (refreshOnVerify) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={nin}
          onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
          inputMode="numeric"
          placeholder="Enter 11-digit NIN"
          className="w-48 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <button
          type="button"
          onClick={verify}
          disabled={busy || nin.trim().length !== 11}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50"
        >
          {busy ? "Verifying…" : "Verify NIN"}
        </button>
      </div>
      {error ? <p className="mt-1 text-xs text-red">{error}</p> : null}
    </div>
  );
}
