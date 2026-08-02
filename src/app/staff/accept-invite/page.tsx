import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AcceptInviteForm } from "@/components/auth/AcceptInviteForm";

export const metadata: Metadata = {
  title: "Accept Invitation",
};

export default function AcceptInvitePage() {
  return (
    <AuthCard title="Accept your invitation" subtitle="Set a password to finish joining the team.">
      <Suspense>
        <AcceptInviteForm />
      </Suspense>
    </AuthCard>
  );
}
