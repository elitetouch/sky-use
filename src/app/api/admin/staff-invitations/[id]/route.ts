import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return proxyAuthed(`/admin/staff-invitations/${id}`, { method: "DELETE" });
}
