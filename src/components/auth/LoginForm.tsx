"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      router.push(searchParams.get("redirect") ?? "/dashboard");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
