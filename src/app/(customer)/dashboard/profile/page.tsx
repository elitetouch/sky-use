import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { ProfileForm } from "@/components/dashboard/ProfileForm";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Profile</h1>
      <p className="mt-1 text-body">Your personal details.</p>

      <div className="mt-6 max-w-xl rounded-2xl border border-black/5 p-6">
        <ProfileForm
          initialName={user?.name ?? ""}
          initialPhone={user?.phone ?? ""}
          email={user?.email ?? ""}
          ninVerified={user?.nin_verified ?? false}
        />
      </div>
    </div>
  );
}
