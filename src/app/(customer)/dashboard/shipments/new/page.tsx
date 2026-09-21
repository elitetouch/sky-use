import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { Address } from "@/lib/types";
import { BookShipmentForm } from "@/components/dashboard/BookShipmentForm";

export const metadata: Metadata = {
  title: "Book a Shipment",
};

type Draft = { id: string; data: Record<string, unknown> };

export default async function NewShipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const { draft: draftId } = await searchParams;
  const token = await getSessionToken();
  // Addresses are optional now — first-time users can type them inline.
  const addresses = await apiFetch<Address[]>("/addresses", { token: token! }).catch(() => [] as Address[]);

  const draft = draftId
    ? await apiFetch<Draft>(`/shipment-drafts/${draftId}`, { token: token! }).catch(() => null)
    : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Book a Shipment</h1>
      <p className="mt-1 text-body">
        {draft ? "Resuming your saved draft — review and complete it." : "Enter your package details to get an instant price."}
      </p>

      <div className="mt-6 max-w-2xl">
        <BookShipmentForm addresses={addresses} initialDraft={draft} />
      </div>
    </div>
  );
}
