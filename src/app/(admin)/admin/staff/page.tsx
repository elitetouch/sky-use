import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { getSessionToken, getCurrentUser, can } from "@/lib/session";
import type { PermissionGroup, Role, Staff, StaffInvitation } from "@/lib/types";
import { StaffList } from "@/components/admin/StaffList";
import { InvitationManager } from "@/components/admin/InvitationManager";
import { NoAccess } from "@/components/admin/NoAccess";

export const metadata: Metadata = {
  title: "Staff",
};

export default async function AdminStaffPage() {
  if (!can(await getCurrentUser(), "staff.view")) {
    return <NoAccess area="staff" />;
  }
  const token = await getSessionToken();
  const [staff, invitations, roles, permissionGroups] = await Promise.all([
    apiFetch<Staff[]>("/admin/staff", { token: token! }),
    apiFetch<StaffInvitation[]>("/admin/staff-invitations", { token: token! }),
    apiFetch<Role[]>("/admin/roles", { token: token! }),
    apiFetch<PermissionGroup[]>("/admin/permissions", { token: token! }).catch(() => [] as PermissionGroup[]),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Staff</h1>
      <p className="mt-1 text-body">Manage team access and permissions.</p>

      <div className="mt-6">
        <StaffList initialStaff={staff} roles={roles} permissionGroups={permissionGroups} />
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
