import { proxyAuthed } from "@/lib/authed-fetch";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAuthed(`/admin/customers/${id}/addresses`, { method: "GET" });
}
