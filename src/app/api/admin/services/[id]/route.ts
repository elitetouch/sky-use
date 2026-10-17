import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

type Params = { params: Promise<{ id: string }> };

// Update a service (name, admin name, delivery estimate, visibility).
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  return proxyAuthed(`/admin/services/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) });
}

// Delete a service and its rate card.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyAuthed(`/admin/services/${encodeURIComponent(id)}`, { method: "DELETE" });
}
