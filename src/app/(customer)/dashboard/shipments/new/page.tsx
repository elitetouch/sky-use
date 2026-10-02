import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { getCurrentUser, getSessionToken } from "@/lib/session";
import { BookShipmentForm } from "@/components/dashboard/BookShipmentForm";
import { NinFaceVerify } from "@/components/identity/NinFaceVerify";

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
  const user = await getCurrentUser();

  // Identity gate: customers must verify their NIN before they can book.
  if (!user?.nin_verified) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-navy">Verify your identity to book</h1>
        <p className="mt-1 text-body">
          For everyone&apos;s safety we verify your identity before your first shipment. Enter your NIN and take a quick live
          photo — it only takes a moment.
        </p>
        <div className="mt-6 max-w-md rounded-2xl border border-black/5 p-6">
          <NinFaceVerify refreshOnVerify />
        </div>
      </div>
    );
  }

  // The form loads the profile (sender) address and past receivers itself.
  const draft = draftId
    ? await apiFetch<Draft>(`/shipment-drafts/${draftId}`, { token: token! }).catch(() => null)
    : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Book a Shipment</h1>
      <p className="mt-1 text-body">
        {draft ? "Resuming your saved draft — review and complete it." : "Enter your package details to get an instant price."}
      </p>

      <div className="mt-6 max-w-4xl">
        <BookShipmentForm initialDraft={draft} />
      </div>
    </div>
  );
}
