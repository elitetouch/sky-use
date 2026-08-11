import Image from "next/image";
import { PrintButton } from "@/components/admin/PrintButton";
import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { Address, AdminShipment, BusinessSetting, Office } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import { formatPhone } from "@/lib/phone";
import { formatEstimatedDelivery } from "@/lib/delivery";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function AddressBlock({ address }: { address?: Address }) {
  if (!address) return null;

  const cityState = [address.city, address.state].filter(Boolean).join(", ");
  const cityLine = [cityState, address.postal_code].filter(Boolean).join(" ");

  return (
    <div className="mt-3 text-sm text-gray-700">
      <p className="font-semibold">{address.contact_name}</p>
      <p>{address.phone}</p>
      {address.email ? <p>{address.email}</p> : null}
      <p className="mt-2">{address.line1}</p>
      {address.line2 ? <p>{address.line2}</p> : null}
      {cityLine ? <p>{cityLine}</p> : null}
      {address.country ? <p>{address.country}</p> : null}
    </div>
  );
}

const EMPTY_BUSINESS: BusinessSetting = {
  rc_number: null,
  email: null,
  website: null,
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
        <PrintButton fileName={`SkyFots Global Logistics-${shipment.tracking_number}`} />
      </div>

      {/* Print watermark: Chrome does not repeat position:fixed on every printed
          page. Instead we repeat a page-proportioned (A4, 840x1188) transparent
          PNG tile with the faded logo centered in it; sized to 100% width, each
          tile is one page tall, so exactly one centered watermark lands on every
          printed page. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .receipt-watermark-screen { display: none !important; }
              .receipt-sheet {
                background-image: url('/brand/watermark-tile.png');
                background-repeat: repeat-y;
                background-position: center top;
                background-size: 100% auto;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          `,
        }}
      />

      <div className="receipt-sheet relative mx-auto max-w-4xl rounded-xl border bg-white p-8 shadow-lg print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        {/* Watermark Logo — shown centered on screen only; print uses the tiled
            background above so it appears on every printed page. */}
        <div className="receipt-watermark-screen pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-[0.08]">
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
          {/* Header — company letterhead */}
          <div className="border-b pb-6">
            {/* Logo + RC */}
            <div className="flex items-start justify-between gap-4">
              <Image
                src="/brand/skyfots-logo.png"
                alt="Skyfots Global"
                width={220}
                height={90}
                className="object-contain"
              />
              {business.rc_number ? (
                <p className="text-sm font-semibold text-navy">
                  RC: {business.rc_number}
                </p>
              ) : null}
            </div>

            {/* Addresses / contacts (left) + date (right) */}
            <div className="mt-4 flex items-start justify-between gap-6">
              <div className="space-y-1 text-sm text-gray-700">
                {offices.map((office) => (
                  <p key={office.id}>
                    <span className="font-semibold text-navy">{office.name}:</span>{" "}
                    <span className="whitespace-pre-line">{office.address}</span>
                  </p>
                ))}
                {business.phones.length > 0 ? (
                  <p>
                    <span className="font-semibold text-navy">Tel:</span>{" "}
                    {business.phones.map((p) => formatPhone(p)).join(", ")}
                  </p>
                ) : null}
                {(business.email || business.website) && (
                  <p className="flex flex-wrap gap-x-6 gap-y-1">
                    {business.email ? (
                      <span>
                        <span className="font-semibold text-navy">Email:</span>{" "}
                        {business.email}
                      </span>
                    ) : null}
                    {business.website ? (
                      <span>
                        <span className="font-semibold text-navy">Website:</span>{" "}
                        {business.website}
                      </span>
                    ) : null}
                  </p>
                )}
              </div>

              <p className="whitespace-nowrap text-sm text-gray-700">
                <span className="font-semibold text-navy">Date:</span>{" "}
                {new Date(shipment.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Tracking number + status */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tracking Number
                </p>
                <p className="text-xl font-bold text-navy">{shipment.tracking_number}</p>
              </div>
              <span className="inline-block rounded-full bg-navy px-4 py-1.5 text-sm font-semibold text-white">
                {shipment.status_label}
              </span>
            </div>

            {formatEstimatedDelivery(
              shipment.estimated_delivery_date,
              shipment.estimated_delivery_window,
            ) ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Estimated Delivery
                </p>
                <p className="text-lg font-bold text-navy">
                  {formatEstimatedDelivery(
                    shipment.estimated_delivery_date,
                    shipment.estimated_delivery_window,
                  )}
                </p>
              </div>
            ) : null}
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
              <AddressBlock address={shipment.sender_address} />
            </section>

            <section className="rounded-lg border p-5">
              <h2 className="text-sm font-bold uppercase text-navy">To</h2>
              <AddressBlock address={shipment.receiver_address} />
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

                <p className="font-semibold">{shipment.service_label}</p>
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
                      <th className="py-2 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipment.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-2 pr-4 text-gray-700">
                          {item.description}
                        </td>
                        <td className="py-2 text-right text-gray-700">
                          {item.cost_kobo > 0 ? formatNaira(item.cost_kobo) : ""}
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
