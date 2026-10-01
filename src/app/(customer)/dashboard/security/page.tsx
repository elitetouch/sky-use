import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { TwoFactorSettings } from "@/components/dashboard/TwoFactorSettings";
import { NinVerify } from "@/components/identity/NinVerify";
import { VerifiedBadge } from "@/components/identity/VerifiedBadge";

export const metadata: Metadata = {
  title: "Security",
};

export default async function SecurityPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Security</h1>
      <p className="mt-1 text-body">Protect your account and verify your identity.</p>

      <div className="mt-6 max-w-3xl rounded-2xl border border-black/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-navy">Identity verification (NIN)</h2>
          {user?.nin_verified ? <VerifiedBadge /> : null}
        </div>
        <p className="mt-1 text-sm text-body">
          {user?.nin_verified
            ? "Your National Identification Number has been verified."
            : "Verify your National Identification Number to secure your account."}
        </p>
        {!user?.nin_verified ? (
          <div className="mt-4">
            <NinVerify refreshOnVerify />
          </div>
        ) : null}
      </div>

      <div className="mt-6 max-w-3xl rounded-2xl border border-black/5 p-6">
        <h2 className="text-lg font-bold text-navy">Two-factor authentication</h2>
        <p className="mt-1 text-sm text-body">
          Require a second step when you sign in, using an authenticator app or a code emailed to you.
        </p>
        <div className="mt-5">
          <TwoFactorSettings
            enabled={user?.two_factor_enabled ?? false}
            method={user?.two_factor_method ?? null}
          />
        </div>
      </div>
    </div>
  );
}
