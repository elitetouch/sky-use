import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { AdminShipment, StatusTemplate } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import Link from "next/link";
import { UpdateStatusForm } from "@/components/admin/UpdateStatusForm";
import { AssignCourierForm } from "@/components/admin/AssignCourierForm";
import { PaymentStatusForm } from "@/components/admin/PaymentStatusForm";
import { DeleteShipmentButton } from "@/components/admin/DeleteShipmentButton";

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

  // The milestone list is secondary UI (the status dropdown). If the API is
  // unavailable or behind (missing this endpoint), still render the shipment
  // rather than crashing the whole page.
  let templates: StatusTemplate[] = [];
  try {
    templates = await apiFetch<StatusTemplate[]>("/admin/status-templates?active_only=1", { token: token! });
  } catch {
    templates = [];
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-body">Tracking Number</p>
          <h1 className="text-2xl font-bold text-navy">{shipment.tracking_number}</h1>
          <p className="mt-1 text-xs text-body">
            Booked by {shipment.booked_by ?? "—"}
            {shipment.updated_by ? ` · Last updated by ${shipment.updated_by}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-navy px-4 py-1.5 text-sm font-semibold text-white">
            {shipment.status_label}
          </span>
          <Link
            href={`/admin/shipments/${shipment.id}/edit`}
            className="rounded-lg border border-navy/20 px-4 py-1.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white"
          >
            Edit
          </Link>
          <Link
            href={`/admin/shipments/${shipment.id}/receipt`}
            className="rounded-lg border border-navy/20 px-4 py-1.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white"
          >
            Receipt
          </Link>
        </div>
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
                <p className="font-semibold text-navy">{shipment.service_label}</p>
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
                  {event.link ? (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-block break-all text-xs font-semibold text-red hover:underline"
                    >
                      {event.link}
                    </a>
                  ) : null}
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
          </div>

          <PaymentStatusForm
            shipmentId={shipment.id}
            paidAt={shipment.paid_at}
            paymentMethod={shipment.payment_method}
            paymentMethodLabel={shipment.payment_method_label}
          />

          <UpdateStatusForm
            shipmentId={shipment.id}
            currentTemplateId={shipment.status_template_id}
            templates={templates}
          />
          <AssignCourierForm
            shipmentId={shipment.id}
            currentCourier={shipment.courier}
            currentTrackingNumber={shipment.courier_tracking_number}
          />

          <DeleteShipmentButton shipmentId={shipment.id} trackingNumber={shipment.tracking_number} />
        </div>
      </div>
    </div>
  );
}
