"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useDialog } from "@/components/ui/DialogProvider";

type Service = {
  id: string;
  key: string;
  name: string;
  admin_name: string;
  delivery_estimate: string | null;
  sort_order: number;
  is_active: boolean;
  rate_cells: number;
};

type Draft = {
  name: string;
  admin_name: string;
  delivery_estimate: string;
  is_active: boolean;
};

const EMPTY_DRAFT: Draft = { name: "", admin_name: "", delivery_estimate: "", is_active: true };

export function ServicesManager({ canManage }: { canManage: boolean }) {
  const dialog = useDialog();
  const [rows, setRows] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // null = closed; "new" = create; otherwise the service being edited.
  const [editing, setEditing] = useState<Service | "new" | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/services");
      const json = await res.json();
      setRows(Array.isArray(json.data) ? json.data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;

    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next); // optimistic

    const res = await fetch("/api/admin/services/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((r) => r.id) }),
    });
    const json = await res.json();
    if (res.ok && Array.isArray(json.data)) {
      setRows(json.data);
    } else {
      load(); // revert to server truth
    }
  }

  async function toggleActive(service: Service) {
    setBusyId(service.id);
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !service.is_active }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setRows((prev) => prev.map((r) => (r.id === service.id ? json.data : r)));
      } else {
        await dialog.alert({ title: "Couldn't update", message: json.message ?? "Please try again." });
      }
    } finally {
      setBusyId(null);
    }
  }

  async function remove(service: Service) {
    const ok = await dialog.confirm({
      title: `Delete ${service.name}?`,
      message: (
        <>
          This removes the service and its entire rate card. Existing shipments keep their label. This can&apos;t be
          undone.
        </>
      ),
      confirmLabel: "Delete service",
      tone: "danger",
    });
    if (!ok) return;

    setBusyId(service.id);
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== service.id));
      } else {
        await dialog.alert({ title: "Couldn't delete", message: json.message ?? "Please try again." });
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-black/5 bg-navy/[0.03] p-5 text-sm text-body">
        <p className="font-semibold text-navy">About services</p>
        <p className="mt-1">
          These are the shipping options customers choose from, shown in the order below. Each service has a{" "}
          <strong>customer name</strong> and an <strong>internal name</strong> (what staff see, e.g. the carrier). A new
          service shows <em>&ldquo;Price not available&rdquo;</em> until you upload its rate card.
        </p>
      </div>

      {canManage ? (
        <div className="flex justify-end">
          <Button type="button" variant="primary" onClick={() => setEditing("new")}>
            + New service
          </Button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-body">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f5f5f5] text-xs uppercase tracking-wide text-body">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer name</th>
                <th className="px-4 py-3">Internal name</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3">Pricing</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rows.map((row, i) => (
                <tr key={row.id} className={`hover:bg-[#f5f5f5] ${row.is_active ? "" : "opacity-60"}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={!canManage || i === 0}
                        onClick={() => move(i, -1)}
                        className="rounded px-1.5 py-0.5 text-body hover:bg-black/5 disabled:opacity-30"
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={!canManage || i === rows.length - 1}
                        onClick={() => move(i, 1)}
                        className="rounded px-1.5 py-0.5 text-body hover:bg-black/5 disabled:opacity-30"
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-navy">{row.name}</td>
                  <td className="px-4 py-3 text-body">{row.admin_name}</td>
                  <td className="px-4 py-3 text-body">{row.delivery_estimate ?? "—"}</td>
                  <td className="px-4 py-3">
                    {row.rate_cells > 0 ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {row.rate_cells} rates
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        No price
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canManage ? (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => toggleActive(row)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          row.is_active ? "bg-green-100 text-green-700" : "bg-black/5 text-body"
                        }`}
                      >
                        {row.is_active ? "Active" : "Hidden"}
                      </button>
                    ) : (
                      <span className="text-xs text-body">{row.is_active ? "Active" : "Hidden"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <Link
                        href={`/admin/carrier-pricing/${row.key}`}
                        className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-black/5"
                      >
                        {canManage ? "Manage rates" : "View rates"}
                      </Link>
                      {canManage ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditing(row)}
                            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-black/5"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => remove(row)}
                            className="rounded-full border border-red/20 px-3 py-1.5 text-xs font-semibold text-red hover:bg-red/5 disabled:opacity-40"
                          >
                            Delete
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-body">
                    No services yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <ServiceFormModal
          service={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setRows((prev) => {
              const exists = prev.some((r) => r.id === saved.id);
              return exists ? prev.map((r) => (r.id === saved.id ? saved : r)) : [...prev, saved];
            });
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

function ServiceFormModal({
  service,
  onClose,
  onSaved,
}: {
  service: Service | null;
  onClose: () => void;
  onSaved: (service: Service) => void;
}) {
  const isEdit = service !== null;
  const [draft, setDraft] = useState<Draft>(
    service
      ? {
          name: service.name,
          admin_name: service.admin_name ?? "",
          delivery_estimate: service.delivery_estimate ?? "",
          is_active: service.is_active,
        }
      : EMPTY_DRAFT,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/services/${service.id}` : "/api/admin/services";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          admin_name: draft.admin_name.trim() || null,
          delivery_estimate: draft.delivery_estimate.trim() || null,
          is_active: draft.is_active,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Couldn't save the service.");
        return;
      }
      onSaved(json.data);
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        method="post"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-bold text-navy">{isEdit ? "Edit service" : "New service"}</h2>

        <div>
          <label className="mb-1 block text-xs font-semibold text-body">Customer name</label>
          <input
            className={field}
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="SkyFots UK Air Cargo"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-body">Internal name (staff only)</label>
          <input
            className={field}
            value={draft.admin_name}
            onChange={(e) => setDraft((d) => ({ ...d, admin_name: e.target.value }))}
            placeholder="SkyFots UK Air Cargo (DHL)"
          />
          <p className="mt-1 text-xs text-body">What staff see in booking/admin. Leave blank to match the customer name.</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-body">Delivery estimate</label>
          <input
            className={field}
            value={draft.delivery_estimate}
            onChange={(e) => setDraft((d) => ({ ...d, delivery_estimate: e.target.value }))}
            placeholder="Within 7-10 business days"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-navy">
          <input
            type="checkbox"
            checked={draft.is_active}
            onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.checked }))}
          />
          Show to customers
        </label>

        {error ? <p className="text-sm text-red">{error}</p> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create service"}
          </Button>
        </div>
      </form>
    </div>
  );
}
