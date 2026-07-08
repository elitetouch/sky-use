import { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f5f5] px-4 py-12">
      <Logo className="mb-8" />
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        <p className="mt-1 text-sm text-body">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
