import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentUser, isStaff } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default async function RegisterPage() {
  // Already signed in with a valid session? Go to the app instead.
  const user = await getCurrentUser().catch(() => null);
  if (user) {
    redirect(isStaff(user) ? "/admin" : "/dashboard");
  }

  return (
    <AuthCard title="Create your account" subtitle="Book and track shipments in minutes.">
      <RegisterForm />
    </AuthCard>
  );
}
