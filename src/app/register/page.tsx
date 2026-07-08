import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function RegisterPage() {
  return (
    <AuthCard title="Create your account" subtitle="Book and track shipments in minutes.">
      <RegisterForm />
    </AuthCard>
  );
}
