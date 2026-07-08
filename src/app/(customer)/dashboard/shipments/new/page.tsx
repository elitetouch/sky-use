import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { Address } from "@/lib/types";
import { BookShipmentForm } from "@/components/dashboard/BookShipmentForm";

export const metadata: Metadata = {
  title: "Book a Shipment",
};

export default async function NewShipmentPage() {
  const token = await getSessionToken();
  const addresses = await apiFetch<Address[]>("/addresses", { token: token! });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Book a Shipment</h1>
      <p className="mt-1 text-body">Enter your package details to get an instant price.</p>

      {addresses.length < 2 ? (
        <div className="mt-6 rounded-2xl border border-black/5 p-6">
          <p className="text-body">
            You need at least two saved addresses (sender and receiver) before you can book a shipment.
          </p>
          <Link href="/dashboard/addresses" className="mt-3 inline-block font-semibold text-navy hover:text-red">
            Add an address &rarr;
          </Link>
        </div>
      ) : (
        <div className="mt-6 max-w-xl">
          <BookShipmentForm addresses={addresses} />
        </div>
      )}
    </div>
  );
}
