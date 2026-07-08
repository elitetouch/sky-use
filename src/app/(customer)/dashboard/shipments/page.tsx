import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { PaginatedResult, Shipment } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "My Shipments",
};

export default async function ShipmentsPage() {
  const token = await getSessionToken();
  const { items: shipments } = await apiFetch<PaginatedResult<Shipment>>("/shipments", { token: token! });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">My Shipments</h1>
          <p className="mt-1 text-body">All the shipments you&apos;ve booked.</p>
        </div>
        <LinkButton href="/dashboard/shipments/new" variant="accent">
          + Book a Shipment
        </LinkButton>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/5">
        {shipments.length === 0 ? (
          <p className="p-6 text-sm text-body">You haven&apos;t booked any shipments yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f5f5f5] text-xs uppercase tracking-wide text-body">
              <tr>
                <th className="px-5 py-3">Tracking #</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Booked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {shipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-[#f5f5f5]">
                  <td className="px-5 py-4">
                    <Link
                      href={`/dashboard/shipments/${shipment.id}`}
                      className="font-semibold text-navy hover:text-red"
                    >
                      {shipment.tracking_number}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-semibold text-navy">
                      {shipment.status_label}
                    </span>
                  </td>
                  <td className="px-5 py-4 capitalize text-body">{shipment.service_level}</td>
                  <td className="px-5 py-4 text-body">
                    {shipment.price_kobo !== null ? formatNaira(shipment.price_kobo) : "—"}
                  </td>
                  <td className="px-5 py-4 text-body">{new Date(shipment.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
