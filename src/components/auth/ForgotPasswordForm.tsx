"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Something went wrong. Please try again.");
        return;
      }

      setStep("reset");
      setNotice(`If an account exists for ${email}, we've sent a 6-digit code. Check your inbox.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitReset(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "We couldn't reset your password.");
        return;
      }

      router.push("/login?reset=1");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "email") {
    return (
      <form onSubmit={requestCode} className="space-y-4">
        {error ? <div className="rounded-lg bg-red/10 px-4 py-3 text-sm text-red">{error}</div> : null}

        <Field
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending code…" : "Send reset code"}
        </Button>

        <p className="text-center text-sm text-body">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-navy hover:text-red">
            Back to log in
          </Link>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={submitReset} className="space-y-4">
      {notice ? <div className="rounded-lg bg-navy/5 px-4 py-3 text-sm text-navy">{notice}</div> : null}
      {error ? <div className="rounded-lg bg-red/10 px-4 py-3 text-sm text-red">{error}</div> : null}

      <Field
        label="6-digit code"
        type="text"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
      />
      <Field
        label="New password"
        type="password"
        name="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Field
        label="Confirm new password"
        type="password"
        name="password_confirmation"
        autoComplete="new-password"
        minLength={8}
        required
        value={passwordConfirmation}
        onChange={(e) => setPasswordConfirmation(e.target.value)}
      />

      <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Resetting…" : "Reset password"}
      </Button>

      <button
        type="button"
        onClick={() => {
          setStep("email");
          setError(null);
          setNotice(null);
        }}
        className="w-full text-center text-sm font-semibold text-navy hover:text-red"
      >
        Use a different email
      </button>
    </form>
  );
}
