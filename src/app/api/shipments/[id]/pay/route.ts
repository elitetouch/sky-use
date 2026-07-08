import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return proxyAuthed(`/shipments/${id}/pay`, { method: "POST" });
}
