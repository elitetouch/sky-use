import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser, isStaff } from "@/lib/session";
import { safeRedirectPath } from "@/lib/safe-redirect";

export const metadata: Metadata = {
  title: "Log In",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  // Already signed in with a valid session? Skip the form. (An expired cookie
  // returns null here, so the form shows instead of looping.)
  const user = await getCurrentUser().catch(() => null);
  if (user) {
    const { redirect: target } = await searchParams;
    redirect(safeRedirectPath(target, isStaff(user) ? "/admin" : "/dashboard"));
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in to manage your shipments.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
