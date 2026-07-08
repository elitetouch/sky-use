"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type FieldErrors = Record<string, string[]>;

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await response.json();

      if (!response.ok) {
        setFormError(json.message ?? "Unable to create your account.");
        setErrors(json.errors ?? {});
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError ? (
        <div className="rounded-lg bg-red/10 px-4 py-3 text-sm text-red">{formError}</div>
      ) : null}

      <Field
        label="Full name"
        name="name"
        autoComplete="name"
        required
        value={form.name}
        onChange={update("name")}
        error={errors.name?.[0]}
      />
      <Field
        label="Email address"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={form.email}
        onChange={update("email")}
        error={errors.email?.[0]}
      />
      <Field
        label="Phone number"
        type="tel"
        name="phone"
        autoComplete="tel"
        placeholder="+234..."
        value={form.phone}
        onChange={update("phone")}
        error={errors.phone?.[0]}
      />
      <Field
        label="Password"
        type="password"
        name="password"
        autoComplete="new-password"
        required
        value={form.password}
        onChange={update("password")}
        error={errors.password?.[0]}
      />
      <Field
        label="Confirm password"
        type="password"
        name="password_confirmation"
        autoComplete="new-password"
        required
        value={form.password_confirmation}
        onChange={update("password_confirmation")}
      />

      <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create Account"}
      </Button>

      <p className="text-center text-sm text-body">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-navy hover:text-red">
          Log in
        </Link>
      </p>
    </form>
  );
}
