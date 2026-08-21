import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { getSessionToken, getCurrentUser, can } from "@/lib/session";
import type { Office } from "@/lib/types";
import { AdminBookingForm } from "@/components/admin/AdminBookingForm";
import { NoAccess } from "@/components/admin/NoAccess";

export const metadata: Metadata = {
  title: "Book Shipment",
};

export default async function AdminBookShipmentPage() {
  const user = await getCurrentUser();
  if (!can(user, "shipments.create")) {
    return <NoAccess area="Book Shipment" />;
  }
  const token = await getSessionToken();
  const offices = await apiFetch<Office[]>("/admin/offices", { token: token! });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Book a Shipment</h1>
      <p className="mt-1 text-body">Book on behalf of a walk-in customer and print their receipt.</p>

      <div className="mt-6 max-w-3xl">
        <AdminBookingForm offices={offices} canRecordPayment={can(user, "shipments.payment")} />
      </div>
    </div>
  );
}
