"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type Invitation = {
  name: string;
  email: string;
  role: string;
};

export function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInvitation = useCallback(async () => {
    if (!token) {
      setLoadError("This invitation link is missing its token.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/staff-invitations/${encodeURIComponent(token)}`);
      const json = await response.json();

      if (!response.ok) {
        setLoadError(json.message ?? "This invitation link is invalid or has expired.");
        return;
      }

      setInvitation(json.data);
    } catch {
      setLoadError("We couldn't load this invitation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInvitation();
  }, [loadInvitation]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/staff-invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "We couldn't accept this invitation.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-center text-sm text-body">Loading your invitation…</p>;
  }

  if (loadError) {
    return <div className="rounded-lg bg-red/10 px-4 py-3 text-sm text-red">{loadError}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-[#f5f5f7] px-4 py-3 text-sm text-body">
        <p>
          Joining as <span className="font-semibold capitalize text-navy">{invitation?.role}</span>
        </p>
        <p className="mt-0.5 text-navy">{invitation?.email}</p>
      </div>

      {error ? <div className="rounded-lg bg-red/10 px-4 py-3 text-sm text-red">{error}</div> : null}

      <Field
        label="Create a password"
        type="password"
        name="password"
        autoComplete="new-password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Field
        label="Confirm password"
        type="password"
        name="password_confirmation"
        autoComplete="new-password"
        required
        minLength={8}
        value={passwordConfirmation}
        onChange={(e) => setPasswordConfirmation(e.target.value)}
      />

      <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Setting up your account…" : "Accept & Continue"}
      </Button>
    </form>
  );
}
