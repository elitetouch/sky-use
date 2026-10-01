import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const senderId = request.nextUrl.searchParams.get("sender_address_id");
  const query = senderId ? `?sender_address_id=${encodeURIComponent(senderId)}` : "";
  return proxyAuthed(`/admin/customers/${id}/receivers${query}`, { method: "GET" });
}
