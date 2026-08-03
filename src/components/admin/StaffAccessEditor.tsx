"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PermissionGroup, Staff } from "@/lib/types";

export function StaffAccessEditor({
  member,
  permissionGroups,
  onUpdated,
}: {
  member: Staff;
  permissionGroups: PermissionGroup[];
  onUpdated: (updated: Staff) => void;
}) {
  const rolePermissions = new Set(member.role_permissions ?? []);
  const [selected, setSelected] = useState<Set<string>>(new Set(member.direct_permissions ?? []));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(value: string) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }

  async function save() {
    setError(null);
    setSaved(false);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/staff/${member.id}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: Array.from(selected) }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message ?? "Unable to update access.");
        return;
      }
      onUpdated(json.data);
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-xl bg-[#f7f7f8] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-body">
        App access for {member.name}
      </p>
      <p className="mt-1 text-xs text-body">
        Areas from the <span className="font-semibold capitalize">{member.roles[0] ?? "role"}</span> role
        are always on. Tick extra areas to grant this person direct access.
      </p>

      <div className="mt-3 space-y-4">
        {permissionGroups.map((group) => (
          <div key={group.group}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-body">
              {group.group}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.permissions.map((permission) => {
                const fromRole = rolePermissions.has(permission.value);
                const checked = fromRole || selected.has(permission.value);
                return (
                  <label
                    key={permission.value}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      fromRole ? "border-black/5 bg-black/[0.03] text-body" : "border-black/10 text-navy"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={fromRole}
                      onChange={() => toggle(permission.value)}
                    />
                    <span>
                      {permission.label}
                      {fromRole ? <span className="ml-1 text-xs text-body">(from role)</span> : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="mt-2 text-sm text-red">{error}</p> : null}

      <div className="mt-3 flex items-center gap-3">
        <Button type="button" variant="primary" disabled={isSaving} onClick={save}>
          {isSaving ? "Saving…" : "Save access"}
        </Button>
        {saved ? <span className="text-xs font-semibold text-green-700">Saved</span> : null}
      </div>
    </div>
  );
}
