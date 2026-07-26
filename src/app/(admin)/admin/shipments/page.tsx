import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { AdminShipment, PaginatedResult, StatusTemplate } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import { ShipmentStatusFilter } from "@/components/admin/ShipmentStatusFilter";

export const metadata: Metadata = {
  title: "Shipments",
};

export default async function AdminShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status_template_id?: string }>;
}) {
  const { status_template_id: statusTemplateId } = await searchParams;
  const token = await getSessionToken();

  const query = statusTemplateId ? `?filter[status_template_id]=${statusTemplateId}` : "";
  const [{ items: shipments }, templates] = await Promise.all([
    apiFetch<PaginatedResult<AdminShipment>>(`/admin/shipments${query}`, { token: token! }),
    apiFetch<StatusTemplate[]>("/admin/status-templates?active_only=1", { token: token! }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Shipments</h1>
      <p className="mt-1 text-body">All shipments booked across the platform.</p>

      <div className="mt-4 max-w-sm">
        <ShipmentStatusFilter templates={templates} selectedId={statusTemplateId ?? ""} />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/5">
        {shipments.length === 0 ? (
          <p className="p-6 text-sm text-body">No shipments found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f5f5f5] text-xs uppercase tracking-wide text-body">
              <tr>
                <th className="px-5 py-3">Tracking #</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Mode</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Booked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {shipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-[#f5f5f5]">
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/shipments/${shipment.id}`}
                      className="font-semibold text-navy hover:text-red"
                    >
                      {shipment.tracking_number}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-body">{shipment.user?.name ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-semibold text-navy">
                      {shipment.status_label}
                    </span>
                  </td>
                  <td className="px-5 py-4 capitalize text-body">{shipment.mode}</td>
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
