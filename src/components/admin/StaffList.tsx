"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Role, Staff } from "@/lib/types";

export function StaffList({ initialStaff, roles }: { initialStaff: Staff[]; roles: Role[] }) {
  const router = useRouter();
  const [staff, setStaff] = useState(initialStaff);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!confirm("Revoke this staff member's access? This removes all their roles.")) return;

    setErrors((prev) => ({ ...prev, [id]: "" }));

    const response = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });

    if (response.status === 204) {
      router.refresh();
      setStaff((prev) =>
        prev.map((s) => (s.id === id ? { ...s, roles: [], status: "suspended" } : s)),
      );
      return;
    }

    const json = await response.json();
    setErrors((prev) => ({ ...prev, [id]: json.message ?? "Unable to revoke access." }));
  }

  return (
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
                  className="rounded-lg border border-black/10 px-2 py-1 text-sm text-navy outline-none focus:border-navy"
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
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    member.status === "active" ? "bg-navy/10 text-navy" : "bg-red/10 text-red"
                  }`}
                >
                  {member.status}
                </button>
              </td>
              <td className="px-5 py-4">
                <button onClick={() => revoke(member.id)} className="text-sm font-semibold text-red hover:text-red-light">
                  Revoke
                </button>
              </td>
            </tr>
          ))}

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
  );
}
