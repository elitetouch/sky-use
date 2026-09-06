import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { Address } from "@/lib/types";
import { BookShipmentForm } from "@/components/dashboard/BookShipmentForm";

export const metadata: Metadata = {
  title: "Book a Shipment",
};

export default async function NewShipmentPage() {
  const token = await getSessionToken();
  // Addresses are optional now — first-time users can type them inline.
  const addresses = await apiFetch<Address[]>("/addresses", { token: token! }).catch(() => [] as Address[]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Book a Shipment</h1>
      <p className="mt-1 text-body">Enter your package details to get an instant price.</p>

      <div className="mt-6 max-w-2xl">
        <BookShipmentForm addresses={addresses} />
      </div>
    </div>
  );
}
