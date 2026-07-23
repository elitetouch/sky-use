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

      <div className="mx-auto max-w-4xl rounded-xl border bg-white p-8 shadow-lg print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        {/* Header */}
        <div className="border-b pb-6 text-center">
          <h1 className="text-3xl font-bold text-navy">SKYFOTS GLOBAL</h1>

          <p className="text-sm text-gray-500">Logistics & Courier Services</p>

          <div className="mt-4">
            <p className="text-sm text-gray-500">Tracking Number</p>

            <p className="text-xl font-bold text-navy">
              {shipment.tracking_number}
            </p>

            <span className="mt-2 inline-block rounded-full bg-navy px-4 py-1 text-sm text-white">
              {shipment.status_label}
            </span>
          </div>
        </div>

        {/* Customer */}
        <section className="mt-6">
          <h2 className="font-bold text-navy">Customer</h2>

          <p>{shipment.user?.name}</p>
          <p>{shipment.user?.email}</p>
          <p>{shipment.user?.phone}</p>
        </section>

        {/* Addresses */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <section className="rounded-lg border p-4">
            <h2 className="font-bold text-navy">Sender</h2>

            <p>{shipment.sender_address?.contact_name}</p>
            <p>{shipment.sender_address?.phone}</p>
            <p>{shipment.sender_address?.line1}</p>
            <p>{shipment.sender_address?.city}</p>
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="font-bold text-navy">Receiver</h2>

            <p>{shipment.receiver_address?.contact_name}</p>
            <p>{shipment.receiver_address?.phone}</p>
            <p>{shipment.receiver_address?.line1}</p>
            <p>{shipment.receiver_address?.city}</p>
          </section>
        </div>

        {/* Package */}
        <section className="mt-6 rounded-lg border p-4">
          <h2 className="font-bold text-navy">Package Details</h2>

          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Service</p>
              <p className="font-semibold">{shipment.service_level}</p>
            </div>

            <div>
              <p className="text-gray-500">Mode</p>
              <p className="font-semibold">{shipment.mode}</p>
            </div>

            <div>
              <p className="text-gray-500">Weight</p>
              <p className="font-semibold">{shipment.weight_kg} kg</p>
            </div>
          </div>

          {shipment.description && (
            <p className="mt-4">Description: {shipment.description}</p>
          )}
        </section>

        {/* Payment */}
        <section className="mt-6 rounded-lg bg-gray-50 p-5">
          <h2 className="font-bold text-navy">Payment</h2>

          <div className="mt-3 flex justify-between">
            <span>Total Cost</span>

            <strong>
              {shipment.price_kobo !== null
                ? formatNaira(shipment.price_kobo)
                : "—"}
            </strong>
          </div>

          <div className="mt-2 flex justify-between">
            <span>Status</span>

            <strong>{shipment.paid_at ? "Paid" : "Unpaid"}</strong>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t pt-6 text-sm text-gray-500">
          <h3 className="font-bold text-navy">Terms & Conditions</h3>

          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Keep this receipt until delivery is completed.</li>

            <li>Goods must be properly packaged by the sender.</li>

            <li>Claims must be reported within 48 hours.</li>

            <li>Prohibited items will not be accepted.</li>

            <li>
              Delivery timelines may vary due to circumstances beyond our
              control.
            </li>
          </ul>

          <p className="mt-6 text-center">
            Thank you for choosing Skyfots Global.
          </p>
        </footer>
      </div>
    </main>
  );
}
