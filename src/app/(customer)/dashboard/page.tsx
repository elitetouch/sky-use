import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getCurrentUser, getSessionToken } from "@/lib/session";
import type { PaginatedResult, Shipment, Wallet } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const [user, token] = await Promise.all([getCurrentUser(), getSessionToken()]);

  const [wallet, shipments] = await Promise.all([
    apiFetch<Wallet>("/wallet", { token: token! }),
    apiFetch<PaginatedResult<Shipment>>("/shipments", { token: token! }),
  ]);

  const recentShipments = shipments.items.slice(0, 5);
  const inTransitCount = shipments.items.filter(
    (s) => !["delivered", "cancelled"].includes(s.status),
  ).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Welcome back, {user?.name.split(" ")[0]}</h1>
      <p className="mt-1 text-body">Here&apos;s what&apos;s happening with your shipments.</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl bg-navy p-6 text-white">
          <p className="text-sm text-white/70">Wallet Balance</p>
          <p className="mt-1 text-2xl font-extrabold">{formatNaira(wallet.balance_kobo)}</p>
          <Link href="/dashboard/wallet" className="mt-3 inline-block text-sm font-semibold text-yellow">
            Fund wallet &rarr;
          </Link>
        </div>
        <div className="rounded-2xl border border-black/5 p-6">
          <p className="text-sm text-body">Total Shipments</p>
          <p className="mt-1 text-2xl font-extrabold text-navy">{shipments.meta.total}</p>
        </div>
        <div className="rounded-2xl border border-black/5 p-6">
          <p className="text-sm text-body">In Transit</p>
          <p className="mt-1 text-2xl font-extrabold text-navy">{inTransitCount}</p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm font-semibold text-navy">Recent Shipments</p>
        <LinkButton href="/dashboard/shipments/new" variant="accent" size="sm">
          + Book a Shipment
        </LinkButton>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-black/5">
        {recentShipments.length === 0 ? (
          <p className="p-6 text-sm text-body">
            You haven&apos;t booked any shipments yet.{" "}
            <Link href="/dashboard/shipments/new" className="font-semibold text-navy hover:text-red">
              Book your first one
            </Link>
            .
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f5f5f5] text-xs uppercase tracking-wide text-body">
              <tr>
                <th className="px-5 py-3">Tracking #</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {recentShipments.map((shipment) => (
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
                  <td className="px-5 py-4 text-body">
                    {shipment.price_kobo !== null ? formatNaira(shipment.price_kobo) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
