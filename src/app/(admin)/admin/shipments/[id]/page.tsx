import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { AdminShipment } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import { UpdateStatusForm } from "@/components/admin/UpdateStatusForm";
import { AssignCourierForm } from "@/components/admin/AssignCourierForm";

export const metadata: Metadata = {
  title: "Shipment Detail",
};

export default async function AdminShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getSessionToken();

  let shipment: AdminShipment;

  try {
    shipment = await apiFetch<AdminShipment>(`/admin/shipments/${id}`, { token: token! });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-body">Tracking Number</p>
          <h1 className="text-2xl font-bold text-navy">{shipment.tracking_number}</h1>
        </div>
        <span className="rounded-full bg-navy px-4 py-1.5 text-sm font-semibold text-white">
          {shipment.status_label}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-black/5 p-6">
            <p className="text-sm font-semibold text-navy">Customer</p>
            <p className="mt-2 text-sm text-body">{shipment.user?.name}</p>
            <p className="text-sm text-body">{shipment.user?.email}</p>
            <p className="text-sm text-body">{shipment.user?.phone}</p>
          </div>

          <div className="rounded-2xl border border-black/5 p-6">
            <p className="text-sm font-semibold text-navy">Package Details</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-body">Service</p>
                <p className="font-semibold capitalize text-navy">{shipment.service_level}</p>
              </div>
              <div>
                <p className="text-body">Mode</p>
                <p className="font-semibold capitalize text-navy">{shipment.mode}</p>
              </div>
              <div>
                <p className="text-body">Weight</p>
                <p className="font-semibold text-navy">{shipment.weight_kg} kg</p>
              </div>
            </div>
            {shipment.description ? <p className="mt-4 text-sm text-body">{shipment.description}</p> : null}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {shipment.sender_address ? (
              <div className="rounded-2xl border border-black/5 p-6">
                <p className="text-sm font-semibold text-navy">From</p>
                <p className="mt-2 text-sm text-body">{shipment.sender_address.contact_name}</p>
                <p className="text-sm text-body">{shipment.sender_address.phone}</p>
                <p className="mt-1 text-sm text-body">
                  {shipment.sender_address.line1}, {shipment.sender_address.city}
                </p>
              </div>
            ) : null}
            {shipment.receiver_address ? (
              <div className="rounded-2xl border border-black/5 p-6">
                <p className="text-sm font-semibold text-navy">To</p>
                <p className="mt-2 text-sm text-body">{shipment.receiver_address.contact_name}</p>
                <p className="text-sm text-body">{shipment.receiver_address.phone}</p>
                <p className="mt-1 text-sm text-body">
                  {shipment.receiver_address.line1}, {shipment.receiver_address.city}
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-black/5 p-6">
            <p className="text-sm font-semibold text-navy">Shipment Timeline</p>
            <ol className="mt-4 space-y-4 border-l-2 border-navy/10 pl-4">
              {(shipment.status_events ?? []).map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-red" />
                  <p className="text-sm font-semibold text-navy">{event.label}</p>
                  {event.location ? <p className="text-xs text-body">{event.location}</p> : null}
                  {event.note ? <p className="text-xs text-body">{event.note}</p> : null}
                  <p className="mt-1 text-xs text-body/70">{new Date(event.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-navy p-6 text-white">
            <p className="text-sm text-white/70">Price</p>
            <p className="mt-1 text-3xl font-extrabold">
              {shipment.price_kobo !== null ? formatNaira(shipment.price_kobo) : "—"}
            </p>
            <p className="mt-2 text-sm text-white/70">
              {shipment.paid_at ? `Paid on ${new Date(shipment.paid_at).toLocaleDateString()}` : "Unpaid"}
            </p>
          </div>

          <UpdateStatusForm shipmentId={shipment.id} currentStatus={shipment.status} />
          <AssignCourierForm
            shipmentId={shipment.id}
            currentCourier={shipment.courier}
            currentTrackingNumber={shipment.courier_tracking_number}
          />
        </div>
      </div>
    </div>
  );
}
