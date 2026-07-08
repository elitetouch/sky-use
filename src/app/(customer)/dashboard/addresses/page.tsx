import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { Address } from "@/lib/types";
import { AddressManager } from "@/components/dashboard/AddressManager";

export const metadata: Metadata = {
  title: "Addresses",
};

export default async function AddressesPage() {
  const token = await getSessionToken();
  const addresses = await apiFetch<Address[]>("/addresses", { token: token! });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Addresses</h1>
      <p className="mt-1 text-body">Manage the sender and receiver addresses you book shipments with.</p>

      <div className="mt-6">
        <AddressManager initialAddresses={addresses} />
      </div>
    </div>
  );
}
