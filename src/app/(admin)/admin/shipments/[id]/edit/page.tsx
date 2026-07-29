import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { AdminShipment } from "@/lib/types";
import { EditShipmentForm } from "@/components/admin/EditShipmentForm";

export const metadata: Metadata = {
  title: "Edit Shipment",
};

export default async function EditShipmentPage({ params }: { params: Promise<{ id: string }> }) {
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
      <p className="text-xs font-semibold uppercase tracking-wide text-body">Edit Shipment</p>
      <h1 className="text-2xl font-bold text-navy">{shipment.tracking_number}</h1>

      <div className="mt-6 max-w-3xl">
        <EditShipmentForm shipment={shipment} />
      </div>
    </div>
  );
}
