"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type CarrierSummary = {
  carrier: string;
  label: string;
  countries: number;
  zones: number;
  rate_cells: number;
};

export function CarrierPricingManager({ canManage }: { canManage: boolean }) {
  const [rows, setRows] = useState<CarrierSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/carrier-pricing");
      const json = await res.json();
      setRows(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetching the summary on mount is the intended behaviour here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  async function upload(carrier: string) {
    setMessage(null);
    setError(null);
    const input = fileRefs.current[carrier];
    const file = input?.files?.[0];
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }

    setBusy(carrier);
    try {
      const form = new FormData();
      form.append("carrier", carrier);
      form.append("file", file);
      const res = await fetch("/api/admin/carrier-pricing", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Upload failed.");
        return;
      }
      setMessage(json.message ?? "Rates uploaded.");
      if (input) input.value = "";
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-black/5 bg-navy/[0.03] p-5 text-sm text-body">
        <p className="font-semibold text-navy">How pricing works</p>
        <p className="mt-1">
          Each SkyFots service is priced from its carrier&apos;s rate card by <strong>destination zone</strong> and{" "}
          <strong>weight</strong>. Zones (country → zone) are pre-loaded. Upload each carrier&apos;s rate card as a CSV
          to set prices; re-upload any time prices change.
        </p>
        <p className="mt-2">
          CSV format: first column <code>KG</code>, then one column per zone (<code>Zone 1</code>, <code>Zone 2</code>…),
          each cell the total price in Naira. Example header:{" "}
          <code className="text-navy">KG,Zone 1,Zone 2,Zone 3,…</code>
        </p>
      </div>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-body">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f5f5f5] text-xs uppercase tracking-wide text-body">
              <tr>
                <th className="px-5 py-3">Carrier (service)</th>
                <th className="px-5 py-3">Countries</th>
                <th className="px-5 py-3">Zones</th>
                <th className="px-5 py-3">Rates set</th>
                {canManage ? <th className="px-5 py-3">Upload rate card (CSV)</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rows.map((row) => (
                <tr key={row.carrier} className="hover:bg-[#f5f5f5]">
                  <td className="px-5 py-4 font-semibold text-navy">{row.label}</td>
                  <td className="px-5 py-4 text-body">{row.countries}</td>
                  <td className="px-5 py-4 text-body">{row.zones}</td>
                  <td className="px-5 py-4">
                    {row.rate_cells > 0 ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {row.rate_cells} rates
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        Not set
                      </span>
                    )}
                  </td>
                  {canManage ? (
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          ref={(el) => {
                            fileRefs.current[row.carrier] = el;
                          }}
                          type="file"
                          accept=".csv,text/csv"
                          className="text-xs text-body file:mr-2 file:rounded-lg file:border-0 file:bg-navy/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy"
                        />
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => upload(row.carrier)}
                          disabled={busy === row.carrier}
                        >
                          {busy === row.carrier ? "Uploading…" : "Upload"}
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
