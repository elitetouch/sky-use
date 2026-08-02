import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset your password" subtitle="We'll email you a code to reset it.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
