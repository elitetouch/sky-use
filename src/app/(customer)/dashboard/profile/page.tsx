import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { NinFaceVerify } from "@/components/identity/NinFaceVerify";
import { VerifiedBadge } from "@/components/identity/VerifiedBadge";
import { NinReveal } from "@/components/identity/NinReveal";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const ninVerified = user?.nin_verified ?? false;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Profile</h1>
      <p className="mt-1 text-body">Your personal details.</p>

      <div className="mt-6 max-w-xl rounded-2xl border border-black/5 p-6">
        <ProfileForm
          initialName={user?.name ?? ""}
          initialPhone={user?.phone ?? ""}
          email={user?.email ?? ""}
          ninVerified={ninVerified}
        />
      </div>

      <div className="mt-6 max-w-xl rounded-2xl border border-black/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-navy">Identity verification (NIN)</h2>
          {ninVerified ? (
            <VerifiedBadge />
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-yellow/15 px-2 py-0.5 text-xs font-semibold text-yellow-700">
              Not verified
            </span>
          )}
        </div>

        {ninVerified ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-body">Your NIN</p>
            <div className="mt-1">
              <NinReveal nin={user?.nin ?? user?.nin_masked} />
            </div>
            <p className="mt-2 text-sm text-body">
              Your identity is verified. Tap the eye to reveal or hide your NIN.
            </p>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-body">
              Verify your NIN with a quick live photo to start booking shipments. Once verified, your name is
              locked to your verified identity.
            </p>
            <div className="mt-4">
              <NinFaceVerify refreshOnVerify />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
