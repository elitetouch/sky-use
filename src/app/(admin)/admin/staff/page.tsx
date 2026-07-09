import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { Role, Staff, StaffInvitation } from "@/lib/types";
import { StaffList } from "@/components/admin/StaffList";
import { InvitationManager } from "@/components/admin/InvitationManager";

export const metadata: Metadata = {
  title: "Staff",
};

export default async function AdminStaffPage() {
  const token = await getSessionToken();
  const [staff, invitations, roles] = await Promise.all([
    apiFetch<Staff[]>("/admin/staff", { token: token! }),
    apiFetch<StaffInvitation[]>("/admin/staff-invitations", { token: token! }),
    apiFetch<Role[]>("/admin/roles", { token: token! }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Staff</h1>
      <p className="mt-1 text-body">Manage team access and permissions.</p>

      <div className="mt-6">
        <StaffList initialStaff={staff} roles={roles} />
      </div>

      <div className="mt-10">
        <p className="text-sm font-semibold text-navy">Invitations</p>
        <div className="mt-3">
          <InvitationManager initialInvitations={invitations} roles={roles} />
        </div>
      </div>
    </div>
  );
}
