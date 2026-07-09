"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { Role, StaffInvitation } from "@/lib/types";

export function InvitationManager({
  initialInvitations,
  roles,
}: {
  initialInvitations: StaffInvitation[];
  roles: Role[];
}) {
  const router = useRouter();
  const [invitations, setInvitations] = useState(initialInvitations);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(roles[0]?.name ?? "support");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/staff-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Unable to send invitation.");
        setErrors(json.errors ?? {});
        return;
      }

      setInvitations((prev) => [json.data, ...prev]);
      setName("");
      setEmail("");
      setShowForm(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend(id: string) {
    const response = await fetch(`/api/admin/staff-invitations/${id}/resend`, { method: "POST" });
    const json = await response.json();

    if (response.ok) {
      setInvitations((prev) => prev.map((i) => (i.id === id ? json.data : i)));
      router.refresh();
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this invitation?")) return;

    const response = await fetch(`/api/admin/staff-invitations/${id}`, { method: "DELETE" });

    if (response.ok) {
      setInvitations((prev) => prev.filter((i) => i.id !== id));
      router.refresh();
    }
  }

  return (
    <div>
      {!showForm ? (
        <Button variant="accent" onClick={() => setShowForm(true)}>
          + Invite Staff
        </Button>
      ) : (
        <form onSubmit={handleInvite} className="mt-4 space-y-4 rounded-2xl border border-black/5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name?.[0]}
            />
            <Field
              label="Email address"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email?.[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
            >
              {roles.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {error ? <p className="text-sm text-red">{error}</p> : null}

          <div className="flex gap-3">
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send Invitation"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/5">
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
            {invitations.map((invitation) => (
              <tr key={invitation.id}>
                <td className="px-5 py-4 font-semibold text-navy">{invitation.name}</td>
                <td className="px-5 py-4 text-body">{invitation.email}</td>
                <td className="px-5 py-4 capitalize text-body">{invitation.role}</td>
                <td className="px-5 py-4">
                  {invitation.accepted_at ? (
                    <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-semibold text-navy">
                      Accepted
                    </span>
                  ) : invitation.is_expired ? (
                    <span className="rounded-full bg-red/10 px-3 py-1 text-xs font-semibold text-red">Expired</span>
                  ) : (
                    <span className="rounded-full bg-yellow/20 px-3 py-1 text-xs font-semibold text-navy">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  {!invitation.accepted_at ? (
                    <div className="flex gap-3 text-sm font-semibold">
                      <button onClick={() => handleResend(invitation.id)} className="text-navy hover:text-red">
                        Resend
                      </button>
                      <button onClick={() => handleRevoke(invitation.id)} className="text-red hover:text-red-light">
                        Revoke
                      </button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}

            {invitations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-sm text-body">
                  No invitations sent yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
