import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return proxyAuthed(`/admin/shipments/terminal-import/${encodeURIComponent(id)}`, { method: "GET" });
}
