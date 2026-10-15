"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Country } from "country-state-city";
import { Button } from "@/components/ui/Button";

export type RateCardDetail = {
  carrier: string;
  label: string;
  zones: { zone: number; countries: string[] }[];
  weights: number[];
  cells: { zone: number; weight_kg: number; price_kobo: number }[];
};

/** Stable string form of a weight, matching the API (0.50 → "0.5"). */
function wk(weight: number): string {
  return String(Number(weight.toFixed(2)));
}

function cellKey(zone: number, weight: number): string {
  return `${zone}|${wk(weight)}`;
}

function nairaText(kobo: number): string {
  return (kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Parse a typed price ("62,053.78", "₦62053") into kobo; blank → null; junk → NaN. */
function parseKobo(text: string): number | null {
  const clean = text.replace(/[^0-9.]/g, "");
  if (clean === "") return null;
  const value = Number(clean);
  return Number.isFinite(value) ? Math.round(value * 100) : Number.NaN;
}

function norm(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

export function CarrierRateCardEditor({
  carrier,
  initial,
  canManage,
}: {
  carrier: string;
  initial: RateCardDetail;
  canManage: boolean;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<RateCardDetail>(initial);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [extraWeights, setExtraWeights] = useState<number[]>([]);
  const [newWeight, setNewWeight] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countryEditor, setCountryEditor] = useState<{ zone: number; isNew: boolean } | null>(null);
  const fullUploadRef = useRef<HTMLInputElement | null>(null);
  const zoneUploadRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const original = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cell of detail.cells) map[cellKey(cell.zone, cell.weight_kg)] = cell.price_kobo;
    return map;
  }, [detail.cells]);

  const zones = detail.zones.map((z) => z.zone);

  const weights = useMemo(() => {
    const all = new Map<string, number>();
    for (const w of [...detail.weights, ...extraWeights]) all.set(wk(w), Number(wk(w)));
    return [...all.values()].sort((a, b) => a - b);
  }, [detail.weights, extraWeights]);

  // Which edited cells actually differ from what's saved.
  const dirty = useMemo(() => {
    const changes: { zone: number; weight_kg: number; price_kobo: number | null }[] = [];
    const invalid: string[] = [];
    for (const [key, text] of Object.entries(edits)) {
      const [zone, weight] = key.split("|");
      const kobo = parseKobo(text);
      if (Number.isNaN(kobo)) {
        invalid.push(key);
        continue;
      }
      const before = original[key] ?? null;
      if (kobo !== before) {
        changes.push({ zone: Number(zone), weight_kg: Number(weight), price_kobo: kobo });
      }
    }
    return { changes, invalid };
  }, [edits, original]);

  const hasUnsaved = dirty.changes.length > 0 || dirty.invalid.length > 0;

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!hasUnsaved) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  function flash(ok: string | null, err: string | null = null) {
    setMessage(ok);
    setError(err);
  }

  /** Replace local state with a fresh server rate card. */
  function applyDetail(next: RateCardDetail) {
    setDetail(next);
    setEdits({});
    setExtraWeights([]);
  }

  async function run(label: string, action: () => Promise<Response>, okText: string): Promise<boolean> {
    flash(null);
    setBusy(label);
    try {
      const res = await action();
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        flash(null, json.message ?? "Something went wrong.");
        return false;
      }
      if (json.data) applyDetail(json.data as RateCardDetail);
      flash(json.message ?? okText);
      router.refresh(); // keep the page header counts in sync
      return true;
    } catch {
      flash(null, "Network error — please try again.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  function save() {
    if (dirty.invalid.length > 0) {
      flash(null, "Some prices aren't valid numbers — fix the highlighted cells.");
      return;
    }
    const count = dirty.changes.length;
    void run(
      "save",
      () =>
        fetch(`/api/admin/carrier-pricing/${carrier}/rates`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cells: dirty.changes }),
        }),
      `Saved ${count} change${count === 1 ? "" : "s"}.`,
    );
  }

  function addWeight() {
    const value = Number(newWeight);
    if (!Number.isFinite(value) || value <= 0) {
      flash(null, "Enter a weight greater than 0.");
      return;
    }
    if (weights.some((w) => wk(w) === wk(value))) {
      flash(null, `${wk(value)} kg is already in the table.`);
      return;
    }
    setExtraWeights((prev) => [...prev, value]);
    setNewWeight("");
    flash(`Added ${wk(value)} kg — fill in its prices, then save.`);
  }

  function removeWeight(weight: number) {
    const hasSaved = zones.some((z) => original[cellKey(z, weight)] !== undefined);
    if (!hasSaved) {
      setExtraWeights((prev) => prev.filter((w) => wk(w) !== wk(weight)));
      setEdits((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.endsWith(`|${wk(weight)}`))));
      return;
    }
    if (!window.confirm(`Remove all prices for ${wk(weight)} kg? This takes effect when you save.`)) return;
    setEdits((prev) => {
      const next = { ...prev };
      for (const z of zones) next[cellKey(z, weight)] = "";
      return next;
    });
  }

  function uploadZone(zone: number) {
    const file = zoneUploadRefs.current[zone]?.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    void run(
      `zone-${zone}`,
      () => fetch(`/api/admin/carrier-pricing/${carrier}/zones/${zone}/rates`, { method: "POST", body: form }),
      `Zone ${zone} prices uploaded.`,
    ).finally(() => {
      const input = zoneUploadRefs.current[zone];
      if (input) input.value = "";
    });
  }

  function deleteZone(zone: number) {
    if (!window.confirm(`Delete Zone ${zone}? Its prices and countries will be removed. This can't be undone.`)) return;
    void run(
      `delete-${zone}`,
      () => fetch(`/api/admin/carrier-pricing/${carrier}/zones/${zone}`, { method: "DELETE" }),
      `Zone ${zone} deleted.`,
    );
  }

  function uploadFull() {
    const file = fullUploadRef.current?.files?.[0];
    if (!file) return;
    if (!window.confirm("Replace ALL prices for this carrier with this file? Zones not in the file will lose their prices.")) {
      if (fullUploadRef.current) fullUploadRef.current.value = "";
      return;
    }
    const form = new FormData();
    form.append("carrier", carrier);
    form.append("file", file);
    void run(
      "full",
      async () => {
        const res = await fetch("/api/admin/carrier-pricing", { method: "POST", body: form });
        if (!res.ok) return res;
        // The full upload returns counts, not the rate card — reload it.
        const fresh = await fetch(`/api/admin/carrier-pricing/${carrier}`);
        const json = await fresh.json();
        return new Response(JSON.stringify({ data: json.data, message: "Full rate card uploaded." }), {
          status: fresh.status,
        });
      },
      "Full rate card uploaded.",
    ).finally(() => {
      if (fullUploadRef.current) fullUploadRef.current.value = "";
    });
  }

  function clearAll() {
    if (!window.confirm(`Clear ALL prices for ${detail.label}? Zones and countries are kept. This can't be undone.`)) return;
    void run(
      "clear",
      () => fetch(`/api/admin/carrier-pricing/${carrier}/rates`, { method: "DELETE" }),
      "All prices cleared.",
    );
  }

  const nextZone = zones.length > 0 ? Math.max(...zones) + 1 : 1;
  const zoneOfCountry = useMemo(() => {
    const map: Record<string, number> = {};
    for (const z of detail.zones) for (const c of z.countries) map[norm(c)] = z.zone;
    return map;
  }, [detail.zones]);

  return (
    <div className="mt-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`/api/admin/carrier-pricing/${carrier}/export`}
          className="inline-flex items-center rounded-full border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-navy hover:text-white"
        >
          Download current rates (CSV)
        </a>
        {canManage ? (
          <>
            <Button type="button" variant="primary" onClick={() => setCountryEditor({ zone: nextZone, isNew: true })}>
              + Add zone
            </Button>
            <label className="inline-flex cursor-pointer items-center rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5">
              {busy === "full" ? "Uploading…" : "Upload full rate card"}
              <input ref={fullUploadRef} type="file" accept=".csv,text/csv" className="hidden" onChange={uploadFull} />
            </label>
            <button
              type="button"
              onClick={clearAll}
              disabled={busy === "clear" || detail.cells.length === 0}
              className="ml-auto rounded-full px-4 py-2 text-sm font-semibold text-red hover:bg-red/5 disabled:opacity-40"
            >
              {busy === "clear" ? "Clearing…" : "Clear all prices"}
            </button>
          </>
        ) : null}
      </div>

      <p className="text-xs text-body">
        Click any price to edit it, then <strong>Save changes</strong>. Use a zone&apos;s <strong>Upload</strong> to replace
        just that zone from a CSV with two columns: <code>KG, Price</code>. The download uses the same format as the full
        upload, so you can edit it in Excel and upload it back.
      </p>

      {message ? <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="rounded-lg bg-red/5 px-4 py-2 text-sm text-red">{error}</p> : null}

      {zones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-body">
          No zones yet. {canManage ? "Add a zone and choose its countries to start pricing." : null}
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-2xl border border-black/5 bg-white">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-20 border-b border-r border-black/5 bg-[#f5f5f5] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body">
                  Weight (kg)
                </th>
                {detail.zones.map((z) => (
                  <th
                    key={z.zone}
                    className="sticky top-0 z-10 min-w-[11rem] border-b border-black/5 bg-[#f5f5f5] px-3 py-2 text-left align-top"
                  >
                    <p className="text-sm font-bold text-navy">Zone {z.zone}</p>
                    <button
                      type="button"
                      onClick={() => setCountryEditor({ zone: z.zone, isNew: false })}
                      className={`mt-0.5 text-xs font-semibold hover:underline ${z.countries.length === 0 ? "text-amber-700" : "text-body"}`}
                      title={z.countries.join(", ") || "No countries — this zone can't be quoted yet"}
                    >
                      {z.countries.length === 0
                        ? "No countries ⚠"
                        : `${z.countries.length} countr${z.countries.length === 1 ? "y" : "ies"}`}
                    </button>
                    {canManage ? (
                      <div className="mt-1 flex gap-3 text-xs font-semibold">
                        <label className="cursor-pointer text-navy hover:underline">
                          {busy === `zone-${z.zone}` ? "Uploading…" : "Upload"}
                          <input
                            ref={(el) => {
                              zoneUploadRefs.current[z.zone] = el;
                            }}
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={() => uploadZone(z.zone)}
                          />
                        </label>
                        <button type="button" onClick={() => deleteZone(z.zone)} className="text-red hover:underline">
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weights.length === 0 ? (
                <tr>
                  <td colSpan={zones.length + 1} className="px-4 py-8 text-center text-sm text-body">
                    No prices yet.{" "}
                    {canManage ? "Add a weight row below, upload a zone, or upload a full rate card." : null}
                  </td>
                </tr>
              ) : null}
              {weights.map((weight) => (
                <tr key={wk(weight)} className="group">
                  <td className="sticky left-0 z-10 border-b border-r border-black/5 bg-white px-4 py-1.5 font-semibold text-navy group-hover:bg-[#fafafa]">
                    <div className="flex items-center justify-between gap-2">
                      <span>{wk(weight)}</span>
                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => removeWeight(weight)}
                          className="text-xs text-body opacity-0 hover:text-red group-hover:opacity-100"
                          aria-label={`Remove ${wk(weight)} kg`}
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                  </td>
                  {zones.map((zone) => {
                    const key = cellKey(zone, weight);
                    const saved = original[key];
                    const value = edits[key] ?? (saved !== undefined ? nairaText(saved) : "");
                    const parsed = edits[key] !== undefined ? parseKobo(edits[key]) : (saved ?? null);
                    const isInvalid = Number.isNaN(parsed);
                    const isDirty = edits[key] !== undefined && !isInvalid && parsed !== (saved ?? null);
                    return (
                      <td key={key} className="border-b border-black/5 px-1.5 py-1 group-hover:bg-[#fafafa]">
                        <input
                          value={value}
                          readOnly={!canManage}
                          inputMode="decimal"
                          placeholder="—"
                          onChange={(e) => setEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                          className={`w-full rounded-md border px-2 py-1 text-right text-sm tabular-nums text-navy outline-none focus:border-navy ${
                            isInvalid
                              ? "border-red bg-red/5"
                              : isDirty
                                ? "border-amber-300 bg-amber-50"
                                : "border-transparent hover:border-black/10"
                          }`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canManage && zones.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addWeight();
              }
            }}
            type="number"
            min="0.01"
            step="0.5"
            placeholder="e.g. 75"
            className="w-32 rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
          />
          <Button type="button" variant="ghost" onClick={addWeight}>
            + Add weight row
          </Button>
        </div>
      ) : null}

      {/* Sticky save bar */}
      {canManage && hasUnsaved ? (
        <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-lg">
          <p className="text-sm text-navy">
            <strong>{dirty.changes.length}</strong> unsaved change{dirty.changes.length === 1 ? "" : "s"}
            {dirty.invalid.length > 0 ? (
              <span className="ml-2 text-red">· {dirty.invalid.length} invalid</span>
            ) : null}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEdits({});
                setExtraWeights([]);
                flash("Changes discarded.");
              }}
              disabled={busy === "save"}
            >
              Discard
            </Button>
            <Button type="button" variant="accent" onClick={save} disabled={busy === "save"}>
              {busy === "save" ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      ) : null}

      {countryEditor ? (
        <ZoneCountriesDialog
          zone={countryEditor.zone}
          isNew={countryEditor.isNew}
          readOnly={!canManage}
          current={detail.zones.find((z) => z.zone === countryEditor.zone)?.countries ?? []}
          zoneOfCountry={zoneOfCountry}
          busy={busy === "countries"}
          onClose={() => setCountryEditor(null)}
          onSave={(countries) => {
            const zone = countryEditor.zone;
            void run(
              "countries",
              () =>
                fetch(`/api/admin/carrier-pricing/${carrier}/zones/${zone}/countries`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ countries }),
                }),
              countryEditor.isNew ? `Zone ${zone} added — now fill in its prices.` : `Zone ${zone} countries updated.`,
            ).then((ok) => {
              if (ok) setCountryEditor(null);
            });
          }}
        />
      ) : null}
    </div>
  );
}

function ZoneCountriesDialog({
  zone,
  isNew,
  readOnly,
  current,
  zoneOfCountry,
  busy,
  onClose,
  onSave,
}: {
  zone: number;
  isNew: boolean;
  readOnly: boolean;
  current: string[];
  zoneOfCountry: Record<string, number>;
  busy: boolean;
  onClose: () => void;
  onSave: (countries: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(current));

  // Full country list, plus any current names not in it (kept as-is).
  const options = useMemo(() => {
    const names = new Map<string, string>();
    for (const c of Country.getAllCountries()) names.set(norm(c.name), c.name);
    for (const c of current) if (!names.has(norm(c))) names.set(norm(c), c);
    return [...names.values()].sort((a, b) => a.localeCompare(b));
  }, [current]);

  const visible = options.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));
  const chosen = [...selected].sort((a, b) => a.localeCompare(b));
  const moving = chosen.filter((name) => {
    const other = zoneOfCountry[norm(name)];
    return other !== undefined && other !== zone;
  });

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
        <div className="border-b border-black/5 p-5">
          <p className="text-lg font-bold text-navy">{isNew ? `Add Zone ${zone}` : `Zone ${zone} countries`}</p>
          <p className="mt-1 text-sm text-body">
            {readOnly
              ? "Countries priced at this zone's rates."
              : "Tick the destination countries priced at this zone's rates."}
          </p>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries…"
            className="mt-3 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
          />
          <div className="mt-3 flex h-16 flex-wrap content-start gap-1.5 overflow-y-auto">
            {chosen.length === 0 ? (
              <p className="text-xs text-body">No countries selected yet.</p>
            ) : null}
            {chosen.map((name) => (
                <span key={name} className="inline-flex items-center gap-1 rounded-full bg-navy/10 px-2.5 py-1 text-xs font-semibold text-navy">
                  {name}
                  {!readOnly ? (
                    <button type="button" onClick={() => toggle(name)} aria-label={`Remove ${name}`} className="hover:text-red">
                      ✕
                    </button>
                  ) : null}
                </span>
              ))}
          </div>
        </div>

        <ul className="flex-1 divide-y divide-black/5 overflow-y-auto">
          {visible.map((name) => {
            const other = zoneOfCountry[norm(name)];
            const inOther = other !== undefined && other !== zone;
            return (
              <li key={name}>
                <label className="flex cursor-pointer items-center justify-between gap-3 px-5 py-2.5 text-sm hover:bg-[#f7f7f8]">
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(name)}
                      disabled={readOnly}
                      onChange={() => toggle(name)}
                    />
                    <span className="text-navy">{name}</span>
                  </span>
                  {inOther ? <span className="text-xs text-body">in Zone {other}</span> : null}
                </label>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 p-4">
          <p className="text-xs text-body">
            {chosen.length} selected
            {moving.length > 0 ? (
              <span className="text-amber-700"> · {moving.length} will move from another zone</span>
            ) : null}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
              {readOnly ? "Close" : "Cancel"}
            </Button>
            {!readOnly ? (
              <Button type="button" variant="primary" onClick={() => onSave(chosen)} disabled={busy || (isNew && chosen.length === 0)}>
                {busy ? "Saving…" : isNew ? "Create zone" : "Save countries"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
