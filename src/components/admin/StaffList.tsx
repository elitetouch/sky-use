"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PermissionGroup, Role, Staff } from "@/lib/types";
import { StaffAccessEditor } from "@/components/admin/StaffAccessEditor";

export function StaffList({
  initialStaff,
  roles,
  permissionGroups,
}: {
  initialStaff: Staff[];
  roles: Role[];
  permissionGroups: PermissionGroup[];
}) {
  const router = useRouter();
  const [staff, setStaff] = useState(initialStaff);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Keep the list in sync with fresh server data after router.refresh().
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStaff(initialStaff);
  }, [initialStaff]);

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice((current) => (current === message ? null : current)), 4000);
  }

  async function changeRole(id: string, role: string) {
    setErrors((prev) => ({ ...prev, [id]: "" }));

    const response = await fetch(`/api/admin/staff/${id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    const json = await response.json();

    if (!response.ok) {
      setErrors((prev) => ({ ...prev, [id]: json.message ?? "Unable to change role." }));
      return;
    }

    setStaff((prev) => prev.map((s) => (s.id === id ? json.data : s)));
    router.refresh();
  }

  async function toggleStatus(member: Staff) {
    setErrors((prev) => ({ ...prev, [member.id]: "" }));
    const action = member.status === "active" ? "suspend" : "reactivate";

    const response = await fetch(`/api/admin/staff/${member.id}/${action}`, { method: "PATCH" });
    const json = await response.json();

    if (!response.ok) {
      setErrors((prev) => ({ ...prev, [member.id]: json.message ?? `Unable to ${action}.` }));
      return;
    }

    setStaff((prev) => prev.map((s) => (s.id === member.id ? json.data : s)));
    router.refresh();
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this staff member? This deletes their account and lets the email be invited again.")) return;

    setErrors((prev) => ({ ...prev, [id]: "" }));

    const response = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });

    if (response.status === 204) {
      setStaff((prev) => prev.filter((s) => s.id !== id));
      flash("Staff access revoked.");
      router.refresh();
      return;
    }

    const json = await response.json();
    setErrors((prev) => ({ ...prev, [id]: json.message ?? "Unable to revoke access." }));
  }

  return (
    <div>
      {notice ? (
        <div className="mb-3 rounded-lg bg-navy/5 px-4 py-3 text-sm font-semibold text-navy">
          {notice}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-black/5">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#f5f5f5] text-xs uppercase tracking-wide text-body">
          <tr>
            <th className="px-5 py-3">Name</th>
            <th className="px-5 py-3">Email</th>
            <th className="px-5 py-3">Role</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {staff.map((member) => (
            <tr key={member.id}>
              <td className="px-5 py-4 font-semibold text-navy">{member.name}</td>
              <td className="px-5 py-4 text-body">{member.email}</td>
              <td className="px-5 py-4">
                <select
                  value={member.roles[0] ?? ""}
                  onChange={(e) => changeRole(member.id, e.target.value)}
                  className="cursor-pointer rounded-lg border border-black/10 px-2 py-1 text-sm capitalize text-navy outline-none focus:border-navy"
                >
                  {roles.map((role) => (
                    <option key={role.name} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
                {errors[member.id] ? <p className="mt-1 text-xs text-red">{errors[member.id]}</p> : null}
              </td>
              <td className="px-5 py-4">
                <button
                  onClick={() => toggleStatus(member)}
                  className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    member.status === "active" ? "bg-navy/10 text-navy" : "bg-red/10 text-red"
                  }`}
                >
                  {member.status}
                </button>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setExpandedId((prev) => (prev === member.id ? null : member.id))}
                    className="cursor-pointer text-sm font-semibold text-navy hover:text-red"
                  >
                    {expandedId === member.id ? "Close" : "Access"}
                  </button>
                  <button
                    onClick={() => revoke(member.id)}
                    className="cursor-pointer text-sm font-semibold text-red hover:text-red-light"
                  >
                    Revoke
                  </button>
                </div>
              </td>
            </tr>
          )).flatMap((row, index) => {
            const member = staff[index];
            if (expandedId !== member.id) return [row];
            return [
              row,
              <tr key={`${member.id}-access`} className="bg-[#fafafa]">
                <td colSpan={5} className="px-5 py-4">
                  <StaffAccessEditor
                    member={member}
                    permissionGroups={permissionGroups}
                    onUpdated={(updated) =>
                      setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
                    }
                  />
                </td>
              </tr>,
            ];
          })}

          {staff.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-5 py-6 text-sm text-body">
                No staff members yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      </div>
    </div>
  );
}
