import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { TwoFactorSettings } from "@/components/dashboard/TwoFactorSettings";

export const metadata: Metadata = {
  title: "Security",
};

export default async function SecurityPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Security</h1>
      <p className="mt-1 text-body">Protect your account with two-factor authentication.</p>

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
