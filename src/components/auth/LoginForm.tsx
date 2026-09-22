"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";

type Challenge = { token: string; method: "totp" | "email" };

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Second step, only when the account has 2FA enabled.
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  function done() {
    router.push(searchParams.get("redirect") ?? "/dashboard");
    router.refresh();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Unable to log in. Please try again.");
        return;
      }

      if (json.two_factor_required) {
        setChallenge({ token: json.challenge_token, method: json.method });
        return;
      }

      done();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleChallenge(event: FormEvent) {
    event.preventDefault();
    if (!challenge) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/2fa/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_token: challenge.token, code: code.trim() }),
      });
      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "That code is invalid. Please try again.");
        return;
      }

      done();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resend() {
    if (!challenge) return;
    setResendMsg(null);
    setError(null);
    await fetch("/api/auth/2fa/challenge/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge_token: challenge.token }),
    });
    setResendMsg("A new code has been sent to your email.");
  }

  const justReset = searchParams.get("reset") === "1";

  if (challenge) {
    const showRecovery = challenge.method === "totp" && useRecovery;
    return (
      <form onSubmit={handleChallenge} className="space-y-5">
        <p className="text-center text-sm text-body">
          {challenge.method === "email"
            ? "We emailed you a 6-digit code. Enter it below to finish signing in."
            : showRecovery
              ? "Enter one of your recovery codes."
              : "Enter the 6-digit code from your authenticator app."}
        </p>

        {error ? <div className="rounded-lg bg-red/10 px-4 py-3 text-sm text-red">{error}</div> : null}
        {resendMsg ? <div className="rounded-lg bg-navy/5 px-4 py-3 text-sm text-navy">{resendMsg}</div> : null}

        {showRecovery ? (
          <Field
            label="Recovery code"
            type="text"
            name="code"
            autoComplete="off"
            autoFocus
            required
            placeholder="XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        ) : (
          <OtpInput value={code} onChange={setCode} autoFocus />
        )}

        <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting || code.trim() === ""}>
          {isSubmitting ? "Verifying…" : "Verify & sign in"}
        </Button>

        <div className="flex items-center justify-between text-sm">
          {challenge.method === "email" ? (
            <button type="button" onClick={resend} className="font-semibold text-navy hover:text-red">
              Resend code
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setUseRecovery((v) => !v);
                setCode("");
                setError(null);
              }}
              className="font-semibold text-navy hover:text-red"
            >
              {useRecovery ? "Use authenticator code" : "Use a recovery code"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setChallenge(null);
              setCode("");
              setUseRecovery(false);
              setError(null);
              setResendMsg(null);
            }}
            className="font-semibold text-body hover:text-navy"
          >
            Back
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {justReset ? (
        <div className="rounded-lg bg-navy/5 px-4 py-3 text-sm text-navy">
          Your password has been reset. Please log in with your new password.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg bg-red/10 px-4 py-3 text-sm text-red">{error}</div>
      ) : null}

      <Field
        label="Email address"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Field
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="text-right">
        <Link href="/forgot-password" className="text-sm font-semibold text-navy hover:text-red">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logging in…" : "Log In"}
      </Button>

      <p className="text-center text-sm text-body">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-navy hover:text-red">
          Sign up
        </Link>
      </p>
    </form>
  );
}
