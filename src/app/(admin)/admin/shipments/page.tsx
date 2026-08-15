import type { Metadata } from "next";
import { formatDate } from "@/lib/datetime";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getSessionToken, getCurrentUser, can } from "@/lib/session";
import type { AdminShipment, PaginatedResult, StatusTemplate } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import { NoAccess } from "@/components/admin/NoAccess";
import { ShipmentStatusFilter } from "@/components/admin/ShipmentStatusFilter";
import { ShipmentPaymentFilter } from "@/components/admin/ShipmentPaymentFilter";
import { ShipmentDateFilter } from "@/components/admin/ShipmentDateFilter";
import { ShipmentSearch } from "@/components/admin/ShipmentSearch";
import { Pagination } from "@/components/admin/Pagination";

export const metadata: Metadata = {
  title: "Shipments",
};

export default async function AdminShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status_template_id?: string;
    search?: string;
    payment?: string;
    date?: string;
    page?: string;
    per_page?: string;
  }>;
}) {
  const { status_template_id: statusTemplateId, search, payment, date, page, per_page: perPage } =
    await searchParams;
  if (!can(await getCurrentUser(), "shipments.view")) {
    return <NoAccess area="shipments" />;
  }
  const token = await getSessionToken();

  const params = new URLSearchParams();
  if (statusTemplateId) params.set("filter[status_template_id]", statusTemplateId);
  if (search) params.set("filter[search]", search);
  if (payment) params.set("filter[payment]", payment);
  if (date) params.set("filter[date]", date);
  if (page && Number(page) > 1) params.set("page", page);
  if (perPage) params.set("per_page", perPage);
  const query = params.toString() ? `?${params.toString()}` : "";
  const [{ items: shipments, meta }, templates] = await Promise.all([
    apiFetch<PaginatedResult<AdminShipment>>(`/admin/shipments${query}`, { token: token! }),
    // Milestone list powers the filter dropdown only — don't let it crash the
    // list page if the API is unavailable or behind.
    apiFetch<StatusTemplate[]>("/admin/status-templates?active_only=1", { token: token! }).catch(
      () => [] as StatusTemplate[],
    ),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Shipments</h1>
      <p className="mt-1 text-body">All shipments booked across the platform.</p>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="w-full lg:max-w-md">
          <ShipmentSearch initialValue={search ?? ""} />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:ml-auto lg:flex">
          <div className="col-span-2 lg:w-72">
            <ShipmentDateFilter selected={date ?? ""} />
          </div>
          <div className="lg:w-44">
            <ShipmentPaymentFilter selected={payment ?? ""} />
          </div>
          <div className="lg:w-56">
            <ShipmentStatusFilter templates={templates} selectedId={statusTemplateId ?? ""} />
          </div>
        </div>
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
                <th className="px-5 py-3">Sender</th>
                <th className="px-5 py-3">Receiver</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Booked by</th>
                <th className="px-5 py-3">Updated by</th>
                <th className="px-5 py-3">Booked</th>
                <th className="px-5 py-3 text-right">Actions</th>
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
                  <td className="px-5 py-4 text-body">{shipment.sender_name ?? "—"}</td>
                  <td className="px-5 py-4 text-body">{shipment.receiver_name ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-semibold text-navy">
                      {shipment.status_label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-body">
                    {shipment.price_kobo !== null ? formatNaira(shipment.price_kobo) : "—"}
                  </td>
                  <td className="px-5 py-4">
                    {shipment.paid_at ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Paid{shipment.payment_method_label ? ` · ${shipment.payment_method_label}` : ""}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-body">{shipment.booked_by ?? "—"}</td>
                  <td className="px-5 py-4 text-body">{shipment.updated_by ?? "—"}</td>
                  <td className="px-5 py-4 text-body">{formatDate(shipment.created_at)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/shipments/${shipment.id}/receipt`}
                      className="inline-block rounded-lg border border-navy/20 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy hover:text-white"
                    >
                      Receipt
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {shipments.length > 0 ? (
        <Pagination
          currentPage={meta.current_page}
          lastPage={meta.last_page}
          perPage={meta.per_page ?? shipments.length}
          total={meta.total}
        />
      ) : null}
    </div>
  );
}
