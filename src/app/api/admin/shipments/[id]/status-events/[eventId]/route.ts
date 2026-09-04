import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const { id, eventId } = await params;
  const body = await request.json();

  return proxyAuthed(`/admin/shipments/${id}/status-events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const { id, eventId } = await params;

  return proxyAuthed(`/admin/shipments/${id}/status-events/${eventId}`, { method: "DELETE" });
}
