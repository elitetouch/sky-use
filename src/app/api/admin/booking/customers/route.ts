import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

// Booking-only customer search (gated by shipments.create on the API) — used by
// the Book Shipment form, independent of Customers-page access.
export async function GET(request: NextRequest) {
  const qs = request.nextUrl.searchParams.toString();

  return proxyAuthed(`/admin/booking/customers${qs ? `?${qs}` : ""}`, { method: "GET" });
}
