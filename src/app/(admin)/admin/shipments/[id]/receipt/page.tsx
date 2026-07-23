import Image from "next/image";
import { PrintButton } from "@/components/admin/PrintButton";
import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { AdminShipment } from "@/lib/types";
import { formatNaira } from "@/lib/types";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ShipmentReceiptPage({ params }: Props) {
  const { id } = await params;
  const token = await getSessionToken();

  const shipment = await apiFetch<AdminShipment>(`/admin/shipments/${id}`, {
    token: token!,
  });

  return (
    <main className="p-6 print:p-0 print:bg-white">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="relative mx-auto max-w-4xl rounded-xl border bg-white p-8 shadow-lg print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        {/* Watermark Logo */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.08]">
          <Image
            src="brand/skyfots-logo.png"
            alt=""
            width={420}
            height={420}
            className="object-contain"
          />
        </div>

        {/* Receipt Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="border-b pb-6 text-center">
            <Image
              src="brand/skyfots-logo.png"
              alt="Skyfots Global"
              width={220}
              height={90}
              className="mx-auto object-contain"
            />

            <p className="mt-2 text-sm text-gray-500">
              Logistics & Courier Services
            </p>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tracking Number
              </p>

              <p className="text-xl font-bold text-navy">
                {shipment.tracking_number}
              </p>

              <span className="mt-3 inline-block rounded-full bg-navy px-4 py-1.5 text-sm font-semibold text-white">
                {shipment.status_label}
              </span>
            </div>
          </div>

          {/* Customer */}
          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase text-navy">Customer</h2>

            <div className="mt-2 text-sm text-gray-700">
              <p className="font-semibold">{shipment.user?.name}</p>

              <p>{shipment.user?.email}</p>

              <p>{shipment.user?.phone}</p>
            </div>
          </section>

          {/* Sender / Receiver */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <section className="rounded-lg border p-5">
              <h2 className="text-sm font-bold uppercase text-navy">From</h2>

              <div className="mt-3 text-sm text-gray-700">
                <p className="font-semibold">
                  {shipment.sender_address?.contact_name}
                </p>

                <p>{shipment.sender_address?.phone}</p>

                <p className="mt-2">{shipment.sender_address?.line1}</p>

                <p>{shipment.sender_address?.city}</p>
              </div>
            </section>

            <section className="rounded-lg border p-5">
              <h2 className="text-sm font-bold uppercase text-navy">To</h2>

              <div className="mt-3 text-sm text-gray-700">
                <p className="font-semibold">
                  {shipment.receiver_address?.contact_name}
                </p>

                <p>{shipment.receiver_address?.phone}</p>

                <p className="mt-2">{shipment.receiver_address?.line1}</p>

                <p>{shipment.receiver_address?.city}</p>
              </div>
            </section>
          </div>

          {/* Package Details */}
          <section className="mt-6 rounded-lg border p-5">
            <h2 className="text-sm font-bold uppercase text-navy">
              Package Details
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-gray-500">Service</p>

                <p className="font-semibold capitalize">
                  {shipment.service_level}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Mode</p>

                <p className="font-semibold capitalize">{shipment.mode}</p>
              </div>

              <div>
                <p className="text-gray-500">Weight</p>

                <p className="font-semibold">{shipment.weight_kg} kg</p>
              </div>
            </div>

            {shipment.description && (
              <p className="mt-4 text-sm text-gray-700">
                Description: {shipment.description}
              </p>
            )}
          </section>

          {/* Payment */}
          <section className="mt-6 rounded-lg bg-gray-50 p-5">
            <h2 className="text-sm font-bold uppercase text-navy">Payment</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Total Cost</span>

                <strong>
                  {shipment.price_kobo !== null
                    ? formatNaira(shipment.price_kobo)
                    : "—"}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>Payment Status</span>

                <strong>{shipment.paid_at ? "Paid" : "Unpaid"}</strong>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-10 border-t pt-6 text-sm text-gray-600">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Office Details */}
              <section>
                <h2 className="font-bold text-navy">Office</h2>

                <div className="mt-3 space-y-1">
                  <p className="font-semibold">
                    {shipment.office?.name ?? "Skyfots Global"}
                  </p>

                  {shipment.office?.address && <p>{shipment.office.address}</p>}
                </div>
              </section>

              {/* Contact */}
              {/* <section>
                <h2 className="font-bold text-navy">Contact</h2>

                <div className="mt-3 space-y-1">
                  {shipment.office?.phone && (
                    <p>Phone: {shipment.office.phone}</p>
                  )}
                </div>
              </section> */}
            </div>

            {/* Terms */}
            {shipment.office?.terms_and_conditions && (
              <section className="mt-8">
                <h2 className="font-bold text-navy">Terms & Conditions</h2>

                <div className="mt-3 whitespace-pre-line">
                  {shipment.office.terms_and_conditions}
                </div>
              </section>
            )}

            <p className="mt-8 text-center font-semibold text-navy">
              Thank you for choosing Skyfots Global.
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
