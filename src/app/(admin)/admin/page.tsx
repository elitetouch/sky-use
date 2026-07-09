import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { getCurrentUser, getSessionToken } from "@/lib/session";
import type { DashboardMetrics } from "@/lib/types";
import { formatNaira } from "@/lib/types";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function AdminDashboardPage() {
  const [user, token] = await Promise.all([getCurrentUser(), getSessionToken()]);
  const metrics = await apiFetch<DashboardMetrics>("/admin/dashboard/metrics", { token: token! });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Welcome back, {user?.name.split(" ")[0]}</h1>
      <p className="mt-1 text-body">Shipment and operations overview.</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-navy p-6 text-white">
          <p className="text-sm text-white/70">Revenue This Month</p>
          <p className="mt-1 text-2xl font-extrabold">{formatNaira(metrics.revenue_this_month_kobo)}</p>
        </div>
        <div className="rounded-2xl border border-black/5 p-6">
          <p className="text-sm text-body">Total Shipments</p>
          <p className="mt-1 text-2xl font-extrabold text-navy">{metrics.shipments_total}</p>
        </div>
        <div className="rounded-2xl border border-black/5 p-6">
          <p className="text-sm text-body">Delivered This Month</p>
          <p className="mt-1 text-2xl font-extrabold text-navy">{metrics.shipments_delivered_this_month}</p>
        </div>
        <div className="rounded-2xl border border-black/5 p-6">
          <p className="text-sm text-body">Pending Invitations</p>
          <p className="mt-1 text-2xl font-extrabold text-navy">{metrics.pending_invitations}</p>
        </div>
        <div className="rounded-2xl border border-black/5 p-6">
          <p className="text-sm text-body">Customers</p>
          <p className="mt-1 text-2xl font-extrabold text-navy">{metrics.customers_total}</p>
        </div>
        <div className="rounded-2xl border border-black/5 p-6">
          <p className="text-sm text-body">Staff</p>
          <p className="mt-1 text-2xl font-extrabold text-navy">{metrics.staff_total}</p>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold text-navy">Shipments by Status</p>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(metrics.shipments_by_status).map(([status, count]) => (
            <div key={status} className="rounded-2xl border border-black/5 p-4 text-center">
              <p className="text-xl font-extrabold text-navy">{count}</p>
              <p className="mt-1 text-xs text-body">{STATUS_LABELS[status] ?? status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
