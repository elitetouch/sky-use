import Image from "next/image";
import { PrintButton } from "@/components/admin/PrintButton";
import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { AdminShipment, BusinessSetting, Office } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import { formatPhone } from "@/lib/phone";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const EMPTY_BUSINESS: BusinessSetting = {
  rc_number: null,
  email: null,
  phones: [],
};

export default async function ShipmentReceiptPage({ params }: Props) {
  const { id } = await params;
  const token = await getSessionToken();

  const [shipment, offices, business] = await Promise.all([
    apiFetch<AdminShipment>(`/admin/shipments/${id}`, { token: token! }),
    apiFetch<Office[]>("/admin/offices", { token: token! }).catch(
      () => [] as Office[],
    ),
    apiFetch<BusinessSetting>("/admin/business-settings", {
      token: token!,
    }).catch(() => EMPTY_BUSINESS),
  ]);

  return (
    <main className="p-6 print:p-0 print:bg-white">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="relative mx-auto max-w-4xl rounded-xl border bg-white p-8 shadow-lg print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        {/* Watermark Logo */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.08]">
          <Image
            src="/brand/skyfots-logo.png"
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
              src="/brand/skyfots-logo.png"
              alt="Skyfots Global"
              width={220}
              height={90}
              className="mx-auto object-contain"
            />

            {/* Office addresses */}
            {offices.length > 0 ? (
              <div className="mx-auto mt-4 max-w-2xl space-y-1 text-sm text-gray-700">
                {offices.map((office) => (
                  <p key={office.id}>
                    <span className="font-semibold text-navy">
                      {office.name}:
                    </span>{" "}
                    <span className="whitespace-pre-line">
                      {office.address}
                    </span>
                  </p>
                ))}
              </div>
            ) : null}

            {/* Business-wide contact details */}
            {(business.phones.length > 0 ||
              business.email ||
              business.rc_number) && (
              <div className="mt-3 text-sm text-gray-600">
                {business.phones.length > 0 ? (
                  <p>
                    {business.phones.map((p) => formatPhone(p)).join("  •  ")}
                  </p>
                ) : null}
                {business.email ? <p>{business.email}</p> : null}
                {business.rc_number ? (
                  <p className="mt-1 font-semibold text-navy">
                    RC: {business.rc_number}
                  </p>
                ) : null}
              </div>
            )}

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

                <p>
                  {shipment.sender_address?.city}
                  {shipment.sender_address?.country
                    ? `, ${shipment.sender_address.country}`
                    : ""}
                </p>
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

                <p>
                  {shipment.receiver_address?.city}
                  {shipment.receiver_address?.country
                    ? `, ${shipment.receiver_address.country}`
                    : ""}
                </p>
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

              {shipment.carrier && (
                <div>
                  <p className="text-gray-500">Carrier</p>

                  <p className="font-semibold">{shipment.carrier}</p>
                </div>
              )}

              {shipment.declared_value_kobo ? (
                <div>
                  <p className="text-gray-500">Declared Value</p>

                  <p className="font-semibold">
                    {formatNaira(shipment.declared_value_kobo)}
                  </p>
                </div>
              ) : null}
            </div>

            {shipment.description && (
              <p className="mt-4 text-sm text-gray-700">
                Description: {shipment.description}
              </p>
            )}
          </section>

          {/* Items */}
          {shipment.items && shipment.items.length > 0 && (
            <section className="mt-6 rounded-lg border p-5">
              <h2 className="text-sm font-bold uppercase text-navy">Items</h2>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-4 font-semibold">Description</th>
                      <th className="py-2 pr-4 text-right font-semibold">
                        Weight (kg)
                      </th>
                      <th className="py-2 text-right font-semibold">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipment.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-2 pr-4 text-gray-700">
                          {item.description}
                        </td>
                        <td className="py-2 pr-4 text-right text-gray-700">
                          {item.weight_kg}
                        </td>
                        <td className="py-2 text-right text-gray-700">
                          {formatNaira(item.cost_kobo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Payment */}
          <section className="mt-6 rounded-lg bg-gray-50 p-5">
            <h2 className="text-sm font-bold uppercase text-navy">Payment</h2>

            <div className="mt-4 space-y-3 text-sm">
              {shipment.handling_kobo > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Handling</span>
                  <span>{formatNaira(shipment.handling_kobo)}</span>
                </div>
              )}

              {shipment.freight_kobo > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Freight Charge</span>
                  <span>{formatNaira(shipment.freight_kobo)}</span>
                </div>
              )}

              {shipment.insurance_kobo > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Insurance Charge</span>
                  <span>{formatNaira(shipment.insurance_kobo)}</span>
                </div>
              )}

              <div className="flex justify-between border-t pt-3">
                <span>Total Amount</span>

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

              {shipment.paid_at && shipment.payment_method_label && (
                <div className="flex justify-between">
                  <span>Payment Method</span>

                  <strong>{shipment.payment_method_label}</strong>
                </div>
              )}
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-10 border-t pt-6 text-sm text-gray-600">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Office Details */}
              <section>
                <h2 className="font-bold text-navy">Booking Office</h2>

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
              Thank you for choosing SkyFots Global Logistics.
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
