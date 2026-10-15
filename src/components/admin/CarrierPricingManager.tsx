"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/carrier-pricing");
        const json = await res.json();
        if (active) setRows(json.data ?? []);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-black/5 bg-navy/[0.03] p-5 text-sm text-body">
        <p className="font-semibold text-navy">How pricing works</p>
        <p className="mt-1">
          Each SkyFots service is priced from its carrier&apos;s rate card by <strong>destination zone</strong> and{" "}
          <strong>weight</strong>. Open a carrier to see its rates as a table, edit any price, add zones and weight
          rows, choose which countries belong to each zone, upload prices for a single zone, download the current
          rates, or clear them.
        </p>
      </div>

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
                <th className="px-5 py-3 text-right"></th>
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
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/carrier-pricing/${row.carrier}`}
                      className="inline-flex whitespace-nowrap rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
                    >
                      {canManage ? "Manage rates" : "View rates"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
