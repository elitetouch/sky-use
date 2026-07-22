import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  return proxyAuthed(`/admin/offices/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return proxyAuthed(`/admin/offices/${id}`, { method: "DELETE" });
}
