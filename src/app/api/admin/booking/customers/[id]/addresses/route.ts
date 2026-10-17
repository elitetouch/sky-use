import { proxyAuthed } from "@/lib/authed-fetch";

// A selected customer's sending addresses, for the Book Shipment form.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAuthed(`/admin/booking/customers/${id}/addresses`, { method: "GET" });
}
